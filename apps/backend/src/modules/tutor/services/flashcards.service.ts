import { BadGatewayException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GeminiService } from './gemini.service';
import { YoutubeTranscriptService } from './youtube-transcript.service';
import type { GenerateFlashcardsDto } from '../dto/flashcards.dto';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  tags?: string[];
}

export interface FlashcardDeck {
  id: string;
  lessonId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  cardCount: number;
  cards: Flashcard[];
  createdAt: string;
}

interface RawCard {
  front?: unknown;
  back?: unknown;
  hint?: unknown;
  tags?: unknown;
}

@Injectable()
export class FlashcardsService {
  private readonly decks = new Map<string, FlashcardDeck>();

  constructor(
    private readonly gemini: GeminiService,
    private readonly transcripts: YoutubeTranscriptService,
  ) {}

  async generate(req: GenerateFlashcardsDto): Promise<FlashcardDeck> {
    const count = req.count ?? 10;
    const difficulty = req.difficulty ?? 'mixed';
    const transcript = req.videoUrl
      ? await this.transcripts.fetchTranscript(req.videoUrl)
      : null;

    const prompt = this.buildPrompt(req, count, difficulty, transcript);
    const raw = await this.gemini.generateJson<{ cards?: RawCard[] }>(prompt, {
      systemInstruction:
        'You produce study flashcards for online learners. Always respond with valid JSON.',
      maxOutputTokens: 4096,
    });

    const cards = Array.isArray(raw?.cards) ? raw.cards : [];
    const parsed = cards
      .map((c): Flashcard | null => {
        if (typeof c.front !== 'string' || typeof c.back !== 'string')
          return null;
        return {
          id: randomUUID(),
          front: c.front.trim().slice(0, 500),
          back: c.back.trim().slice(0, 2000),
          hint: typeof c.hint === 'string' ? c.hint.slice(0, 500) : undefined,
          tags: Array.isArray(c.tags)
            ? c.tags.filter((t): t is string => typeof t === 'string').slice(0, 10)
            : undefined,
        };
      })
      .filter((c): c is Flashcard => c !== null);

    if (parsed.length === 0) {
      throw new BadGatewayException({
        code: 'TUTOR_STUDIO_INVALID_OUTPUT',
        message: 'Gemini did not return any valid flashcards',
      });
    }

    const deck: FlashcardDeck = {
      id: randomUUID(),
      lessonId: req.lessonId,
      title: `${req.lessonTitle} — ${parsed.length} flashcards`,
      difficulty,
      cardCount: parsed.length,
      cards: parsed,
      createdAt: new Date().toISOString(),
    };
    this.decks.set(deck.id, deck);
    return deck;
  }

  get(id: string): FlashcardDeck | undefined {
    return this.decks.get(id);
  }

  list(lessonId?: string): FlashcardDeck[] {
    const all = Array.from(this.decks.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    return lessonId ? all.filter((d) => d.lessonId === lessonId) : all;
  }

  private buildPrompt(
    req: GenerateFlashcardsDto,
    count: number,
    difficulty: string,
    transcript: string | null,
  ): string {
    const sourceBlock = transcript
      ? `Video transcript (primary source — every card must be grounded in this):\n${transcript}`
      : req.lessonContext
        ? `Lesson context:\n${req.lessonContext}`
        : 'Lesson context: (none — generate flashcards that would fit a lesson of this title)';
    return [
      `Create exactly ${count} high-quality study flashcards for the lesson below.`,
      `Difficulty: ${difficulty}.`,
      'Each card must have:',
      '  - "front": a concise question or prompt (max 1 sentence)',
      '  - "back": a clear, correct answer (1–4 sentences)',
      '  - optional "hint": a short nudge the learner can peek at',
      '  - optional "tags": 1–4 topic tags as strings',
      'Respond ONLY with JSON in this exact shape:',
      '{ "cards": [ { "front": "...", "back": "...", "hint": "...", "tags": ["..."] } ] }',
      '',
      `Lesson title: ${req.lessonTitle}`,
      sourceBlock,
    ].join('\n');
  }
}
