import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// NOTE: class name kept as GeminiService to avoid churning every consumer.
// Internally it now calls Groq's OpenAI-compatible chat-completions API.
// Swap the provider here; no other file changes.

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
}

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private apiKey?: string;
  private modelName!: string;
  private baseUrl!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.apiKey = this.config.get<string>('GROQ_API_KEY');
    this.modelName = this.config.get<string>(
      'GROQ_MODEL',
      'llama-3.3-70b-versatile',
    );
    this.baseUrl = this.config.get<string>(
      'GROQ_BASE_URL',
      'https://api.groq.com/openai/v1',
    );
    if (!this.apiKey) {
      this.logger.warn(
        'GROQ_API_KEY is not set — LLM calls will fail until you configure it.',
      );
      return;
    }
    this.logger.log(`LLM initialised with Groq model ${this.modelName}`);
  }

  private ensureReady(): string {
    if (!this.apiKey) {
      throw new ServiceUnavailableException({
        code: 'TUTOR_AI_PROVIDER_UNAVAILABLE',
        message: 'LLM is not configured. Set GROQ_API_KEY.',
      });
    }
    return this.apiKey;
  }

  async generateText(
    prompt: string,
    opts?: { systemInstruction?: string; maxOutputTokens?: number },
  ): Promise<string> {
    const apiKey = this.ensureReady();
    try {
      const text = await this.withRetry(() =>
        this.callChat(apiKey, {
          messages: this.buildMessages(prompt, opts?.systemInstruction),
          max_tokens: opts?.maxOutputTokens ?? 1024,
          temperature: 0.4,
        }),
      );
      if (!text) throw new Error('Empty LLM response');
      return text;
    } catch (err) {
      this.logger.error(
        `LLM generateText failed: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException({
        code: 'TUTOR_AI_PROVIDER_UNAVAILABLE',
        message: `LLM request failed: ${(err as Error).message}`,
      });
    }
  }

  async generateJson<T>(
    prompt: string,
    opts?: { systemInstruction?: string; maxOutputTokens?: number },
  ): Promise<T> {
    const apiKey = this.ensureReady();
    let rawText = '';
    try {
      rawText = await this.withRetry(() =>
        this.callChat(apiKey, {
          messages: this.buildMessages(
            prompt,
            `${opts?.systemInstruction ?? ''}\nRespond with a single valid JSON object. No prose, no markdown.`.trim(),
          ),
          max_tokens: opts?.maxOutputTokens ?? 2048,
          temperature: 0.5,
          response_format: { type: 'json_object' },
        }),
      );
      if (!rawText) throw new Error('Empty JSON response from LLM');
      return JSON.parse(this.unwrapJson(rawText)) as T;
    } catch (err) {
      const snippet = rawText
        ? ` | raw: ${rawText.slice(0, 300).replace(/\s+/g, ' ')}`
        : '';
      this.logger.error(
        `LLM generateJson failed: ${(err as Error).message}${snippet}`,
      );
      throw new ServiceUnavailableException({
        code: 'TUTOR_AI_PROVIDER_UNAVAILABLE',
        message: `LLM JSON generation failed: ${(err as Error).message}`,
      });
    }
  }

  private buildMessages(
    prompt: string,
    system: string | undefined,
  ): Array<{ role: 'system' | 'user'; content: string }> {
    const out: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (system) out.push({ role: 'system', content: system });
    out.push({ role: 'user', content: prompt });
    return out;
  }

  private async callChat(
    apiKey: string,
    body: {
      messages: Array<{ role: 'system' | 'user'; content: string }>;
      max_tokens: number;
      temperature: number;
      response_format?: { type: 'json_object' };
    },
  ): Promise<string> {
    const res = await axios.post<ChatCompletionResponse>(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.modelName,
        ...body,
      },
      {
        timeout: 60_000,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const choice = res.data?.choices?.[0];
    return choice?.message?.content ?? '';
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const maxAttempts = 4;
    const baseDelayMs = 800;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (!this.isRetryable(err) || attempt === maxAttempts) {
          throw this.flatten(err);
        }
        const delay = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 250;
        this.logger.warn(
          `LLM transient error (attempt ${attempt}/${maxAttempts}): ${(err as Error).message} — retrying in ${Math.round(delay)}ms`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw this.flatten(lastErr);
  }

  private isRetryable(err: unknown): boolean {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status && [429, 500, 502, 503, 504].includes(status)) return true;
    }
    const msg = (err as Error)?.message ?? '';
    if (/\b(429|500|502|503|504)\b/.test(msg)) return true;
    if (/UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|INTERNAL/i.test(msg))
      return true;
    if (/overloaded|high demand|try again later|rate.?limit/i.test(msg))
      return true;
    return false;
  }

  private flatten(err: unknown): Error {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data as
        | { error?: { message?: string } }
        | undefined;
      const msg =
        data?.error?.message ??
        err.response?.statusText ??
        err.message ??
        'Unknown error';
      return new Error(status ? `${status} ${msg}` : msg);
    }
    return err instanceof Error ? err : new Error(String(err));
  }

  private unwrapJson(text: string): string {
    const trimmed = text.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fenced) return fenced[1].trim();
    return trimmed;
  }
}
