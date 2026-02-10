import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorDto {
  @ApiProperty({ example: 'BAD_REQUEST' })
  code!: string;

  @ApiProperty({ example: 'dpdMin cannot be greater than dpdMax.' })
  message!: string;

  @ApiProperty({
    description: 'Additional context returned by the API error handler.',
    nullable: true,
    required: false,
    example: {
      statusCode: 400,
      message: ['page must not be less than 1'],
      error: 'Bad Request'
    }
  })
  details?: unknown;

  @ApiProperty({ example: '2026-02-10T10:30:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '3ed3f451-b18d-4f8d-9c14-17b1c2f3406b' })
  requestId!: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ type: ApiErrorDto })
  error!: ApiErrorDto;
}
