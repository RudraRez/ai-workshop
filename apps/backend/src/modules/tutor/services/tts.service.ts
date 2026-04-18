import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { SupportedLanguage } from '../dto/audio-overview.dto';

const GTTS_LANG: Record<SupportedLanguage, string> = {
  'en-IN': 'en',
  'hi-IN': 'hi',
  'ta-IN': 'ta',
  'te-IN': 'te',
  'bn-IN': 'bn',
  'gu-IN': 'gu',
  'kn-IN': 'kn',
  'ml-IN': 'ml',
  'mr-IN': 'mr',
  'pa-IN': 'pa',
};

const MAX_CHARS_PER_CHUNK = 180;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private readonly _config: ConfigService) {
    void this._config;
  }

  async synthesize(
    text: string,
    language: SupportedLanguage,
  ): Promise<Buffer> {
    const tl = GTTS_LANG[language];
    const chunks = this.splitIntoChunks(text, MAX_CHARS_PER_CHUNK);
    if (chunks.length === 0) {
      throw new ServiceUnavailableException({
        code: 'TUTOR_STUDIO_TTS_UNAVAILABLE',
        message: 'Empty text — nothing to synthesise',
      });
    }

    try {
      const buffers: Buffer[] = [];
      for (let i = 0; i < chunks.length; i++) {
        if (i > 0) await this.sleep(180);
        const buf = await this.fetchChunk(chunks[i], tl, i, chunks.length);
        buffers.push(buf);
      }
      const combined = Buffer.concat(buffers);
      this.logger.log(
        `TTS ok (${language} · ${chunks.length} chunks · ${combined.byteLength} bytes)`,
      );
      return combined;
    } catch (err) {
      const message = this.extractError(err);
      this.logger.error(`TTS failed (${language}): ${message}`);
      throw new ServiceUnavailableException({
        code: 'TUTOR_STUDIO_TTS_UNAVAILABLE',
        message: `TTS request failed: ${message}`,
      });
    }
  }

  private async fetchChunk(
    chunk: string,
    tl: string,
    idx: number,
    total: number,
  ): Promise<Buffer> {
    const url =
      `https://translate.google.com/translate_tts` +
      `?ie=UTF-8&client=tw-ob` +
      `&q=${encodeURIComponent(chunk)}` +
      `&tl=${tl}` +
      `&total=${total}` +
      `&idx=${idx}` +
      `&textlen=${chunk.length}`;

    const maxAttempts = 3;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30_000,
          headers: {
            'User-Agent': UA,
            Accept: 'audio/mpeg,*/*',
            Referer: 'https://translate.google.com/',
          },
        });
        const buf = Buffer.from(res.data as ArrayBuffer);
        if (buf.length === 0) throw new Error(`Empty audio for chunk ${idx}`);
        return buf;
      } catch (err) {
        lastErr = err;
        const status = axios.isAxiosError(err) ? err.response?.status : 0;
        const retryable = status === 429 || status === 503 || status === 500;
        if (!retryable || attempt === maxAttempts) throw err;
        const delay = 800 * 2 ** (attempt - 1) + Math.random() * 300;
        this.logger.warn(
          `TTS chunk ${idx} got ${status}, retrying in ${Math.round(delay)}ms (attempt ${attempt}/${maxAttempts})`,
        );
        await this.sleep(delay);
      }
    }
    throw lastErr;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private splitIntoChunks(text: string, maxLen: number): string[] {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (!trimmed) return [];
    if (trimmed.length <= maxLen) return [trimmed];

    const parts: string[] = [];
    const sentences = trimmed
      .split(/([.!?।]+\s+)/)
      .reduce<string[]>((acc, piece, idx, arr) => {
        if (idx % 2 === 0) {
          const punct = arr[idx + 1] ?? '';
          const full = (piece + punct).trim();
          if (full) acc.push(full);
        }
        return acc;
      }, []);

    let current = '';
    for (const sentence of sentences) {
      if (sentence.length > maxLen) {
        if (current) {
          parts.push(current);
          current = '';
        }
        parts.push(...this.splitByWords(sentence, maxLen));
        continue;
      }
      if (current.length + sentence.length + 1 <= maxLen) {
        current = current ? `${current} ${sentence}` : sentence;
      } else {
        if (current) parts.push(current);
        current = sentence;
      }
    }
    if (current) parts.push(current);
    return parts;
  }

  private splitByWords(text: string, maxLen: number): string[] {
    const words = text.split(' ');
    const out: string[] = [];
    let current = '';
    for (const word of words) {
      if (word.length > maxLen) {
        if (current) {
          out.push(current);
          current = '';
        }
        for (let i = 0; i < word.length; i += maxLen) {
          out.push(word.slice(i, i + maxLen));
        }
        continue;
      }
      if (current.length + word.length + 1 <= maxLen) {
        current = current ? `${current} ${word}` : word;
      } else {
        if (current) out.push(current);
        current = word;
      }
    }
    if (current) out.push(current);
    return out;
  }

  private extractError(err: unknown): string {
    if (!axios.isAxiosError(err)) return (err as Error).message;
    const status = err.response?.status;
    if (status === 429) return 'Rate limited by Google Translate TTS';
    if (status === 403)
      return 'Google Translate TTS rejected the request (403)';
    return status ? `${status} ${err.message}` : err.message;
  }
}
