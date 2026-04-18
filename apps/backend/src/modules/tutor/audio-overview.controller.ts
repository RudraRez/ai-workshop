import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AudioOverviewService } from './services/audio-overview.service';
import { GenerateAudioOverviewDto } from './dto/audio-overview.dto';

@Controller('api/v1/tutor/audio-overviews')
export class AudioOverviewController {
  constructor(private readonly service: AudioOverviewService) {}

  @Post()
  async generate(@Body() dto: GenerateAudioOverviewDto) {
    return this.service.generate(dto);
  }

  @Get()
  list(@Query('lessonId') lessonId?: string) {
    return { items: this.service.list(lessonId) };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const overview = this.service.get(id);
    if (!overview) {
      throw new NotFoundException({
        code: 'TUTOR_AUDIO_OVERVIEW_NOT_FOUND',
        message: `Audio overview ${id} not found`,
      });
    }
    return overview;
  }
}
