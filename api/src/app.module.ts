import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { CasesModule } from './cases/cases.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { StructuredLoggerMiddleware } from './common/middleware/structured-logger.middleware';
import { JobsModule } from './jobs/jobs.module';
import { MetricsModule } from './metrics/metrics.module';
import { NoticeModule } from './notice/notice.module';
import { PrismaModule } from './prisma/prisma.module';
import { RulesModule } from './rules/rules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env']
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RulesModule,
    NoticeModule,
    CasesModule,
    MetricsModule,
    JobsModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, StructuredLoggerMiddleware)
      .forRoutes('*');
  }
}
