import { ApiProperty } from '@nestjs/swagger';

export class MetricsResponseDto {
  @ApiProperty({ example: 21 })
  openCasesCount!: number;

  @ApiProperty({ example: 4 })
  resolvedTodayCount!: number;

  @ApiProperty({ example: 14.67 })
  avgOpenDpd!: number;
}
