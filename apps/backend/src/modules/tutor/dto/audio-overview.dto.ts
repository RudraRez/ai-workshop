import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const SUPPORTED_LANGUAGES = [
  'en-IN',
  'hi-IN',
  'ta-IN',
  'te-IN',
  'bn-IN',
  'gu-IN',
  'kn-IN',
  'ml-IN',
  'mr-IN',
  'pa-IN',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export class GenerateAudioOverviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  lessonId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  lessonTitle!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  lessonContext?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoUrl?: string;

  @IsIn(SUPPORTED_LANGUAGES as readonly string[])
  language!: SupportedLanguage;

  @IsOptional()
  @IsIn(['narrator', 'conversational', 'friendly'])
  voiceStyle?: 'narrator' | 'conversational' | 'friendly';
}
