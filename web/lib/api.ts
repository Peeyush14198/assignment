export type CaseStage = 'SOFT' | 'HARD' | 'LEGAL';

export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type ActionType = 'CALL' | 'SMS' | 'EMAIL' | 'WHATSAPP';

export type ActionOutcome = 'NO_ANSWER' | 'PROMISE_TO_PAY' | 'PAID' | 'WRONG_NUMBER';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  country: string;
  riskScore: number;
}

export interface Loan {
  id: number;
  customerId: number;
  principal: string;
  outstanding: string;
  dueDate: string;
  status: string;
}

export interface ActionLog {
  id: number;
  caseId: number;
  type: ActionType;
  outcome: ActionOutcome;
  notes: string | null;
  createdAt: string;
}

export interface RuleDecision {
  id: number;
  caseId: number;
  matchedRules: string[];
  reason: string;
  createdAt: string;
}

export interface CaseRecord {
  id: number;
  customerId: number;
  loanId: number;
  dpd: number;
  stage: CaseStage;
  status: CaseStatus;
  assignmentGroup: string | null;
  assignedTo: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  customer: Customer;
  loan: Loan;
  actionLogs: ActionLog[];
  ruleDecisions: RuleDecision[];
}

export interface CaseListResponse {
  data: CaseRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface MetricsResponse {
  openCasesCount: number;
  resolvedTodayCount: number;
  avgOpenDpd: number;
}

export interface AssignmentResponse {
  caseId: number;
  stage: CaseStage;
  assignedTo: string;
  version: number;
  decision: {
    matchedRules: string[];
    reason: string;
  };
}

const INTERNAL_API_BASE_URL =
  process.env.API_BASE_URL?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:3001';

const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = typeof window === 'undefined' ? INTERNAL_API_BASE_URL : PUBLIC_API_BASE_URL;

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: options?.body
      ? {
          'content-type': 'application/json',
          ...(options?.headers ?? {})
        }
      : options?.headers,
    cache: 'no-store'
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

    try {
      const json = (await response.json()) as {
        error?: {
          message?: string;
        };
      };
      if (json.error?.message) {
        message = json.error.message;
      }
    } catch {
      // fallback message is enough
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function toQueryString(searchParams: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

export async function getCases(params: Record<string, string | number | undefined>) {
  const queryString = toQueryString(params);
  return fetchApi<CaseListResponse>(`/api/cases${queryString ? `?${queryString}` : ''}`);
}

export async function createCase(payload: { customerId: number; loanId: number }) {
  return fetchApi<CaseRecord>('/api/cases', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getCaseById(caseId: number) {
  return fetchApi<CaseRecord>(`/api/cases/${caseId}`);
}

export async function getMetrics() {
  return fetchApi<MetricsResponse>('/api/metrics');
}

export async function createActionLog(
  caseId: number,
  payload: { type: ActionType; outcome: ActionOutcome; notes?: string }
) {
  return fetchApi<ActionLog>(`/api/cases/${caseId}/actions`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function runAssignment(caseId: number, expectedVersion?: number) {
  return fetchApi<AssignmentResponse>(`/api/cases/${caseId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ expectedVersion })
  });
}

export function getApiBaseUrl(): string {
  return PUBLIC_API_BASE_URL;
}

export async function createFullCase(data: any) {
  return fetchApi<CaseRecord>('/api/cases/full', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
