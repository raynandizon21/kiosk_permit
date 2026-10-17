import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Calculator,
  CalendarCog,
  CheckCircle2,
  CreditCard,
  Database,
  FileSignature,
  LogIn,
  Printer,
  RotateCcw,
  ShieldAlert,
  UserCog,
  UserPlus,
  UserX,
  Wallet,
  XCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../utils/format';
import { AdminPageHeader, AdminStat, DataCard, FilterTabs, PillTone, StatusPill, tbl } from './AdminPageParts';

type ActionUi = { label: string; icon: LucideIcon; tone: PillTone; group: 'kiosk' | 'accounting' };

const ACTIONS: Record<string, ActionUi> = {
  kiosk_login: { label: 'Kiosk sign-in', icon: LogIn, tone: 'blue', group: 'kiosk' },
  soa_print: { label: 'SOA printed', icon: Printer, tone: 'gray', group: 'kiosk' },
  permit_print: { label: 'Permit printed', icon: Printer, tone: 'gray', group: 'kiosk' },
  promissory_print: { label: 'PN receipt printed', icon: Printer, tone: 'gray', group: 'kiosk' },
  payment_slip_print: { label: 'Order of payment printed', icon: Wallet, tone: 'amber', group: 'kiosk' },
  promissory_submit: { label: 'PN submitted', icon: FileSignature, tone: 'amber', group: 'kiosk' },
  pn_approve: { label: 'PN approved', icon: CheckCircle2, tone: 'green', group: 'accounting' },
  pn_reject: { label: 'PN declined', icon: XCircle, tone: 'red', group: 'accounting' },
  payment: { label: 'Payment', icon: CreditCard, tone: 'green', group: 'accounting' },
  permit_override: { label: 'Permit changed', icon: ShieldAlert, tone: 'violet', group: 'accounting' },
  term_change: { label: 'Term changed', icon: CalendarCog, tone: 'violet', group: 'accounting' },
  student_add: { label: 'Student added', icon: UserPlus, tone: 'green', group: 'accounting' },
  student_update: { label: 'Student updated', icon: UserCog, tone: 'blue', group: 'accounting' },
  student_deactivate: { label: 'Student deactivated', icon: UserX, tone: 'red', group: 'accounting' },
  student_restore: { label: 'Student restored', icon: RotateCcw, tone: 'green', group: 'accounting' },
  assessment_update: { label: 'Assessment updated', icon: Calculator, tone: 'blue', group: 'accounting' },
  maintenance: { label: 'File maintenance', icon: Database, tone: 'gray', group: 'accounting' }
};

const FALLBACK: ActionUi = { label: 'Activity', icon: Activity, tone: 'gray', group: 'accounting' };

type Group = 'all' | 'kiosk' | 'accounting';

const isToday = (value: string) => new Date(value.replace(' ', 'T')).toDateString() === new Date().toDateString();

export const AdminActivityLogs: React.FC = () => {
  const { auditLogs } = useApp();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<Group>('all');

  const groupOf = (action: string) => (ACTIONS[action] ?? FALLBACK).group;
  const q = query.trim().toLowerCase();
  const rows = auditLogs.filter(
    (l) =>
      (group === 'all' || groupOf(l.action) === group) &&
      (!q ||
        l.description.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        (l.studentName ?? '').toLowerCase().includes(q) ||
        (l.studentLrn ?? '').includes(q))
  );

  return (
    <div className="admin-page">
      <AdminPageHeader section="System" title="Activity Logs" subtitle="Everything done at the kiosk and in the accounting portal." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStat label="Today" value={String(auditLogs.filter((l) => isToday(l.timestamp)).length)} />
        <AdminStat label="Kiosk Activity" value={String(auditLogs.filter((l) => groupOf(l.action) === 'kiosk').length)} active={group === 'kiosk'} onClick={() => setGroup('kiosk')} />
        <AdminStat label="Accounting Activity" value={String(auditLogs.filter((l) => groupOf(l.action) === 'accounting').length)} active={group === 'accounting'} onClick={() => setGroup('accounting')} />
        <AdminStat label="Total Logs" value={String(auditLogs.length)} active={group === 'all'} onClick={() => setGroup('all')} />
      </div>

      <DataCard
        title="Activity Logs List"
        search={{ value: query, onChange: setQuery, placeholder: 'Search activity...' }}
        toolbar={
          <FilterTabs<Group>
            value={group}
            onChange={setGroup}
            options={[
              { value: 'all', label: 'All' },
              { value: 'kiosk', label: 'Kiosk' },
              { value: 'accounting', label: 'Accounting' }
            ]}
          />
        }
      >
        <table className={tbl.table}>
          <thead className={tbl.head}>
            <tr>
              <th className={tbl.th}>Date</th>
              <th className={tbl.th}>Activity</th>
              <th className={tbl.th}>Details</th>
              <th className={tbl.th}>Student</th>
              <th className={tbl.th}>Done By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => {
              const ui = ACTIONS[log.action] ?? FALLBACK;
              return (
                <tr key={log.id} className={tbl.row}>
                  <td className={`${tbl.td} whitespace-nowrap text-slate-500`}>{formatDateTime(log.timestamp)}</td>
                  <td className={`${tbl.td} whitespace-nowrap`}>
                    <StatusPill tone={ui.tone}>
                      <ui.icon className="h-3 w-3" /> {ui.label}
                    </StatusPill>
                  </td>
                  <td className={tbl.td}>{log.description}</td>
                  <td className={`${tbl.td} whitespace-nowrap`}>{log.studentName ?? '—'}</td>
                  <td className={`${tbl.td} whitespace-nowrap`}>{log.actor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div className={tbl.empty}>No activity found.</div>}
      </DataCard>
    </div>
  );
};
