import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateCaseDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId!: number;

  @ApiProperty({ example: 77 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loanId!: number;
}
