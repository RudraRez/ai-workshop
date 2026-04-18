import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { GeminiService } from './gemini.service';
import { TtsService } from './tts.service';
import { YoutubeTranscriptService } from './youtube-transcript.service';
import type {
  GenerateAudioOverviewDto,
  SupportedLanguage,
} from '../dto/audio-overview.dto';

export interface AudioOverview {
  id: string;
  lessonId: string;
  language: SupportedLanguage;
  voiceStyle: 'narrator' | 'conversational' | 'friendly';
  title: string;
  transcript: string;
  audioUrl: string;
  durationSec: number;
  sizeBytes: number;
  createdAt: string;
}

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'bn-IN': 'Bengali',
  'gu-IN': 'Gujarati',
  'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam',
  'mr-IN': 'Marathi',
  'pa-IN': 'Punjabi',
};

@Injectable()
export class AudioOverviewService {
  private readonly logger = new Logger(AudioOverviewService.name);
  private readonly overviews = new Map<string, AudioOverview>();

  constructor(
    private readonly gemini: GeminiService,
    private readonly tts: TtsService,
    private readonly config: ConfigService,
    private readonly youtubeTranscripts: YoutubeTranscriptService,
  ) {}

  async generate(req: GenerateAudioOverviewDto): Promise<AudioOverview> {
    const languageName = LANGUAGE_NAMES[req.language];
    const voiceStyle = req.voiceStyle ?? 'narrator';
    const id = randomUUID();

    const sourceTranscript = req.videoUrl
      ? await this.youtubeTranscripts.fetchTranscript(req.videoUrl)
      : null;

    const transcript = await this.gemini.generateText(
      this.buildScriptPrompt(req, languageName, voiceStyle, sourceTranscript),
      {
        systemInstruction: `You write narration scripts for an audio learning podcast. Write ONLY in ${languageName}. Do not include stage directions, speaker names, or markdown.`,
        maxOutputTokens: 900,
      },
    );

    const mp3 = await this.tts.synthesize(transcript, req.language);
    const audioUrl = await this.persist(id, mp3);

    const overview: AudioOverview = {
      id,
      lessonId: req.lessonId,
      language: req.language,
      voiceStyle,
      title: `Audio Overview · ${languageName}`,
      transcript,
      audioUrl,
      durationSec: this.estimateDuration(transcript),
      sizeBytes: mp3.byteLength,
      createdAt: new Date().toISOString(),
    };
    this.overviews.set(id, overview);
    return overview;
  }

  get(id: string): AudioOverview | undefined {
    return this.overviews.get(id);
  }

  list(lessonId?: string): AudioOverview[] {
    const all = Array.from(this.overviews.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    return lessonId ? all.filter((a) => a.lessonId === lessonId) : all;
  }

  private async persist(id: string, mp3: Buffer): Promise<string> {
    const uploadDir = resolve(
      this.config.get<string>('UPLOAD_DIR', './uploads'),
      'audio',
    );
    await mkdir(uploadDir, { recursive: true });
    const file = join(uploadDir, `${id}.mp3`);
    await writeFile(file, mp3);
    this.logger.log(`Saved audio overview ${id} (${mp3.byteLength} bytes)`);
    return `/uploads/audio/${id}.mp3`;
  }

  private estimateDuration(transcript: string): number {
    const words = transcript.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(30, Math.round((words / 140) * 60));
  }

  private buildScriptPrompt(
    req: GenerateAudioOverviewDto,
    languageName: string,
    voiceStyle: string,
    sourceTranscript: string | null,
  ): string {
    const toneHints: Record<string, string> = {
      narrator: 'Calm, clear, measured. Like a documentary narrator.',
      conversational: 'Warm and chatty, like a friend explaining over coffee.',
      friendly: 'Encouraging and upbeat, like a supportive mentor.',
    };
    const sourceBlock = sourceTranscript
      ? `Source video transcript (summarise THIS — do not invent content outside it):\n${sourceTranscript}`
      : req.lessonContext
        ? `Lesson context:\n${req.lessonContext}`
        : 'Lesson context: (none — infer a sensible overview from the title)';
    return [
      `Write a ${languageName} narration script for an AI-generated lesson podcast.`,
      `Length: 150–220 words. Tone: ${toneHints[voiceStyle] ?? toneHints.narrator}`,
      `Start with a one-line hook. End with a one-line takeaway.`,
      `The script will be read aloud by a TTS engine — no headings, no bullet points, no stage cues.`,
      '',
      `Lesson title: ${req.lessonTitle}`,
      sourceBlock,
    ].join('\n');
  }
}
