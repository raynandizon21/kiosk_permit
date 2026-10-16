import React, { useState } from 'react';
import { Check, ClipboardCheck, Eye, Loader2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PromissoryNote } from '../../types';
import { formatDate, formatDateTime, peso } from '../../utils/format';
import { AdminModal, adminBtnPrimary, adminBtnSecondary } from './AdminModal';
import { AdminPageHeader, AdminStat, DataCard, FilterTabs, IconAction, PillTone, StatusPill, tbl } from './AdminPageParts';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const STATUS_UI: Record<PromissoryNote['status'], { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Declined', tone: 'red' }
};

export const AdminPromissoryWorkbench: React.FC = () => {
  const { promissoryNotes, reviewPromissoryNote } = useApp();
  const [filter, setFilter] = useState<Filter>('pending');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PromissoryNote | null>(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const q = query.trim().toLowerCase();
  const rows = promissoryNotes.filter(
    (n) =>
      (filter === 'all' || n.status === filter) &&
      (!q ||
        n.studentName.toLowerCase().includes(q) ||
        n.studentLrn.includes(q) ||
        (n.referenceNo ?? '').toLowerCase().includes(q))
  );

  const decide = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    if (status === 'rejected' && !remarks.trim()) {
      setError('Please give the reason for declining.');
      return;
    }
    setSaving(true);
    const err = await reviewPromissoryNote(selected.id, status, remarks.trim());
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      setSelected(null);
      setRemarks('');
      setError('');
    }
  };

  const count = (status: PromissoryNote['status']) => promissoryNotes.filter((n) => n.status === status).length;

  return (
    <div className="admin-page">
      <AdminPageHeader
        section="Accounts"
        title="Promissory Notes"
        subtitle="Requests submitted at the kiosk. Approving one clears that exam permit."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStat label="Pending Review" value={String(count('pending'))} active={filter === 'pending'} onClick={() => setFilter('pending')} />
        <AdminStat label="Approved" value={String(count('approved'))} active={filter === 'approved'} onClick={() => setFilter('approved')} />
        <AdminStat label="Declined" value={String(count('rejected'))} active={filter === 'rejected'} onClick={() => setFilter('rejected')} />
        <AdminStat label="Total Requests" value={String(promissoryNotes.length)} active={filter === 'all'} onClick={() => setFilter('all')} />
      </div>

      <DataCard
        title="Promissory Notes List"
        search={{ value: query, onChange: setQuery, placeholder: 'Search promissory notes...' }}
        toolbar={
          <FilterTabs
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Declined' },
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
              <th className={tbl.th}>Exam</th>
              <th className={`${tbl.th} text-right`}>Balance</th>
              <th className={`${tbl.th} text-right`}>Promised</th>
              <th className={tbl.th}>Pay On</th>
              <th className={tbl.th}>Status</th>
              <th className={`${tbl.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => {
              const ui = STATUS_UI[n.status];
              return (
                <tr key={n.id} className={tbl.row}>
                  <td className={`${tbl.td} font-mono-code text-[13px]`}>{n.referenceNo}</td>
                  <td className={tbl.td}>
                    <div className="font-medium text-slate-900">{n.studentName}</div>
                    <div className="text-xs text-slate-400">{n.program}</div>
                  </td>
                  <td className={tbl.td}>{n.term}</td>
                  <td className={`${tbl.td} text-right font-mono-code text-[13px]`}>{peso(n.balanceAmount)}</td>
                  <td className={`${tbl.td} text-right font-mono-code text-[13px] font-semibold text-slate-900`}>{peso(n.committedAmount)}</td>
                  <td className={tbl.td}>{formatDate(n.committedPaymentDate)}</td>
                  <td className={tbl.td}>
                    <StatusPill tone={ui.tone}>{ui.label}</StatusPill>
                  </td>
                  <td className={tbl.td}>
                    <div className="flex items-center justify-end gap-1">
                      <IconAction
                        icon={n.status === 'pending' ? ClipboardCheck : Eye}
                        label={n.status === 'pending' ? 'Review request' : 'View request'}
                        tone={n.status === 'pending' ? 'primary' : 'default'}
                        onClick={() => {
                          setSelected(n);
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
        {rows.length === 0 && <div className={tbl.empty}>No promissory notes here.</div>}
      </DataCard>

      {selected && (
        <AdminModal
          title={`Promissory Note ${selected.referenceNo}`}
          subtitle={`${selected.studentName} • ${selected.term} exam`}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-slate-500">Student</dt><dd>{selected.studentName} ({selected.studentId})</dd>
              <dt className="text-slate-500">Balance</dt><dd className="font-mono-code">{peso(selected.balanceAmount, true)}</dd>
              <dt className="text-slate-500">Promised</dt><dd className="font-mono-code font-semibold">{peso(selected.committedAmount, true)} on {formatDate(selected.committedPaymentDate)}</dd>
              <dt className="text-slate-500">Reason</dt><dd>{selected.reasonCategory}</dd>
              <dt className="text-slate-500">Guardian</dt><dd>{selected.parentGuardian} • {selected.parentContact}</dd>
              <dt className="text-slate-500">Submitted</dt><dd>{formatDateTime(selected.submittedAt)}</dd>
            </dl>
            {selected.reasonDetails && <p className="rounded-lg bg-slate-50 p-3 italic text-slate-700">“{selected.reasonDetails}”</p>}
            {selected.signatureDataUrl && (
              <div>
                <div className="mb-1 text-xs text-slate-500">Signature</div>
                <img src={selected.signatureDataUrl} alt="Student signature" className="h-20 rounded-lg border border-slate-200 bg-white object-contain p-1" />
              </div>
            )}

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
                  <button onClick={() => decide('rejected')} disabled={saving} className={`${adminBtnSecondary} text-red-700`}>
                    <X className="h-4 w-4" /> Decline
                  </button>
                  <button onClick={() => decide('approved')} disabled={saving} className={adminBtnPrimary}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve &amp; Clear Permit
                  </button>
                </div>
              </>
            ) : (
              <p className="rounded-lg border border-slate-200 p-3 text-slate-700">
                <span className="font-semibold capitalize">{selected.status === 'rejected' ? 'Declined' : 'Approved'}</span> by{' '}
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
