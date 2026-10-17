import React, { useState } from 'react';
import { Banknote, ClipboardCheck, Eye, Loader2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WithdrawalRequest } from '../../types';
import { formatDate, formatDateTime, peso } from '../../utils/format';
import { AdminModal, adminBtnPrimary, adminBtnSecondary } from './AdminModal';
import { AdminPageHeader, AdminStat, DataCard, FilterTabs, IconAction, PillTone, StatusPill, tbl } from './AdminPageParts';

type Filter = 'pending' | 'released' | 'declined' | 'all';

const STATUS_UI: Record<WithdrawalRequest['status'], { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'amber' },
  released: { label: 'Released', tone: 'green' },
  declined: { label: 'Declined', tone: 'red' }
};

export const AdminWithdrawalRequests: React.FC = () => {
  const { withdrawalRequests, reviewWithdrawal } = useApp();
  const [filter, setFilter] = useState<Filter>('pending');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<WithdrawalRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const q = query.trim().toLowerCase();
  const rows = withdrawalRequests.filter(
    (w) =>
      (filter === 'all' || w.status === filter) &&
      (!q ||
        w.studentName.toLowerCase().includes(q) ||
        w.studentLrn.includes(q) ||
        (w.referenceNo ?? '').toLowerCase().includes(q))
  );

  const decide = async (status: 'released' | 'declined') => {
    if (!selected) return;
    if (status === 'declined' && !remarks.trim()) {
      setError('Please give the reason for declining.');
      return;
    }
    setSaving(true);
    const err = await reviewWithdrawal(selected.id, status, remarks.trim());
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      setSelected(null);
      setRemarks('');
      setError('');
    }
  };

  const count = (status: WithdrawalRequest['status']) => withdrawalRequests.filter((w) => w.status === status).length;

  return (
    <div className="admin-page">
      <AdminPageHeader
        section="Accounts"
        title="Withdrawal Requests"
        subtitle="Deposited credit students asked to cash out at the kiosk. Release once you've handed over the cash."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStat label="Pending" value={String(count('pending'))} active={filter === 'pending'} onClick={() => setFilter('pending')} />
        <AdminStat label="Released" value={String(count('released'))} active={filter === 'released'} onClick={() => setFilter('released')} />
        <AdminStat label="Declined" value={String(count('declined'))} active={filter === 'declined'} onClick={() => setFilter('declined')} />
        <AdminStat label="Total Requests" value={String(withdrawalRequests.length)} active={filter === 'all'} onClick={() => setFilter('all')} />
      </div>

      <DataCard
        title="Withdrawal Requests List"
        search={{ value: query, onChange: setQuery, placeholder: 'Search withdrawal requests...' }}
        toolbar={
          <FilterTabs
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'released', label: 'Released' },
              { value: 'declined', label: 'Declined' },
              { value: 'all', label: 'All' }
            ]}
          />
        }
      >
        <table className={tbl.table}>
          <thead className={tbl.head}>
            <tr>
              <th className={tbl.th}>Reference</th>
              <th className={tbl.th}>Student</th>
              <th className={`${tbl.th} text-right`}>Amount</th>
              <th className={tbl.th}>Requested</th>
              <th className={tbl.th}>Status</th>
              <th className={`${tbl.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => {
              const ui = STATUS_UI[w.status];
              return (
                <tr key={w.id} className={tbl.row}>
                  <td className={`${tbl.td} font-mono-code text-[13px]`}>{w.referenceNo}</td>
                  <td className={tbl.td}>
                    <div className="font-medium text-slate-900">{w.studentName}</div>
                    <div className="text-xs text-slate-400">{w.program}</div>
                  </td>
                  <td className={`${tbl.td} text-right font-mono-code text-[13px] font-semibold text-slate-900`}>{peso(w.amount)}</td>
                  <td className={tbl.td}>{formatDate(w.requestedAt)}</td>
                  <td className={tbl.td}>
                    <StatusPill tone={ui.tone}>{ui.label}</StatusPill>
                  </td>
                  <td className={tbl.td}>
                    <div className="flex items-center justify-end gap-1">
                      <IconAction
                        icon={w.status === 'pending' ? ClipboardCheck : Eye}
                        label={w.status === 'pending' ? 'Review request' : 'View request'}
                        tone={w.status === 'pending' ? 'primary' : 'default'}
                        onClick={() => {
                          setSelected(w);
                          setRemarks('');
                          setError('');
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div className={tbl.empty}>No withdrawal requests here.</div>}
      </DataCard>

      {selected && (
        <AdminModal
          title={`Withdrawal ${selected.referenceNo}`}
          subtitle={`${selected.studentName} • ${peso(selected.amount, true)}`}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-slate-500">Student</dt><dd>{selected.studentName} ({selected.studentId})</dd>
              <dt className="text-slate-500">Program</dt><dd>{selected.program} • {selected.yearSection}</dd>
              <dt className="text-slate-500">Amount</dt><dd className="font-mono-code font-semibold">{peso(selected.amount, true)}</dd>
              <dt className="text-slate-500">Requested</dt><dd>{formatDateTime(selected.requestedAt)}</dd>
            </dl>

            {selected.status === 'pending' ? (
              <>
                <label className="block">
                  <span className="mb-1 block font-medium text-slate-700">Remarks</span>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Required when declining"
                    className="admin-input w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => decide('declined')} disabled={saving} className={`${adminBtnSecondary} text-red-700`}>
                    <X className="h-4 w-4" /> Decline
                  </button>
                  <button onClick={() => decide('released')} disabled={saving} className={adminBtnPrimary}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />} Release Cash
                  </button>
                </div>
              </>
            ) : (
              <p className="rounded-lg border border-slate-200 p-3 text-slate-700">
                <span className="font-semibold capitalize">{selected.status}</span> by{' '}
                {selected.reviewedBy} on {formatDateTime(selected.reviewedAt)}
                {selected.reviewRemarks && <span className="block mt-1 text-slate-600">{selected.reviewRemarks}</span>}
              </p>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
};
