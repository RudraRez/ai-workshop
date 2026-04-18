import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { SupportedLanguage } from '../dto/audio-overview.dto';

const VOICE_BY_LANGUAGE: Record<SupportedLanguage, { name: string; ssmlGender: 'MALE' | 'FEMALE' }> = {
  'en-IN': { name: 'en-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  'hi-IN': { name: 'hi-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  'ta-IN': { name: 'ta-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  'te-IN': { name: 'te-IN-Standard-A', ssmlGender: 'FEMALE' },
  'bn-IN': { name: 'bn-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  'gu-IN': { name: 'gu-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  'kn-IN': { name: 'kn-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  'ml-IN': { name: 'ml-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  'mr-IN': { name: 'mr-IN-Wavenet-A', ssmlGender: 'FEMALE' },
  'pa-IN': { name: 'pa-IN-Wavenet-A', ssmlGender: 'FEMALE' },
};

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private readonly config: ConfigService) {}

  async synthesize(
    text: string,
    language: SupportedLanguage,
  ): Promise<Buffer> {
    const apiKey = this.config.get<string>('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException({
        code: 'TUTOR_STUDIO_TTS_UNAVAILABLE',
        message: 'GOOGLE_API_KEY not configured for TTS',
      });
    }

    const voice = VOICE_BY_LANGUAGE[language];
    try {
      const res = await axios.post(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          input: { text },
          voice: {
            languageCode: language,
            name: voice.name,
            ssmlGender: voice.ssmlGender,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95,
            pitch: 0,
          },
        },
        { timeout: 60_000 },
      );
      const base64: string | undefined = res.data?.audioContent;
      if (!base64) throw new Error('Empty audioContent in TTS response');
      return Buffer.from(base64, 'base64');
    } catch (err) {
      const message =
        (axios.isAxiosError(err) && err.response?.data?.error?.message) ||
        (err as Error).message;
      this.logger.error(`TTS failed (${language}): ${message}`);
      throw new ServiceUnavailableException({
        code: 'TUTOR_STUDIO_TTS_UNAVAILABLE',
        message: `TTS request failed: ${message}`,
      });
    }
  }
}
