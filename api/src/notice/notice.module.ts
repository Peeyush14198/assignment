import { Module } from '@nestjs/common';

import { NoticeService } from './notice.service';

@Module({
  providers: [NoticeService],
  exports: [NoticeService]
})
export class NoticeModule {}
