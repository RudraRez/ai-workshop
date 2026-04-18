import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GeminiService } from './gemini.service';
import { YoutubeTranscriptService } from './youtube-transcript.service';
import type { ChatRequestDto } from '../dto/chat.dto';

export interface ChatAnswer {
  messageId: string;
  role: 'assistant';
  body: string;
  createdAt: string;
  model: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly gemini: GeminiService,
    private readonly transcripts: YoutubeTranscriptService,
  ) {}

  async answer(req: ChatRequestDto): Promise<ChatAnswer> {
    const transcript = req.videoUrl
      ? await this.transcripts.fetchTranscript(req.videoUrl)
      : null;
    const systemInstruction = this.buildSystemPrompt(req, transcript);
    const conversation = this.buildConversation(req);

    const body = await this.gemini.generateText(conversation, {
      systemInstruction,
      maxOutputTokens: 800,
    });

    return {
      messageId: randomUUID(),
      role: 'assistant',
      body: body.trim(),
      createdAt: new Date().toISOString(),
      model: 'gemini',
    };
  }

  private buildSystemPrompt(
    req: ChatRequestDto,
    transcript: string | null,
  ): string {
    const lines: string[] = [
      'You are SKEP AI Tutor — a patient, accurate tutor that teaches using the Socratic method.',
      'Ask a guiding question when it helps the learner reason. Otherwise, answer directly and concisely.',
      'Keep answers under 180 words unless the learner explicitly asks for more depth.',
      'Use plain, friendly language. Prefer short paragraphs and bulleted lists for enumerations.',
      'Never invent facts. If you are unsure, say so and suggest how the learner could find out.',
    ];
    if (req.lessonTitle) {
      lines.push(`\nThe learner is watching the lesson: "${req.lessonTitle}".`);
    }
    if (req.lessonContext) {
      lines.push(
        `\nLesson context (use it to ground your answers):\n${req.lessonContext}`,
      );
    }
    if (transcript) {
      lines.push(
        `\nVideo transcript (primary source — ground every answer in this; quote when relevant):\n${transcript}`,
      );
    }
    return lines.join('\n');
  }

  private buildConversation(req: ChatRequestDto): string {
    const history = req.history ?? [];
    const lines = history.map(
      (h) => `${h.role === 'user' ? 'Learner' : 'Tutor'}: ${h.body}`,
    );
    lines.push(`Learner: ${req.prompt}`);
    lines.push('Tutor:');
    return lines.join('\n');
  }
}
