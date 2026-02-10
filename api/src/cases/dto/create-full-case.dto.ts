import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+15551234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  country: string;

  @ApiProperty({ example: 750, description: 'Credit risk score (300-850)' })
  @IsNumber()
  @Min(300)
  @Max(1000)
  riskScore: number;
}

export class CreateLoanDto {
  @ApiProperty({ example: 5000.00 })
  @IsNumber()
  @Min(0)
  principal: number;

  @ApiProperty({ example: 5000.00 })
  @IsNumber()
  @Min(0)
  outstanding: number;

  @ApiProperty({ example: '2023-12-31T00:00:00.000Z' })
  @IsDateString()
  dueDate: string;
}

export class CreateFullCaseDto {
  @ApiProperty({ type: CreateCustomerDto })
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer: CreateCustomerDto;

  @ApiProperty({ type: CreateLoanDto })
  @ValidateNested()
  @Type(() => CreateLoanDto)
  loan: CreateLoanDto;
}
