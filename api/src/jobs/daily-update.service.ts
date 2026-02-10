import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CaseStatus } from '@prisma/client';
import dayjs from 'dayjs';

import { CasesService } from '../cases/cases.service';
import { PrismaService } from '../prisma/prisma.service';
import { RuleEngineService } from '../rules/rule-engine.service';

@Injectable()
export class DailyUpdateService {
  private readonly logger = new Logger(DailyUpdateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rulesService: RuleEngineService,
    private readonly casesService: CasesService
  ) {}

  // Runs every day at midnight.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyUpdates() {
    this.logger.log('Starting daily DPD recalculation and escalation job...');

    const activeCases = await this.prisma.case.findMany({
      where: {
        status: {
          in: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS]
        }
      },
      include: {
        customer: true,
        loan: true
      }
    });

    this.logger.log(`Found ${activeCases.length} active cases to process.`);

    let processedCount = 0;
    let updatedCount = 0;

    for (const caseRecord of activeCases) {
      try {
        // 1. Recalculate DPD
        const newDpd = this.casesService.calculateDpd(caseRecord.loan.dueDate);

        // 2. Evaluate Rules with new DPD
        const decision = this.rulesService.evaluate({
          dpd: newDpd,
          riskScore: caseRecord.customer.riskScore,
          currentStage: caseRecord.stage
        });

        // 3. Check if update is needed
        const requiresUpdate =
          caseRecord.dpd !== newDpd ||
          caseRecord.stage !== decision.stage ||
          caseRecord.assignmentGroup !== decision.assignmentGroup ||
          caseRecord.assignedTo !== decision.assignedTo;

        if (requiresUpdate) {
          await this.prisma.case.update({
            where: { id: caseRecord.id },
            data: {
              dpd: newDpd,
              stage: decision.stage,
              assignmentGroup: decision.assignmentGroup,
              assignedTo: decision.assignedTo,
              version: { increment: 1 }
            }
          });
          updatedCount++;
        }

        processedCount++;
      } catch (error) {
        this.logger.error(`Failed to process case ${caseRecord.id}: ${error.message}`, error.stack);
      }
    }

    this.logger.log(`Daily job completed. Processed: ${processedCount}, Updated: ${updatedCount}`);
  }
}
