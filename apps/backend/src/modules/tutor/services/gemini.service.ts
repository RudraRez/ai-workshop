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
      const res = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: opts?.systemInstruction,
          maxOutputTokens: opts?.maxOutputTokens ?? 1024,
          temperature: 0.4,
        },
      });
      const text = res.text ?? '';
      if (!text) throw new Error('Empty Gemini response');
      return text;
    } catch (err) {
      this.logger.error(
        `Gemini generateText failed: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException({
        code: 'TUTOR_AI_PROVIDER_UNAVAILABLE',
        message: 'Gemini request failed',
      });
    }
  }

  async generateJson<T>(
    prompt: string,
    opts?: { systemInstruction?: string; maxOutputTokens?: number },
  ): Promise<T> {
    const ai = this.ensureReady();
    try {
      const res = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: opts?.systemInstruction,
          maxOutputTokens: opts?.maxOutputTokens ?? 2048,
          temperature: 0.5,
          responseMimeType: 'application/json',
        },
      });
      const text = res.text ?? '';
      return JSON.parse(text) as T;
    } catch (err) {
      this.logger.error(
        `Gemini generateJson failed: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException({
        code: 'TUTOR_AI_PROVIDER_UNAVAILABLE',
        message: 'Gemini JSON generation failed',
      });
    }
  }
}
