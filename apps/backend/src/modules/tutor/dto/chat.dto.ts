import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ChatHistoryItemDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body!: string;
}

export class ChatRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  prompt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lessonId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  lessonTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  lessonContext?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
