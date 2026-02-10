'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download, PlayCircle, Save } from 'lucide-react';

import type { ActionLog, ActionOutcome, ActionType, AssignmentResponse } from '../lib/api';
import { createActionLog, runAssignment } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';

interface CaseActionsPanelProps {
  caseId: number;
  initialVersion: number;
  apiBaseUrl: string;
  actionLogs: ActionLog[];
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
  apiBaseUrl,
  actionLogs
}: CaseActionsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [version, setVersion] = useState(initialVersion);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionType, setActionType] = useState<ActionType>('CALL');
  const [actionOutcome, setActionOutcome] = useState<ActionOutcome>('NO_ANSWER');
  const [notes, setNotes] = useState('');

  const [pdfUrl, setPdfUrl] = useState<string>('');

  // Calculate PDF URL only on client to avoid hydration mismatch and ensure correct host
  useEffect(() => {
    // If running in browser, try to guess the API URL if env var isn't perfect.
    // We assume API is on port 3001 if header is on 3000, or we use the env var fallback.
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (baseUrl) {
      setPdfUrl(`${baseUrl}/api/cases/${caseId}/notice`);
    } else {
      // Fallback: use current hostname but port 3001
      const hostname = window.location.hostname;
      setPdfUrl(`http://${hostname}:3001/api/cases/${caseId}/notice`);
    }
  }, [caseId]);

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
        <CardContent className="flex flex-col gap-3">
          <Button
            onClick={handleRunAssignment}
            disabled={isPending}
            className="w-full justify-start h-auto py-3 px-4"
          >
            <PlayCircle className="mr-3 h-5 w-5 shrink-0" />
            <div className="flex flex-col items-start text-left">
              <span className="font-semibold">Run Assignment Rules</span>
              <span className="text-xs opacity-90 font-normal">Trigger auto-assignment based on rules</span>
            </div>
          </Button>
          <a href={pdfUrl} target="_blank" rel="noreferrer" className="w-full">
            <Button variant="secondary" className="w-full justify-start h-auto py-3 px-4">
              <Download className="mr-3 h-5 w-5 shrink-0" />
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold">Download Notice PDF</span>
                <span className="text-xs opacity-90 font-normal">Generate payment reminder letter</span>
              </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 font-medium text-slate-500">Type</th>
                  <th className="px-4 py-2 font-medium text-slate-500">Outcome</th>
                  <th className="px-4 py-2 font-medium text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actionLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-slate-500">No actions recorded.</td>
                  </tr>
                ) : (
                  actionLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2 font-medium">{log.type}</td>
                      <td className="px-4 py-2">
                        {log.outcome}
                        {log.notes && (
                          <p className="text-xs text-slate-500 mt-1">{log.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-500 text-xs">
                        <span suppressHydrationWarning>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
