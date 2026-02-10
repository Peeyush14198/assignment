import { Module } from '@nestjs/common';

import { NoticeModule } from '../notice/notice.module';
import { RulesModule } from '../rules/rules.module';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

@Module({
  imports: [RulesModule, NoticeModule],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService]
})
export class CasesModule {}
