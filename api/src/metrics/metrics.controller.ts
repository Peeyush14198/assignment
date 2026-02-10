import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MetricsResponseDto } from './dto/metrics-response.dto';

import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Return dashboard metrics for open/resolved cases and average DPD.' })
  @ApiOkResponse({ description: 'Dashboard metrics snapshot.', type: MetricsResponseDto })
  getDashboardMetrics() {
    return this.metricsService.getDashboardMetrics();
  }
}
