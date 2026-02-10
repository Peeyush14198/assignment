import type { ConfigService } from '@nestjs/config';

import { RuleEngineService } from './rule-engine.service';

describe('RuleEngineService', () => {
  it('applies DPD rule and risk override in sequence', () => {
    const configService = {
      get: () => './rules/default-rules.json'
    } as unknown as ConfigService;

    const service = new RuleEngineService(configService);

    (service as unknown as { rules: Array<Record<string, unknown>> }).rules = [
      {
        code: 'DPD_8_30',
        description: 'dpd rule',
        priority: 20,
        conditions: { dpdMin: 8, dpdMax: 30 },
        actions: { stage: 'HARD', assignGroup: 'Tier2' }
      },
      {
        code: 'RISK_GT_80_OVERRIDE',
        description: 'risk override',
        priority: 100,
        conditions: { riskScoreGt: 80 },
        actions: { assignedTo: 'SeniorAgent' }
      }
    ];

    const decision = service.evaluate({ dpd: 12, riskScore: 92, currentStage: 'SOFT' });

    expect(decision.stage).toBe('HARD');
    expect(decision.assignmentGroup).toBe('Tier2');
    expect(decision.assignedTo).toBe('SeniorAgent');
    expect(decision.matchedRules).toEqual(['DPD_8_30', 'RISK_GT_80_OVERRIDE']);
  });
});
