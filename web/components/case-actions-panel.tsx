'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download, PlayCircle, Save } from 'lucide-react';

import type { ActionOutcome, ActionType, AssignmentResponse } from '../lib/api';
import { createActionLog, runAssignment } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';

interface CaseActionsPanelProps {
  caseId: number;
  initialVersion: number;
  apiBaseUrl: string;
}

const actionTypes: ActionType[] = ['CALL', 'SMS', 'EMAIL', 'WHATSAPP'];
const actionOutcomes: ActionOutcome[] = [
  'NO_ANSWER',
  'PROMISE_TO_PAY',
  'PAID',
  'WRONG_NUMBER'
];

export function CaseActionsPanel({
  caseId,
  initialVersion,
  apiBaseUrl
}: CaseActionsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [version, setVersion] = useState(initialVersion);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionType, setActionType] = useState<ActionType>('CALL');
  const [actionOutcome, setActionOutcome] = useState<ActionOutcome>('NO_ANSWER');
  const [notes, setNotes] = useState('');

  const pdfUrl = useMemo(() => `${apiBaseUrl}/api/cases/${caseId}/notice.pdf`, [apiBaseUrl, caseId]);

  // Triggers the "Run Assignment" rule engine on the server.
  // Updates local state with the result (new stage/assignee) without a full page reload,
  // but calls router.refresh() to ensure other server components are updated.
  const handleRunAssignment = () => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await runAssignment(caseId, version);
        setAssignmentResult(result);
        setVersion(result.version);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to run assignment.');
      }
    });
  };

  // Optimistically adds an action log.
  // In a real app, we might update the UI immediately, but here we wait for server confirmation
  // and then refresh the data.
  const handleActionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await createActionLog(caseId, {
          type: actionType,
          outcome: actionOutcome,
          notes: notes.trim() || undefined
        });

        setNotes('');
        router.refresh();
        // Reset defaults
        setActionType('CALL');
        setActionOutcome('NO_ANSWER');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to add action log.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleRunAssignment}
            disabled={isPending}
            className="flex-1"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {isPending ? 'Running...' : 'Run Assignment Rules'}
          </Button>
          <a href={pdfUrl} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="secondary" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Notice PDF
            </Button>
          </a>
        </CardContent>
        {assignmentResult && (
          <div className="px-6 pb-6 pt-0">
            <div className="bg-emerald-50 text-emerald-900 p-4 rounded-md border border-emerald-100 text-sm">
              <p className="font-semibold mb-1">Assignment Result:</p>
              <div className="grid grid-cols-2 gap-2">
                <span>Stage: <strong>{assignmentResult.stage}</strong></span>
                <span>Assigned To: <strong>{assignmentResult.assignedTo}</strong></span>
              </div>
              <div className="mt-2 text-emerald-800 text-xs">
                matched: {assignmentResult.decision.matchedRules.join(', ') || 'None'}
              </div>
            </div>
          </div>
        )}
        {errorMessage && (
          <div className="px-6 pb-6 pt-0">
            <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-100 text-sm">
              {errorMessage}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Action</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleActionSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Type</label>
                <Select value={actionType} onChange={(event) => setActionType(event.target.value as ActionType)}>
                  {actionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Outcome</label>
                <Select
                  value={actionOutcome}
                  onChange={(event) => setActionOutcome(event.target.value as ActionOutcome)}
                >
                  {actionOutcomes.map((outcome) => (
                    <option key={outcome} value={outcome}>
                      {outcome}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Details about the interaction..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isPending ? 'Saving...' : 'Log Action'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
