import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private client?: GoogleGenAI;
  private apiKey?: string;
  private modelName!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const key = this.config.get<string>('GOOGLE_API_KEY');
    this.modelName = this.config.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
    if (!key) {
      this.logger.warn(
        'GOOGLE_API_KEY is not set — Gemini calls will fail until you configure it.',
      );
      return;
    }
    this.apiKey = key;
    this.client = new GoogleGenAI({ apiKey: key });
    this.logger.log(`Gemini initialised with model ${this.modelName}`);
  }

  private ensureReady(): GoogleGenAI {
    if (!this.client) {
      throw new ServiceUnavailableException({
        code: 'TUTOR_AI_PROVIDER_UNAVAILABLE',
        message: 'Gemini is not configured. Set GOOGLE_API_KEY.',
      });
    }
    return this.client;
  }

  get googleApiKey(): string | undefined {
    return this.apiKey;
  }

  async generateText(
    prompt: string,
    opts?: { systemInstruction?: string; maxOutputTokens?: number },
  ): Promise<string> {
    const ai = this.ensureReady();
    try {
      const res = await this.withRetry(() =>
        ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: opts?.systemInstruction,
            maxOutputTokens: opts?.maxOutputTokens ?? 1024,
            temperature: 0.4,
          },
        }),
      );
      const text = res.text ?? '';
      if (!text) throw new Error('Empty Gemini response');
      return text;
    } catch (err) {
      this.logger.error(
        `Gemini generateText failed: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException({
        code: 'TUTOR_AI_PROVIDER_UNAVAILABLE',
        message: `Gemini request failed: ${(err as Error).message}`,
      });
    }
  }

  async generateJson<T>(
    prompt: string,
    opts?: { systemInstruction?: string; maxOutputTokens?: number },
  ): Promise<T> {
    const ai = this.ensureReady();
    let rawText = '';
    try {
      const res = await this.withRetry(() =>
        ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: opts?.systemInstruction,
            maxOutputTokens: opts?.maxOutputTokens ?? 2048,
            temperature: 0.5,
            responseMimeType: 'application/json',
          },
        }),
      );
      rawText = res.text ?? '';
      if (!rawText) {
        const finish = res.candidates?.[0]?.finishReason;
        const blocked = res.promptFeedback?.blockReason;
        this.logger.error(
          `Gemini returned empty JSON (finishReason=${finish ?? 'n/a'}, blockReason=${blocked ?? 'n/a'})`,
        );
        throw new Error(
          `Empty response (finishReason=${finish ?? 'n/a'}${blocked ? `, blockReason=${blocked}` : ''})`,
        );
      }
      return JSON.parse(this.unwrapJson(rawText)) as T;
    } catch (err) {
      const snippet = rawText
        ? ` | raw: ${rawText.slice(0, 300).replace(/\s+/g, ' ')}`
        : '';
      this.logger.error(
        `Gemini generateJson failed: ${(err as Error).message}${snippet}`,
      );
      throw new ServiceUnavailableException({
        code: 'TUTOR_AI_PROVIDER_UNAVAILABLE',
        message: `Gemini JSON generation failed: ${(err as Error).message}`,
      });
    }
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
        if (!this.isRetryable(err) || attempt === maxAttempts) throw err;
        const delay = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 250;
        this.logger.warn(
          `Gemini transient error (attempt ${attempt}/${maxAttempts}): ${(err as Error).message} — retrying in ${Math.round(delay)}ms`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastErr;
  }

  private isRetryable(err: unknown): boolean {
    const msg = (err as Error)?.message ?? '';
    if (/\b(503|429|500|502|504)\b/.test(msg)) return true;
    if (/UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|INTERNAL/i.test(msg))
      return true;
    if (/overloaded|high demand|try again later/i.test(msg)) return true;
    return false;
  }

  private unwrapJson(text: string): string {
    const trimmed = text.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fenced) return fenced[1].trim();
    return trimmed;
  }
}
