import { ApiProperty } from '@nestjs/swagger';
import {
  ActionOutcome,
  ActionType,
  AssignmentGroup,
  CaseStage,
  CaseStatus,
  LoanStatus
} from '@prisma/client';

export class CaseCustomerDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'Maya Johnson' })
  name!: string;

  @ApiProperty({ example: '+1-415-555-0123' })
  phone!: string;

  @ApiProperty({ example: 'maya.johnson@example.com' })
  email!: string;

  @ApiProperty({ example: 'US' })
  country!: string;

  @ApiProperty({ example: 78 })
  riskScore!: number;
}

export class CaseLoanDto {
  @ApiProperty({ example: 77 })
  id!: number;

  @ApiProperty({ example: 12 })
  customerId!: number;

  @ApiProperty({ example: '100000.00' })
  principal!: string;

  @ApiProperty({ example: '42000.00' })
  outstanding!: string;

  @ApiProperty({ example: '2026-02-05T00:00:00.000Z' })
  dueDate!: string;

  @ApiProperty({ enum: LoanStatus, example: LoanStatus.ACTIVE })
  status!: LoanStatus;
}

export class CaseActionLogDto {
  @ApiProperty({ example: 101 })
  id!: number;

  @ApiProperty({ example: 1 })
  caseId!: number;

  @ApiProperty({ enum: ActionType, example: ActionType.CALL })
  type!: ActionType;

  @ApiProperty({ enum: ActionOutcome, example: ActionOutcome.PROMISE_TO_PAY })
  outcome!: ActionOutcome;

  @ApiProperty({ example: 'Customer promised payment by Friday.', nullable: true })
  notes!: string | null;

  @ApiProperty({ example: '2026-02-10T09:31:00.000Z' })
  createdAt!: string;
}

export class CaseRuleDecisionDto {
  @ApiProperty({ example: 31 })
  id!: number;

  @ApiProperty({ example: 1 })
  caseId!: number;

  @ApiProperty({ type: [String], example: ['DPD_8_30', 'RISK_GT_80_OVERRIDE'] })
  matchedRules!: string[];

  @ApiProperty({ example: 'dpd=12 -> Tier2; riskScore=92 -> SeniorAgent override' })
  reason!: string;

  @ApiProperty({ example: '2026-02-10T09:30:00.000Z' })
  createdAt!: string;
}

export class CaseResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 12 })
  customerId!: number;

  @ApiProperty({ example: 77 })
  loanId!: number;

  @ApiProperty({ example: 12 })
  dpd!: number;

  @ApiProperty({ enum: CaseStage, example: CaseStage.HARD })
  stage!: CaseStage;

  @ApiProperty({ enum: CaseStatus, example: CaseStatus.IN_PROGRESS })
  status!: CaseStatus;

  @ApiProperty({
    enum: AssignmentGroup,
    example: AssignmentGroup.Tier2,
    nullable: true
  })
  assignmentGroup!: AssignmentGroup | null;

  @ApiProperty({ example: 'SeniorAgent', nullable: true })
  assignedTo!: string | null;

  @ApiProperty({ example: 2 })
  version!: number;

  @ApiProperty({ example: '2026-02-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-02-10T09:35:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ example: null, nullable: true })
  resolvedAt!: string | null;

  @ApiProperty({ type: CaseCustomerDto })
  customer!: CaseCustomerDto;

  @ApiProperty({ type: CaseLoanDto })
  loan!: CaseLoanDto;

  @ApiProperty({ type: [CaseActionLogDto] })
  actionLogs!: CaseActionLogDto[];

  @ApiProperty({ type: [CaseRuleDecisionDto] })
  ruleDecisions!: CaseRuleDecisionDto[];
}

export class CaseListPaginationDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  pageSize!: number;

  @ApiProperty({ example: 32 })
  total!: number;

  @ApiProperty({ example: 4 })
  totalPages!: number;
}

export class CaseListResponseDto {
  @ApiProperty({ type: [CaseResponseDto] })
  data!: CaseResponseDto[];

  @ApiProperty({ type: CaseListPaginationDto })
  pagination!: CaseListPaginationDto;
}

export class AssignmentDecisionDto {
  @ApiProperty({ type: [String], example: ['DPD_8_30', 'RISK_GT_80_OVERRIDE'] })
  matchedRules!: string[];

  @ApiProperty({ example: 'dpd=12 -> Tier2; riskScore=92 -> SeniorAgent override' })
  reason!: string;
}

export class AssignCaseResponseDto {
  @ApiProperty({ example: 1 })
  caseId!: number;

  @ApiProperty({ enum: CaseStage, example: CaseStage.HARD })
  stage!: CaseStage;

  @ApiProperty({ example: 'SeniorAgent' })
  assignedTo!: string;

  @ApiProperty({ example: 2 })
  version!: number;

  @ApiProperty({ type: AssignmentDecisionDto })
  decision!: AssignmentDecisionDto;
}
