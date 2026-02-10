import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile
} from '@nestjs/common';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
  getSchemaPath
} from '@nestjs/swagger';
import type { Response } from 'express';

import { ApiErrorResponseDto } from '../common/dto/error-response.dto';
import {
  AddActionLogDto,
  AssignCaseDto,
  AssignCaseResponseDto,
  CaseActionLogDto,
  CaseListResponseDto,
  CaseResponseDto,
  CreateCaseDto,
  CreateFullCaseDto,
  ListCasesQueryDto
} from './dto';
import { CasesService } from './cases.service';

@ApiTags('cases')
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a delinquency case and perform initial assignment decision.' })
  @ApiBody({
    schema: {
      example: {
        customerId: 12,
        loanId: 77
      }
    }
  })
  @ApiCreatedResponse({ description: 'Case created successfully.', type: CaseResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Customer or loan does not exist.', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Active case already exists for loan.', type: ApiErrorResponseDto })
  createCase(@Body() dto: CreateCaseDto) {
    return this.casesService.createCase(dto);
  }

  // Bonus/Custom Endpoint: Single-step onboarding.
  // Combines Customer + Loan + Case creation in one transaction.
  @Post('full')
  @ApiOperation({ summary: 'Create a full case with new customer and loan details.' })
  @ApiBody({ type: CreateFullCaseDto })
  @ApiCreatedResponse({ description: 'Case created successfully.', type: CaseResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload.', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Customer or active case already exists.', type: ApiErrorResponseDto })
  createFullCase(@Body() dto: CreateFullCaseDto) {
    return this.casesService.createFullCase(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List cases with filters, stable sorting, and pagination.' })
  @ApiOkResponse({ description: 'Paginated case list.', type: CaseListResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameters.', type: ApiErrorResponseDto })
  listCases(@Query() query: ListCasesQueryDto) {
    return this.casesService.listCases(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a case with customer/loan details, actions, and assignment history.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Case details with relations.', type: CaseResponseDto })
  @ApiNotFoundResponse({ description: 'Case not found.', type: ApiErrorResponseDto })
  getCaseById(@Param('id', ParseIntPipe) caseId: number) {
    return this.casesService.getCaseById(caseId);
  }

  @Post(':id/actions')
  @ApiOperation({ summary: 'Add an action log to a case.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      example: {
        type: 'CALL',
        outcome: 'PROMISE_TO_PAY',
        notes: 'Customer promised to pay by Friday'
      }
    }
  })
  @ApiCreatedResponse({ description: 'Action log created.', type: CaseActionLogDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Case not found.', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Case is already resolved or closed.', type: ApiErrorResponseDto })
  addAction(
    @Param('id', ParseIntPipe) caseId: number,
    @Body() dto: AddActionLogDto
  ) {
    return this.casesService.addAction(caseId, dto);
  }

  // Idempotent assignment run.
  // Uses optimistic locking (expectedVersion) to prevent race conditions.
  @Post(':id/assign')
  @ApiOperation({ summary: 'Run rule-based assignment, idempotently store decision, and update case owner/stage.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      example: {
        expectedVersion: 2
      }
    }
  })
  @ApiOkResponse({ description: 'Assignment executed successfully.', type: AssignCaseResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload.', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Case not found.', type: ApiErrorResponseDto })
  @ApiConflictResponse({
    description: 'Version mismatch, concurrent update, or case cannot be assigned.',
    type: ApiErrorResponseDto
  })
  assignCase(
    @Param('id', ParseIntPipe) caseId: number,
    @Body() dto: AssignCaseDto
  ) {
    return this.casesService.assignCase(caseId, dto);
  }

  @Get(':id/notice')
  @ApiOperation({ summary: 'Generate and stream a payment reminder PDF for the case.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    description: 'PDF file (binary stream).',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Case not found.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(ApiErrorResponseDto)
        }
      }
    }
  })
  @ApiServiceUnavailableResponse({
    description: 'Chromium/PDF service unavailable.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(ApiErrorResponseDto)
        }
      }
    }
  })
  // Streams a generated PDF directly to the client.
  @Header('Content-Type', 'application/pdf')
  async getNoticePdf(
    @Param('id', ParseIntPipe) caseId: number,
    @Res({ passthrough: true }) response: Response
  ) {
    const pdfBytes = await this.casesService.generateNoticePdf(caseId);

    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="case-${caseId}-payment-reminder.pdf"`
    });

    return new StreamableFile(pdfBytes);
  }
}
