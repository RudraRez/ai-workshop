import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { FlashcardsController } from './flashcards.controller';
import { AudioOverviewController } from './audio-overview.controller';
import { ChatService } from './services/chat.service';
import { FlashcardsService } from './services/flashcards.service';
import { AudioOverviewService } from './services/audio-overview.service';
import { GeminiService } from './services/gemini.service';
import { TtsService } from './services/tts.service';
import { YoutubeTranscriptService } from './services/youtube-transcript.service';

@Module({
  controllers: [ChatController, FlashcardsController, AudioOverviewController],
  providers: [
    GeminiService,
    TtsService,
    YoutubeTranscriptService,
    ChatService,
    FlashcardsService,
    AudioOverviewService,
  ],
})
export class TutorModule {}
