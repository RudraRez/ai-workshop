import { Injectable, Logger } from '@nestjs/common';

const MAX_TRANSCRIPT_CHARS = 15_000;
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  transcript: string;
  fetchedAt: number;
}

interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
  lang?: string;
}

interface YoutubeTranscriptModule {
  YoutubeTranscript: {
    fetchTranscript(videoId: string): Promise<TranscriptItem[]>;
  };
}

@Injectable()
export class YoutubeTranscriptService {
  private readonly logger = new Logger(YoutubeTranscriptService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private modulePromise?: Promise<YoutubeTranscriptModule>;

  private loadModule(): Promise<YoutubeTranscriptModule> {
    if (!this.modulePromise) {
      this.modulePromise = import(
        'youtube-transcript'
      ) as unknown as Promise<YoutubeTranscriptModule>;
    }
    return this.modulePromise;
  }

  extractVideoId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
    try {
      const url = new URL(trimmed);
      if (url.hostname === 'youtu.be') {
        const id = url.pathname.replace(/^\//, '').split('/')[0];
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }
      if (url.hostname.endsWith('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
        const parts = url.pathname.split('/').filter(Boolean);
        const embedIdx = parts.indexOf('embed');
        if (embedIdx >= 0 && parts[embedIdx + 1]) {
          const id = parts[embedIdx + 1];
          return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  async fetchTranscript(videoUrlOrId: string): Promise<string | null> {
    const videoId = this.extractVideoId(videoUrlOrId);
    if (!videoId) return null;

    const cached = this.cache.get(videoId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.transcript;
    }

    try {
      const { YoutubeTranscript } = await this.loadModule();
      const items = await YoutubeTranscript.fetchTranscript(videoId);
      const joined = items
        .map((i) => i.text.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join(' ');
      const truncated =
        joined.length > MAX_TRANSCRIPT_CHARS
          ? joined.slice(0, MAX_TRANSCRIPT_CHARS) + '…'
          : joined;
      this.cache.set(videoId, {
        transcript: truncated,
        fetchedAt: Date.now(),
      });
      this.logger.log(
        `Fetched transcript for ${videoId} (${truncated.length} chars)`,
      );
      return truncated;
    } catch (err) {
      this.logger.warn(
        `Transcript fetch failed for ${videoId}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
