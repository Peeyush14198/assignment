import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, DollarSign, User } from 'lucide-react';

import { CaseActionsPanel } from '../../../components/case-actions-panel';
import { getApiBaseUrl, getCaseById } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

interface CaseDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CaseDetailsPage({ params }: CaseDetailsPageProps) {
  const { id } = await params;
  const caseId = Number(id);

  if (!Number.isFinite(caseId) || caseId <= 0) {
    notFound();
  }

  try {
    const caseData = await getCaseById(caseId);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link href="/cases" className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-sm font-medium w-fit">
            <ArrowLeft className="h-4 w-4" /> Back to Cases
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                Case #{caseData.id}
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${caseData.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                    caseData.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                      caseData.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                  }`}>
                  {caseData.status}
                </span>
              </h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" /> {caseData.customer.name}
                </span>
                <span className="flex items-center gap-1">
                  DPD: <span className="font-medium text-slate-700">{caseData.dpd}</span>
                </span>
                <span className="flex items-center gap-1">
                  Stage: <span className="font-medium text-slate-700">{caseData.stage}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium">{caseData.customer.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium">{caseData.customer.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium">{caseData.customer.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Country</span>
                    <span className="font-medium">{caseData.customer.country}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Risk Score</span>
                    <span className="font-medium">{caseData.customer.riskScore}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Loan Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Loan ID</span>
                    <span className="font-medium">#{caseData.loan.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Principal</span>
                    <span className="font-medium">${Number(caseData.loan.principal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Outstanding</span>
                    <span className="font-medium text-red-600">${Number(caseData.loan.outstanding).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Due Date</span>
                    <span className="font-medium">{new Date(caseData.loan.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium">{caseData.loan.status}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-medium text-slate-500">Type</th>
                        <th className="px-4 py-2 font-medium text-slate-500">Outcome</th>
                        <th className="px-4 py-2 font-medium text-slate-500">Notes</th>
                        <th className="px-4 py-2 font-medium text-slate-500">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {caseData.actionLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No actions recorded yet.</td>
                        </tr>
                      ) : (
                        caseData.actionLogs.map(log => (
                          <tr key={log.id}>
                            <td className="px-4 py-2 font-medium">{log.type}</td>
                            <td className="px-4 py-2">{log.outcome}</td>
                            <td className="px-4 py-2 text-slate-600 max-w-xs truncate" title={log.notes || ''}>{log.notes || '-'}</td>
                            <td className="px-4 py-2 text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base text-slate-500">System Audit: Assignment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-2 font-medium text-slate-500">Time</th>
                        <th className="px-4 py-2 font-medium text-slate-500">Rules Matched</th>
                        <th className="px-4 py-2 font-medium text-slate-500">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {caseData.ruleDecisions.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-center text-slate-500">No history.</td>
                        </tr>
                      ) : (
                        caseData.ruleDecisions.map(decision => (
                          <tr key={decision.id}>
                            <td className="px-4 py-2 text-slate-500">{new Date(decision.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-2 font-mono">{decision.matchedRules.join(', ') || '-'}</td>
                            <td className="px-4 py-2 text-slate-600">{decision.reason}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-6">
            <Card className="bg-slate-50/50 border-slate-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wide text-slate-500">Case Metadata</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned To:</span>
                  <span className="font-medium">{caseData.assignedTo || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created:</span>
                  <span className="font-medium">{new Date(caseData.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Version:</span>
                  <span className="font-medium">{caseData.version}</span>
                </div>
              </CardContent>
            </Card>

            <CaseActionsPanel
              caseId={caseData.id}
              initialVersion={caseData.version}
              apiBaseUrl={getApiBaseUrl()}
            />
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
