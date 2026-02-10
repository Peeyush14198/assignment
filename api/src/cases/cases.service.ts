import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import type {
  ActionLog,
  Case as CaseEntity,
  Customer,
  Loan,
  Prisma,
  RuleDecision
} from '@prisma/client';
import { CaseStatus, Prisma as PrismaNamespace } from '@prisma/client';
import { createHash } from 'crypto';
import dayjs from 'dayjs';

import { NoticeService } from '../notice/notice.service';
import { PrismaService } from '../prisma/prisma.service';
import { RuleEngineService } from '../rules/rule-engine.service';
import type { RuleEvaluationResult } from '../rules/types';
import type {
  AddActionLogDto,
  AssignCaseDto,
  CreateCaseDto,
  CreateFullCaseDto,
  ListCasesQueryDto
} from './dto';

type CaseWithRelations = CaseEntity & {
  customer: Customer;
  loan: Loan;
  actionLogs: ActionLog[];
  ruleDecisions: RuleDecision[];
};

@Injectable()
export class CasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rulesService: RuleEngineService,
    private readonly noticeService: NoticeService
  ) {}

  // Standard create case flow assuming Customer and Loan exist
  async createCase(dto: CreateCaseDto): Promise<CaseWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: dto.customerId } });
      if (!customer) {
        throw new NotFoundException(`Customer ${dto.customerId} does not exist.`);
      }

      const loan = await tx.loan.findUnique({ where: { id: dto.loanId } });
      if (!loan) {
        throw new NotFoundException(`Loan ${dto.loanId} does not exist.`);
      }

      if (loan.customerId !== dto.customerId) {
        throw new BadRequestException('The selected loan does not belong to the selected customer.');
      }

      return this.createCaseInternal(tx, customer, loan);
    });
  }

  // Atomic transaction to create Customer + Loan + Case in one go.
  // Useful for onboarding flows where all data comes at once.
  async createFullCase(dto: CreateFullCaseDto): Promise<CaseWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Customer
      let customer: Customer;
      try {
        customer = await tx.customer.create({
          data: {
            ...dto.customer
          }
        });
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException(`Customer with email ${dto.customer.email} already exists.`);
        }
        throw error;
      }

      // 2. Create Loan
      const loan = await tx.loan.create({
        data: {
          ...dto.loan,
          customerId: customer.id,
          status: 'ACTIVE' // Default status
        }
      });

      // 3. Create Case
      return this.createCaseInternal(tx, customer, loan);
    });
  }

  // Internal helper to handle common case creation logic:
  // 1. Check for duplicates
  // 2. Calculate DPD (Days Past Due)
  // 3. Run initial rule evaluation
  // 4. Create Case and RuleDecision record
  private async createCaseInternal(
    tx: Prisma.TransactionClient,
    customer: Customer,
    loan: Loan
  ): Promise<CaseWithRelations> {
    const existingOpenCase = await tx.case.findFirst({
      where: {
        loanId: loan.id,
        status: {
          in: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS]
        }
      }
    });

    if (existingOpenCase) {
      throw new ConflictException(`An active case already exists for loan ${loan.id}.`);
    }

    const dpd = this.calculateDpd(loan.dueDate);
    const decision = this.rulesService.evaluate({
      dpd,
      riskScore: customer.riskScore,
      currentStage: 'SOFT'
    });

    const caseRecord = await tx.case.create({
      data: {
        customerId: customer.id,
        loanId: loan.id,
        dpd,
        stage: decision.stage,
        assignmentGroup: decision.assignmentGroup,
        assignedTo: decision.assignedTo,
        status: CaseStatus.OPEN
      }
    });

    await tx.ruleDecision.create({
      data: {
        caseId: caseRecord.id,
        matchedRules: decision.matchedRules,
        reason: decision.reason,
        decisionKey: this.buildDecisionKey(caseRecord.id, dpd, customer.riskScore, decision)
      }
    });

    return this.getCaseByIdInternal(tx, caseRecord.id);
  }

  async listCases(query: ListCasesQueryDto): Promise<{
    data: Array<CaseEntity & { customer: Customer; loan: Loan }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    if (
      typeof query.dpdMin === 'number' &&
      typeof query.dpdMax === 'number' &&
      query.dpdMin > query.dpdMax
    ) {
      throw new BadRequestException('dpdMin cannot be greater than dpdMax.');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CaseWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.stage ? { stage: query.stage } : {}),
      ...(query.assignedTo ? { assignedTo: query.assignedTo } : {}),
      ...(typeof query.dpdMin === 'number' || typeof query.dpdMax === 'number'
        ? {
            dpd: {
              ...(typeof query.dpdMin === 'number' ? { gte: query.dpdMin } : {}),
              ...(typeof query.dpdMax === 'number' ? { lte: query.dpdMax } : {})
            }
          }
        : {})
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.case.count({ where }),
      this.prisma.case.findMany({
        where,
        include: {
          customer: true,
          loan: true
        },
        orderBy: [
          {
            createdAt: 'desc'
          },
          {
            id: 'desc'
          }
        ],
        skip,
        take: pageSize
      })
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    };
  }

  async getCaseById(caseId: number): Promise<CaseWithRelations> {
    return this.getCaseByIdInternal(this.prisma, caseId);
  }

  async addAction(caseId: number, dto: AddActionLogDto) {
    return this.prisma.$transaction(async (tx) => {
      const caseRecord = await tx.case.findUnique({ where: { id: caseId } });
      if (!caseRecord) {
        throw new NotFoundException(`Case ${caseId} not found.`);
      }

      if (this.isFinalCaseStatus(caseRecord.status)) {
        throw new ConflictException('Cannot add actions to a resolved/closed case.');
      }

      const actionLog = await tx.actionLog.create({
        data: {
          caseId,
          type: dto.type,
          outcome: dto.outcome,
          notes: dto.notes?.trim() || null
        }
      });

      if (dto.outcome === 'PAID') {
        await tx.case.update({
          where: { id: caseId },
          data: {
            status: CaseStatus.RESOLVED,
            resolvedAt: new Date()
          }
        });
      }

      return actionLog;
    });
  }

  async assignCase(caseId: number, dto: AssignCaseDto) {
    return this.prisma.$transaction(async (tx) => {
      const caseRecord = await tx.case.findUnique({
        where: { id: caseId },
        include: {
          customer: true
        }
      }) as CaseWithRelations | null;

      if (!caseRecord) {
        throw new NotFoundException(`Case ${caseId} not found.`);
      }

      if (this.isFinalCaseStatus(caseRecord.status)) {
        throw new ConflictException('Cannot assign a resolved or closed case.');
      }

      if (dto.expectedVersion && dto.expectedVersion !== caseRecord.version) {
        throw new ConflictException(
          `Version mismatch. Expected ${dto.expectedVersion}, current version is ${caseRecord.version}.`
        );
      }

      const decision = this.rulesService.evaluate({
        dpd: caseRecord.dpd,
        riskScore: caseRecord.customer.riskScore,
        currentStage: caseRecord.stage
      });

      const decisionKey = this.buildDecisionKey(
        caseRecord.id,
        caseRecord.dpd,
        caseRecord.customer.riskScore,
        decision
      );

      const existingDecision = await tx.ruleDecision.findUnique({
        where: { decisionKey }
      });

      if (!existingDecision) {
        try {
          await tx.ruleDecision.create({
            data: {
              caseId,
              matchedRules: decision.matchedRules,
              reason: decision.reason,
              decisionKey
            }
          });
        } catch (error) {
          if (!this.isUniqueConstraintError(error)) {
            throw error;
          }
        }
      }

      // Check if the new decision requires any changes to the Case record.
      // If the stage, group, or assignee hasn't changed, we skip the update.
      const requiresCaseUpdate =
        caseRecord.stage !== decision.stage ||
        caseRecord.assignmentGroup !== decision.assignmentGroup ||
        caseRecord.assignedTo !== decision.assignedTo;

      let latestVersion = caseRecord.version;

      if (requiresCaseUpdate) {
        const updateResult = await tx.case.updateMany({
          where: {
            id: caseId,
            version: caseRecord.version // Optimistic locking check
          },
          data: {
            stage: decision.stage,
            assignmentGroup: decision.assignmentGroup,
            assignedTo: decision.assignedTo,
            status: caseRecord.status === CaseStatus.OPEN ? CaseStatus.IN_PROGRESS : caseRecord.status,
            version: {
              increment: 1
            }
          }
        });

        if (updateResult.count === 0) {
          throw new ConflictException('Case was updated concurrently. Please refresh and retry.');
        }

        const refreshed = await tx.case.findUnique({
          where: { id: caseId },
          select: {
            version: true
          }
        });
        latestVersion = refreshed?.version ?? caseRecord.version + 1;
      }

      return {
        caseId,
        stage: decision.stage,
        assignedTo: decision.assignedTo,
        version: latestVersion,
        decision: {
          matchedRules: decision.matchedRules,
          reason: decision.reason
        }
      };
    });
  }

  async generateNoticePdf(caseId: number): Promise<Buffer> {
    const caseRecord = await this.getCaseByIdInternal(this.prisma, caseId);

    return this.noticeService.generatePaymentReminderPdf({
      caseRecord,
      customer: caseRecord.customer,
      loan: caseRecord.loan,
      actions: caseRecord.actionLogs.slice(0, 3)
    });
  }

  private async getCaseByIdInternal(
    prismaClient: PrismaService | Prisma.TransactionClient,
    caseId: number
  ): Promise<CaseWithRelations> {
    const caseRecord = await prismaClient.case.findUnique({
      where: {
        id: caseId
      },
      include: {
        customer: true,
        loan: true,
        actionLogs: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        ruleDecisions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!caseRecord) {
      throw new NotFoundException(`Case ${caseId} not found.`);
    }

    return caseRecord;
  }

  calculateDpd(dueDate: Date | string): number {
    const due = dayjs(dueDate);
    const now = dayjs();
    const diff = now.diff(due, 'day');
    return Math.max(0, diff);
  }

  private isFinalCaseStatus(status: CaseStatus): boolean {
    return status === CaseStatus.RESOLVED || status === CaseStatus.CLOSED;
  }

  buildDecisionKey(
    caseId: number,
    dpd: number,
    riskScore: number,
    decision: RuleEvaluationResult
  ): string {
    const hash = createHash('sha256');
    hash.update(
      `${caseId}:${dpd}:${riskScore}:${decision.stage}:${decision.assignmentGroup}:${decision.assignedTo}:${decision.matchedRules.join(',')}`
    );
    return hash.digest('hex');
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
