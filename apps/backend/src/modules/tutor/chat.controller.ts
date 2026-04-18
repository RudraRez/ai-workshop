import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatRequestDto } from './dto/chat.dto';

@Controller('api/v1/tutor/chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  async answer(@Body() dto: ChatRequestDto) {
    return this.chat.answer(dto);
  }
}
