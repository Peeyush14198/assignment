import { Injectable } from '@nestjs/common';
import { CaseStatus } from '@prisma/client';
import dayjs from 'dayjs';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(): Promise<{
    openCasesCount: number;
    resolvedTodayCount: number;
    avgOpenDpd: number;
  }> {
    const startOfToday = dayjs().startOf('day').toDate();
    const endOfToday = dayjs().endOf('day').toDate();

    const [openCasesCount, resolvedTodayCount, averageDpd] = await this.prisma.$transaction([
      this.prisma.case.count({
        where: {
          status: {
            in: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS]
          }
        }
      }),
      this.prisma.case.count({
        where: {
          status: CaseStatus.RESOLVED,
          resolvedAt: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      }),
      this.prisma.case.aggregate({
        where: {
          status: {
            in: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS]
          }
        },
        _avg: {
          dpd: true
        }
      })
    ]);

    return {
      openCasesCount,
      resolvedTodayCount,
      avgOpenDpd: Number((averageDpd._avg.dpd ?? 0).toFixed(2))
    };
  }
}
