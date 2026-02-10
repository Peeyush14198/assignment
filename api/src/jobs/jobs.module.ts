import { Module } from '@nestjs/common';

import { CasesModule } from '../cases/cases.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RulesModule } from '../rules/rules.module';
import { DailyUpdateService } from './daily-update.service';

@Module({
  imports: [PrismaModule, RulesModule, CasesModule],
  providers: [DailyUpdateService],
  exports: [DailyUpdateService]
})
export class JobsModule {}
