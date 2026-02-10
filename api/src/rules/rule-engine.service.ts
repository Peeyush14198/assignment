import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AssignmentGroup, CaseStage } from '@prisma/client';
import { readFileSync } from 'fs';
import { isAbsolute, join } from 'path';

import type {
  AssignmentRule,
  RuleEvaluationContext,
  RuleEvaluationResult
} from './types';

const ASSIGNMENT_GROUP_TO_AGENT: Record<AssignmentGroup, string> = {
  Tier1: 'Tier1Queue',
  Tier2: 'Tier2Queue',
  Legal: 'LegalDesk'
};

@Injectable()
export class RuleEngineService implements OnModuleInit {
  private readonly logger = new Logger(RuleEngineService.name);

  private rules: AssignmentRule[] = [];

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.loadRulesFromFile();
  }

  getLoadedRules(): AssignmentRule[] {
    return this.rules;
  }

  // Evaluates a case context against all loaded rules from top to bottom.
  // Returns the first rule that matches logic (or cumulative logic if designed so).
  // Current implementation: Multi-match capable, establishes final state based on priority order.
  evaluate(context: RuleEvaluationContext): RuleEvaluationResult {
    if (this.rules.length === 0) {
      this.loadRulesFromFile();
    }

    let stage: CaseStage = context.currentStage;
    let assignmentGroup: AssignmentGroup = 'Tier1';
    let assignedTo = ASSIGNMENT_GROUP_TO_AGENT.Tier1;

    const matchedRules: string[] = [];
    const reasonParts: string[] = [];

    for (const rule of this.rules) {
      if (!this.matches(rule, context)) {
        continue;
      }

      matchedRules.push(rule.code);

      if (rule.actions.stage) {
        stage = rule.actions.stage;
      }

      if (rule.actions.assignGroup) {
        assignmentGroup = rule.actions.assignGroup;
        assignedTo = ASSIGNMENT_GROUP_TO_AGENT[assignmentGroup];
      }

      if (rule.actions.assignedTo) {
        assignedTo = rule.actions.assignedTo;
      }

      reasonParts.push(this.buildReason(rule, context));
    }

    if (matchedRules.length === 0) {
      reasonParts.push('No rule matched. Defaulting to Tier1Queue and SOFT stage.');
    }

    return {
      stage,
      assignmentGroup,
      assignedTo,
      matchedRules,
      reason: reasonParts.join('; ')
    };
  }

  // Loads rules from a JSON file.
  // In a real production system, this could load from a separate Rules Microservice or DB table.
  private loadRulesFromFile(): void {
    const rulesPathConfig = this.configService.get<string>('RULES_FILE') ?? './rules/default-rules.json';
    const resolvedPath = isAbsolute(rulesPathConfig)
      ? rulesPathConfig
      : join(process.cwd(), rulesPathConfig);

    const rawFile = readFileSync(resolvedPath, 'utf-8');
    const parsedRules = JSON.parse(rawFile) as AssignmentRule[];

    this.rules = parsedRules.sort((a, b) => a.priority - b.priority);
    this.logger.log(`Loaded ${this.rules.length} assignment rules from ${resolvedPath}`);
  }

  private matches(rule: AssignmentRule, context: RuleEvaluationContext): boolean {
    const { conditions } = rule;

    if (typeof conditions.dpdMin === 'number' && context.dpd < conditions.dpdMin) {
      return false;
    }

    if (typeof conditions.dpdMax === 'number' && context.dpd > conditions.dpdMax) {
      return false;
    }

    if (typeof conditions.dpdGt === 'number' && context.dpd <= conditions.dpdGt) {
      return false;
    }

    if (typeof conditions.riskScoreGt === 'number' && context.riskScore <= conditions.riskScoreGt) {
      return false;
    }

    return true;
  }

  private buildReason(rule: AssignmentRule, context: RuleEvaluationContext): string {
    const reasonTokens: string[] = [];

    if (typeof rule.conditions.dpdMin === 'number' || typeof rule.conditions.dpdMax === 'number') {
      reasonTokens.push(`dpd=${context.dpd}`);
    }

    if (typeof rule.conditions.dpdGt === 'number') {
      reasonTokens.push(`dpd>${rule.conditions.dpdGt}`);
    }

    if (typeof rule.conditions.riskScoreGt === 'number') {
      reasonTokens.push(`riskScore=${context.riskScore}`);
    }

    const outputs: string[] = [];
    if (rule.actions.stage) {
      outputs.push(`stage=${rule.actions.stage}`);
    }

    if (rule.actions.assignGroup) {
      outputs.push(`group=${rule.actions.assignGroup}`);
    }

    if (rule.actions.assignedTo) {
      outputs.push(`assignedTo=${rule.actions.assignedTo}`);
    }

    const conditionText = reasonTokens.length > 0 ? reasonTokens.join(', ') : 'conditions met';

    return `${rule.code} (${conditionText}) -> ${outputs.join(', ') || 'no action'}`;
  }
}
