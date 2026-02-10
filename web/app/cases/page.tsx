import Link from 'next/link';
import { Eye, Plus } from 'lucide-react';

import { getCases, getMetrics, type CaseRecord } from '../../lib/api';
import { Button, buttonVariants } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

type CasesSearchParams = Record<string, string | string[] | undefined>;

interface CasesPageProps {
  searchParams: Promise<CasesSearchParams>;
}

function readParam(searchParams: CasesSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getNextPageHref(
  page: number,
  direction: 'prev' | 'next',
  totalPages: number,
  searchParams: CasesSearchParams
): string {
  const targetPage = direction === 'prev' ? Math.max(1, page - 1) : Math.min(totalPages, page + 1);
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  });

  params.set('page', String(targetPage));

  return `/cases?${params.toString()}`;
}

function parseNumericOrUndefined(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseNumericOrUndefined(readParam(resolvedSearchParams, 'page')) ?? 1;
  const pageSize = parseNumericOrUndefined(readParam(resolvedSearchParams, 'pageSize')) ?? 10;

  const [casesResponse, metrics] = await Promise.all([
    getCases({
      page,
      pageSize,
      status: readParam(resolvedSearchParams, 'status'),
      stage: readParam(resolvedSearchParams, 'stage'),
      dpdMin: parseNumericOrUndefined(readParam(resolvedSearchParams, 'dpdMin')),
      dpdMax: parseNumericOrUndefined(readParam(resolvedSearchParams, 'dpdMax')),
      assignedTo: readParam(resolvedSearchParams, 'assignedTo')
    }),
    getMetrics()
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Manage your delinquency cases and assignments.
          </p>
        </div>
        <Link href="/cases/create" className={buttonVariants({ size: 'lg', className: 'w-full sm:w-auto shadow-sm gap-2' })}>
          <Plus className="h-5 w-5" />
          Create Case
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Open Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metrics.openCasesCount}</div>
            <p className="text-xs text-slate-500 mt-1">Active cases needing attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Resolved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{metrics.resolvedTodayCount}</div>
            <p className="text-xs text-slate-500 mt-1">Successfully closed cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Avg Open DPD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{metrics.avgOpenDpd}</div>
            <p className="text-xs text-slate-500 mt-1">Days Past Due average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  name="status"
                  defaultValue={readParam(resolvedSearchParams, 'status') ?? ''}
                  className="flex h-10 w-full items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Stage</label>
                <select
                  name="stage"
                  defaultValue={readParam(resolvedSearchParams, 'stage') ?? ''}
                  className="flex h-10 w-full items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                >
                  <option value="">All Stages</option>
                  <option value="SOFT">Soft</option>
                  <option value="HARD">Hard</option>
                  <option value="LEGAL">Legal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Assigned To</label>
                <Input
                  type="text"
                  name="assignedTo"
                  defaultValue={readParam(resolvedSearchParams, 'assignedTo')}
                  placeholder="Search by assignee..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">DPD Min</label>
                <Input
                  type="number"
                  min={0}
                  name="dpdMin"
                  placeholder="0"
                  defaultValue={readParam(resolvedSearchParams, 'dpdMin')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">DPD Max</label>
                <Input
                  type="number"
                  min={0}
                  name="dpdMax"
                  placeholder="999"
                  defaultValue={readParam(resolvedSearchParams, 'dpdMax')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
              <Link href="/cases" className={buttonVariants({ variant: 'outline' })}>
                Reset
              </Link>
              <Button type="submit">Apply Filters</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500">Case ID</th>
                <th className="px-6 py-3 font-medium text-slate-500">Customer</th>
                <th className="px-6 py-3 font-medium text-slate-500">DPD</th>
                <th className="px-6 py-3 font-medium text-slate-500">Stage</th>
                <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                <th className="px-6 py-3 font-medium text-slate-500">Assigned To</th>
                <th className="px-6 py-3 font-medium text-slate-500">Created At</th>
                <th className="px-6 py-3 font-medium text-slate-500">Risk Score</th>
                <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {casesResponse.data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    No matching cases found.
                  </td>
                </tr>
              ) : (
                casesResponse.data.map((caseItem: CaseRecord) => (
                  <tr key={caseItem.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        href={`/cases/${caseItem.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        #{caseItem.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <Link
                        href={`/cases/${caseItem.id}`}
                        className="hover:text-primary-600 hover:underline decoration-slate-400 underline-offset-4 decoration-dotted"
                      >
                        {caseItem.customer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{caseItem.dpd}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {caseItem.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${caseItem.status === 'OPEN' ? 'bg-blue-50 text-blue-700' :
                        caseItem.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700' :
                          caseItem.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {caseItem.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                            {caseItem.assignedTo.charAt(0)}
                          </div>
                          {caseItem.assignedTo}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(caseItem.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{caseItem.customer.riskScore}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/cases/${caseItem.id}`}>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-primary-600">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Case</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            Page {casesResponse.pagination.page} of {casesResponse.pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Link
              href={getNextPageHref(page, 'prev', casesResponse.pagination.totalPages, resolvedSearchParams)}
              aria-disabled={page <= 1}
            >
              <Button variant="outline" size="sm" disabled={page <= 1}>Previous</Button>
            </Link>
            <Link
              href={getNextPageHref(page, 'next', casesResponse.pagination.totalPages, resolvedSearchParams)}
              aria-disabled={page >= casesResponse.pagination.totalPages}
            >
              <Button variant="outline" size="sm" disabled={page >= casesResponse.pagination.totalPages}>Next</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
