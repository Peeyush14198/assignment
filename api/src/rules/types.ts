import type { AssignmentGroup, CaseStage } from '@prisma/client';

export interface RuleConditions {
  dpdMin?: number;
  dpdMax?: number;
  dpdGt?: number;
  riskScoreGt?: number;
}

export interface RuleActions {
  stage?: CaseStage;
  assignGroup?: AssignmentGroup;
  assignedTo?: string;
}

export interface AssignmentRule {
  code: string;
  description: string;
  priority: number;
  conditions: RuleConditions;
  actions: RuleActions;
}

export interface RuleEvaluationContext {
  dpd: number;
  riskScore: number;
  currentStage: CaseStage;
}

export interface RuleEvaluationResult {
  stage: CaseStage;
  assignmentGroup: AssignmentGroup;
  assignedTo: string;
  matchedRules: string[];
  reason: string;
}
