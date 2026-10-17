import React, { useState } from 'react';
import { Check, CreditCard, Eye, Lock } from 'lucide-react';
import { useApp, ALL_EXAM_TERMS, TERM_KEY_MAP } from '../../context/AppContext';
import { ExamTerm, PermitStatus, Student } from '../../types';
import { formatDate, peso } from '../../utils/format';
import { StudentAvatar } from '../common/StudentAvatar';
import { AdminModal, adminBtnPrimary } from './AdminModal';
import { useAdminOutlet } from './AdminLayout';
import { AdminPageHeader, AdminStat, DataCard, FilterTabs, IconAction, NewRecordButton, StatusPill, tbl } from './AdminPageParts';

const TERM_ABBR: Record<ExamTerm, string> = {
  'Long Test Prelim': 'LP',
  Prelim: 'PR',
  'Long Test Midterm': 'LM',
  Midterm: 'MT',
  Prefinal: 'PF',
  Finals: 'FN'
};

const PERMIT_STYLE: Record<PermitStatus, string> = {
  cleared: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
  promissory_cleared: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
  locked: 'bg-slate-100 text-slate-400 hover:bg-slate-200'
};

export const AdminStudentLedger: React.FC = () => {
  const { students, overrideStudentPermit, period } = useApp();
  const { openPayment } = useAdminOutlet();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [inspectId, setInspectId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const q = query.trim().toLowerCase();
  const rows = students.filter((s) => {
    const matches =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.lrn.includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.program.toLowerCase().includes(q);
    const balance = s.ledger.outstandingBalance;
    return matches && (filter === 'all' || (filter === 'unpaid' ? balance > 0 : balance === 0));
  });
  const inspect = students.find((s) => s.id === inspectId) ?? null;

  const togglePermit = async (student: Student, term: ExamTerm) => {
    const current = student.permits[TERM_KEY_MAP[term]].status;
    const next: PermitStatus = current === 'locked' ? 'cleared' : 'locked';
    if (!confirm(`${next === 'cleared' ? 'Clear' : 'Lock'} ${student.fullName}'s ${term} permit?`)) return;
    setError((await overrideStudentPermit(student.id, term, next)) ?? '');
  };

  const withBalance = students.filter((s) => s.ledger.outstandingBalance > 0).length;
  const receivables = students.reduce((sum, s) => sum + s.ledger.outstandingBalance, 0);

  return (
    <div className="admin-page">
      <AdminPageHeader
        section="Accounts"
        title="Students & SOA"
        subtitle={`Balances and exam permits${period ? ` for ${period.academicYear} ${period.semester}` : ''}. Click a permit to clear or lock it.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStat label="All Students" value={String(students.length)} active={filter === 'all'} onClick={() => setFilter('all')} />
        <AdminStat label="With Balance" value={String(withBalance)} active={filter === 'unpaid'} onClick={() => setFilter('unpaid')} />
        <AdminStat label="Fully Paid" value={String(students.length - withBalance)} active={filter === 'paid'} onClick={() => setFilter('paid')} />
        <AdminStat label="Receivables" value={peso(receivables)} />
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <DataCard
        title="Student Accounts List"
        actions={<NewRecordButton label="Record Payment" icon={CreditCard} onClick={() => openPayment()} />}
        search={{ value: query, onChange: setQuery, placeholder: 'Search students...' }}
        toolbar={
          <FilterTabs
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unpaid', label: 'With balance' },
              { value: 'paid', label: 'Fully paid' }
            ]}
          />
        }
      >
        <table className={tbl.table}>
          <thead className={tbl.head}>
            <tr>
              <th className={tbl.th}>Student No.</th>
              <th className={tbl.th}>Name</th>
              <th className={tbl.th}>Payment Progress</th>
              <th className={`${tbl.th} text-right`}>Balance</th>
              <th className={tbl.th}>Exam Permits</th>
              <th className={tbl.th}>Status</th>
              <th className={`${tbl.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const pct = s.ledger.totalAssessed > 0 ? Math.min(100, Math.round((s.ledger.totalPaid / s.ledger.totalAssessed) * 100)) : 0;
              const paid = s.ledger.outstandingBalance === 0;
              return (
                <tr key={s.id} className={tbl.row}>
                  <td className={`${tbl.td} font-mono-code text-[13px]`}>{s.studentId}</td>
                  <td className={tbl.td}>
                    <div className="font-medium text-slate-900">{s.fullName}</div>
                    <div className="text-xs text-slate-400">{s.program} · {s.yearLevel}</div>
                  </td>
                  <td className={tbl.td}>
                    <div className="w-44">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-slate-500">{peso(s.ledger.totalPaid)} of {peso(s.ledger.totalAssessed)}</span>
                        <span className="font-semibold text-slate-700">{pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${paid ? 'bg-emerald-500' : 'bg-snc-green-mid'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className={`${tbl.td} text-right font-mono-code text-[13px] ${paid ? 'text-slate-400' : 'font-semibold text-red-600'}`}>
                    {peso(s.ledger.outstandingBalance)}
                  </td>
                  <td className={tbl.td}>
                    <div className="flex gap-1">
                      {ALL_EXAM_TERMS.map((term) => {
                        const status = s.permits[TERM_KEY_MAP[term]].status;
                        return (
                          <button
                            key={term}
                            onClick={() => togglePermit(s, term)}
                            title={`${term}: ${status.replace('_', ' ')} — click to ${status === 'locked' ? 'clear' : 'lock'}`}
                            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${PERMIT_STYLE[status]}`}
                          >
                            {status === 'locked' ? <Lock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            {TERM_ABBR[term]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className={tbl.td}>
                    {paid ? <StatusPill tone="green">Paid</StatusPill> : <StatusPill tone="red">With balance</StatusPill>}
                  </td>
                  <td className={tbl.td}>
                    <div className="flex items-center justify-end gap-1">
                      <IconAction icon={Eye} label="View statement of account" onClick={() => setInspectId(s.id)} />
                      <IconAction icon={CreditCard} label="Record payment" tone="primary" onClick={() => openPayment(s)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div className={tbl.empty}>No students match your search.</div>}
      </DataCard>

      {inspect && (
        <AdminModal title={inspect.fullName} subtitle={`${inspect.studentId} • ${inspect.program}`} onClose={() => setInspectId(null)} wide>
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Assessed</div><div className="font-bold">{peso(inspect.ledger.totalAssessed, true)}</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Paid</div><div className="font-bold text-snc-green-mid">{peso(inspect.ledger.totalPaid, true)}</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Balance</div><div className="font-bold text-red-600">{peso(inspect.ledger.outstandingBalance, true)}</div></div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">Exam dues</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ALL_EXAM_TERMS.map((term) => {
                  const due = inspect.ledger.termBreakdown[TERM_KEY_MAP[term]];
                  const permit = inspect.permits[TERM_KEY_MAP[term]];
                  return (
                    <div key={term} className="rounded-lg border border-slate-200 p-2.5 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        {term}
                        <span className={`rounded border px-1.5 text-[10px] ${PERMIT_STYLE[permit.status]}`}>
                          {permit.status === 'promissory_cleared' ? 'PN' : permit.status === 'cleared' ? 'OK' : '—'}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-500">Paid {peso(due.paid)} / {peso(due.due)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">Payments</h4>
              {inspect.ledger.payments.length === 0 ? (
                <p className="text-slate-500">No payments recorded.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {inspect.ledger.payments.map((p) => (
                    <li key={p.id} className="flex justify-between py-2">
                      <span>
                        <span className="font-mono-code font-semibold">{p.orNumber}</span>
                        <span className="text-slate-500"> • {formatDate(p.date)} • {p.paymentMethod}</span>
                      </span>
                      <span className="font-mono-code font-semibold text-snc-green-mid">{peso(p.amount, true)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end">
              <button onClick={() => { setInspectId(null); openPayment(inspect); }} className={adminBtnPrimary}>
                <CreditCard className="h-4 w-4" /> Record Payment
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
};
