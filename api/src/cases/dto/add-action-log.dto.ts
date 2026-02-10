import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActionOutcome, ActionType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddActionLogDto {
  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  type!: ActionType;

  @ApiProperty({ enum: ActionOutcome })
  @IsEnum(ActionOutcome)
  outcome!: ActionOutcome;

  @ApiPropertyOptional({ example: 'Customer promised to pay on Friday.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
