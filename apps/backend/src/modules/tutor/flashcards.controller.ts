import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { FlashcardsService } from './services/flashcards.service';
import { GenerateFlashcardsDto } from './dto/flashcards.dto';

@Controller('api/v1/tutor/flashcards')
export class FlashcardsController {
  constructor(private readonly flashcards: FlashcardsService) {}

  @Post()
  async generate(@Body() dto: GenerateFlashcardsDto) {
    return this.flashcards.generate(dto);
  }

  @Get()
  list(@Query('lessonId') lessonId?: string) {
    return { items: this.flashcards.list(lessonId) };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const deck = this.flashcards.get(id);
    if (!deck) {
      throw new NotFoundException({
        code: 'TUTOR_FLASHCARD_DECK_NOT_FOUND',
        message: `Deck ${id} not found`,
      });
    }
    return deck;
  }
}
