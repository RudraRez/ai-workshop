import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class GenerateFlashcardsDto {
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

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(30)
  count?: number;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard', 'mixed'])
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}
