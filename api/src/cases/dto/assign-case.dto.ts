import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AssignCaseDto {
  @ApiPropertyOptional({
    description: 'Optimistic locking version. Assignment fails with 409 if stale.',
    example: 2
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion?: number;
}
