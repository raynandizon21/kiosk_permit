import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileSignature,
  Inbox,
  Landmark,
  PiggyBank,
  Wallet
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp, ALL_EXAM_TERMS, TERM_KEY_MAP } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PermitStatus } from '../../types';
import { formatDate, formatDateTime, peso } from '../../utils/format';
import { StudentAvatar } from '../common/StudentAvatar';
import { useAdminOutlet } from './AdminLayout';

// Status colours validated with the dataviz palette checker (labels + gaps carry identity too)
const PERMIT_SERIES: { status: PermitStatus; label: string; color: string }[] = [
  { status: 'cleared', label: 'Cleared', color: '#059669' },
  { status: 'promissory_cleared', label: 'Via promissory note', color: '#d97706' },
  { status: 'locked', label: 'On hold', color: '#e11d48' }
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const StatCard: React.FC<{ icon: LucideIcon; label: string; value: string; children?: React.ReactNode; to?: string }> = ({
  icon: Icon,
  label,
  value,
  children,
  to
}) => {
  const body = (
    <>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-snc-green/10 text-snc-green">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{value}</div>
      {children}
    </>
  );
  return to ? (
    <Link to={to} className="admin-card rounded-2xl p-5 transition-shadow hover:shadow-md">{body}</Link>
  ) : (
    <div className="admin-card rounded-2xl p-5">{body}</div>
  );
};

const EmptyState: React.FC<{ icon: LucideIcon; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-slate-400">
    <Icon className="h-8 w-8" strokeWidth={1.5} />
    {text}
  </div>
);

export const AdminOverview: React.FC = () => {
  const { students, promissoryNotes, auditLogs, currentExamTerm, period } = useApp();
  const { user } = useAuth();
  const { openPayment } = useAdminOutlet();

  const totalAssessed = students.reduce((sum, s) => sum + s.ledger.totalAssessed, 0);
  const totalPaid = students.reduce((sum, s) => sum + s.ledger.totalPaid, 0);
  const totalBalance = students.reduce((sum, s) => sum + s.ledger.outstandingBalance, 0);
  const collectionRate = totalAssessed > 0 ? Math.round((totalPaid / totalAssessed) * 100) : 0;
  const pendingNotes = promissoryNotes.filter((p) => p.status === 'pending');
  const topBalances = students
    .filter((s) => s.ledger.outstandingBalance > 0)
    .sort((a, b) => b.ledger.outstandingBalance - a.ledger.outstandingBalance)
    .slice(0, 5);

  const termRows = ALL_EXAM_TERMS.map((term) => {
    const counts = PERMIT_SERIES.map((s) => ({
      ...s,
      count: students.filter((st) => st.permits[TERM_KEY_MAP[term]].status === s.status).length
    }));
    return { term, counts };
  });

  return (
    <div className="admin-page">
      {/* Greeting banner */}
      <section className="admin-hero flex flex-col gap-5 rounded-2xl p-6 text-white shadow-lg md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/80">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {greeting()}, {user?.fullname.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-sm text-white/75">
            <span className="font-semibold text-snc-neon">{currentExamTerm} Examination</span>
            {period && ` · ${period.academicYear} ${period.semester}`}
            {pendingNotes.length > 0 && ` · ${pendingNotes.length} promissory note${pendingNotes.length > 1 ? 's' : ''} waiting`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openPayment()}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-snc-green hover:bg-emerald-50 cursor-pointer"
          >
            <CreditCard className="h-4 w-4" /> Record Payment
          </button>
          <Link
            to="/admin/promissory-notes"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
          >
            <FileSignature className="h-4 w-4" /> Review Notes
          </Link>
          <a
            href="/kiosk"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
          >
            <ExternalLink className="h-4 w-4" /> Open Kiosk
          </a>
        </div>
      </section>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Landmark} label="Total Assessed" value={peso(totalAssessed)}>
          <p className="mt-1 text-xs text-slate-500">{students.length} enrolled students</p>
        </StatCard>
        <StatCard icon={PiggyBank} label="Collected" value={peso(totalPaid)}>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" role="meter" aria-valuenow={collectionRate} aria-valuemin={0} aria-valuemax={100} aria-label="Collection rate">
              <div className="h-full rounded-full bg-snc-green-mid" style={{ width: `${collectionRate}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-700">{collectionRate}%</span>
          </div>
        </StatCard>
        <StatCard icon={Wallet} label="Receivables" value={peso(totalBalance)} to="/admin/students">
          <p className="mt-1 text-xs text-slate-500">{topBalances.length > 0 ? `${students.filter((s) => s.ledger.outstandingBalance > 0).length} students with balance` : 'Everyone is paid up'}</p>
        </StatCard>
        <StatCard icon={FileSignature} label="Pending Notes" value={String(pendingNotes.length)} to="/admin/promissory-notes">
          <p className="mt-1 text-xs text-slate-500">{promissoryNotes.length} total this semester</p>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* Permit clearance by term */}
        <section className="admin-card rounded-2xl p-5 xl:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">Exam permit clearance</h3>
            <ul className="flex flex-wrap gap-3 text-xs text-slate-600">
              {PERMIT_SERIES.map((s) => (
                <li key={s.status} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            {termRows.map(({ term, counts }) => {
              const active = term === currentExamTerm;
              return (
                <div key={term} className={`grid grid-cols-[8rem_1fr_3rem] items-center gap-3 rounded-xl px-2 py-1.5 ${active ? 'bg-emerald-50' : ''}`}>
                  <span className={`text-xs ${active ? 'font-bold text-snc-green' : 'text-slate-600'}`}>
                    {term}
                    {active && <span className="block text-[10px] font-semibold uppercase tracking-wider">Current</span>}
                  </span>
                  <div className="flex h-6 gap-[2px] overflow-hidden rounded" aria-label={`${term}: ${counts.map((c) => `${c.count} ${c.label}`).join(', ')}`}>
                    {students.length === 0 ? (
                      <div className="flex-1 bg-slate-100" />
                    ) : (
                      counts
                        .filter((c) => c.count > 0)
                        .map((c) => (
                          <div
                            key={c.status}
                            title={`${term} — ${c.label}: ${c.count}`}
                            className="flex items-center justify-center text-[11px] font-bold text-white first:rounded-l last:rounded-r"
                            style={{ background: c.color, flexGrow: c.count }}
                          >
                            {c.count}
                          </div>
                        ))
                    )}
                  </div>
                  <span className="text-right text-xs font-semibold tabular-nums text-slate-700">
                    {students.length ? Math.round(((students.length - counts[2].count) / students.length) * 100) : 0}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Highest balances */}
        <section className="admin-card rounded-2xl p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Highest balances</h3>
            <Link to="/admin/students" className="flex items-center gap-1 text-xs font-semibold text-snc-green-mid">
              All students <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {topBalances.length === 0 ? (
            <EmptyState icon={PiggyBank} text="No outstanding balances." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {topBalances.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <StudentAvatar name={s.fullName} className="h-9 w-9 text-xs" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{s.fullName}</div>
                    <div className="truncate text-xs text-slate-500">{s.program}</div>
                  </div>
                  <span className="font-mono-code text-sm font-semibold text-red-600">{peso(s.ledger.outstandingBalance)}</span>
                  <button onClick={() => openPayment(s)} title="Record payment" className="rounded-lg p-2 text-snc-green-mid hover:bg-emerald-50 cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="admin-card rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Promissory notes to review</h3>
            <Link to="/admin/promissory-notes" className="flex items-center gap-1 text-xs font-semibold text-snc-green-mid">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {pendingNotes.length === 0 ? (
            <EmptyState icon={Inbox} text="Nothing to review — all caught up." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingNotes.slice(0, 5).map((n) => (
                <li key={n.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">{n.term}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">{n.studentName}</div>
                    <div className="text-xs text-slate-500">
                      {peso(n.committedAmount)} on {formatDate(n.committedPaymentDate)}
                    </div>
                  </div>
                  <span className="font-mono-code text-xs text-slate-400">{n.referenceNo}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent activity</h3>
            <Link to="/admin/logs" className="flex items-center gap-1 text-xs font-semibold text-snc-green-mid">
              All logs <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {auditLogs.length === 0 ? (
            <EmptyState icon={Activity} text="No activity yet. Kiosk and cashier actions will show here." />
          ) : (
            <ol className="relative space-y-3 border-l-2 border-emerald-100 pl-4">
              {auditLogs.slice(0, 5).map((log) => (
                <li key={log.id} className="relative text-sm">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-snc-green-mid" aria-hidden />
                  <div className="text-slate-800">{log.description}</div>
                  <div className="text-xs text-slate-500">
                    {formatDateTime(log.timestamp)} • {log.actor}
                    {log.studentName && ` • ${log.studentName}`}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
};
