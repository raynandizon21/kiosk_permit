import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Pencil, RotateCcw, UserX } from 'lucide-react';
import { api, errorMessage } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { AdminModal, adminBtnPrimary, adminBtnSecondary, adminInput } from '../AdminModal';
import { ActiveStatus, AdminPageHeader, AdminStat, DataCard, IconAction, NewRecordButton, tbl } from '../AdminPageParts';

export type MaintenanceType = 'courses' | 'subjects' | 'periods' | 'users';

export type Row = { id: number; active: boolean } & Record<string, string | number | boolean | null>;

export type FieldOption = string | { value: string; label: string };

const optValue = (o: FieldOption) => (typeof o === 'string' ? o : o.value);
const optLabel = (o: FieldOption) => (typeof o === 'string' ? o : o.label);

export interface Field {
  key: string;
  label: string;
  /** 'checkboxes' = multi-select; the value is a comma-separated list of option values. */
  type?: 'text' | 'number' | 'select' | 'password' | 'checkboxes';
  options?: FieldOption[];
  /** Custom table cell text (e.g. show a course code instead of its id). */
  display?: (row: Row) => string;
  required?: boolean;
  placeholder?: string;
  /** Show this field as a table column (default true, except passwords). */
  column?: boolean;
  mono?: boolean;
  help?: string;
}

interface MaintenancePanelProps {
  type: MaintenanceType;
  title: string;
  subtitle: string;
  /** Singular, e.g. "course". */
  noun: string;
  /** Plural for labels, e.g. "Courses". */
  plural: string;
  fields: Field[];
  /** Extra cell content before Status (e.g. "Current" badge). */
  renderExtra?: (row: Row) => React.ReactNode;
  extraHeader?: string;
  /** Extra row buttons (e.g. "Set as current"). */
  rowActions?: (row: Row, run: (request: () => Promise<unknown>) => Promise<void>) => React.ReactNode;
}

/** Generic file-maintenance screen: stats, list card, add/edit modal, deactivate/restore. */
export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({
  type,
  title,
  subtitle,
  noun,
  plural,
  fields,
  renderExtra,
  extraHeader,
  rowActions
}) => {
  const { user } = useAuth();
  const { loadAdminData, liveTick } = useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api<Row[]>(`/api/file-maintenance/${type}`));
    } catch (err) {
      setPageError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load, liveTick]);

  /** Runs a write, then refreshes this table and the shared admin data. */
  const run = async (request: () => Promise<unknown>) => {
    setPageError('');
    try {
      await request();
      await Promise.all([load(), loadAdminData()]);
    } catch (err) {
      setPageError(errorMessage(err));
    }
  };

  const columns = fields.filter((f) => f.column ?? f.type !== 'password');
  const activeCount = rows.filter((r) => r.active).length;

  const cellText = (row: Row, c: Field) => (c.display ? c.display(row) : String(row[c.key] ?? '—'));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => columns.some((c) => cellText(r, c).toLowerCase().includes(q)));
  }, [rows, query, columns]);

  const openForm = (row: Row | 'new') => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const first = f.options?.[0];
      next[f.key] =
        row === 'new' ? (f.type === 'select' && first !== undefined ? optValue(first) : '') : f.type === 'password' ? '' : String(row[f.key] ?? '');
    }
    setForm(next);
    setFormError('');
    setEditing(row);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFormError('');
    try {
      const body = { ...form, encoded_by: user?.id };
      if (editing === 'new') await api(`/api/file-maintenance/${type}`, { method: 'POST', body });
      else await api(`/api/file-maintenance/${type}/${editing.id}`, { method: 'PUT', body });
      setEditing(null);
      await Promise.all([load(), loadAdminData()]);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const name = (row: Row) => String(row[columns[0].key] ?? '');

  const deactivate = (row: Row) => {
    if (!confirm(`Deactivate ${noun} "${name(row)}"? You can restore it later.`)) return;
    run(() => api(`/api/file-maintenance/${type}/${row.id}`, { method: 'DELETE', body: { encoded_by: user?.id } }));
  };

  const restore = (row: Row) =>
    run(() => api(`/api/file-maintenance/${type}/${row.id}/restore`, { method: 'PUT', body: { encoded_by: user?.id } }));

  return (
    <div className="admin-page">
      <AdminPageHeader section="File Maintenance" title={title} subtitle={subtitle} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStat label={`Active ${plural}`} value={String(activeCount)} />
        <AdminStat label={`Total ${plural}`} value={String(rows.length)} />
        <AdminStat label="Deactivated" value={String(rows.length - activeCount)} />
      </div>

      {pageError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {pageError}
        </div>
      )}

      <DataCard
        title={`${title} List`}
        actions={<NewRecordButton onClick={() => openForm('new')} />}
        search={{ value: query, onChange: setQuery, placeholder: `Search ${plural.toLowerCase()}...` }}
      >
        <table className={tbl.table}>
          <thead className={tbl.head}>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={tbl.th}>{c.label}</th>
              ))}
              {extraHeader !== undefined && <th className={tbl.th}>{extraHeader}</th>}
              <th className={tbl.th}>Status</th>
              <th className={`${tbl.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className={`${tbl.row} ${row.active ? '' : 'opacity-60'}`}>
                {columns.map((c, i) => (
                  <td key={c.key} className={`${tbl.td} ${i === 0 ? 'font-medium text-slate-900' : ''} ${c.mono ? 'font-mono-code text-[13px]' : ''}`}>
                    {cellText(row, c)}
                  </td>
                ))}
                {extraHeader !== undefined && <td className={tbl.td}>{renderExtra?.(row)}</td>}
                <td className={tbl.td}>
                  <ActiveStatus active={row.active} />
                </td>
                <td className={tbl.td}>
                  <div className="flex items-center justify-end gap-1">
                    {row.active && rowActions?.(row, run)}
                    <IconAction icon={Pencil} label={`Edit ${noun}`} onClick={() => openForm(row)} />
                    {row.active ? (
                      <IconAction icon={UserX} label={`Deactivate ${noun}`} tone="danger" onClick={() => deactivate(row)} />
                    ) : (
                      <IconAction icon={RotateCcw} label={`Restore ${noun}`} tone="primary" onClick={() => restore(row)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && rows.length === 0 && (
          <div className="flex justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        )}
        {!loading && filtered.length === 0 && <div className={tbl.empty}>No {plural.toLowerCase()} found.</div>}
      </DataCard>

      {editing && (
        <AdminModal title={editing === 'new' ? `New ${noun}` : `Edit ${noun}`} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="space-y-4 text-sm">
            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
              </div>
            )}
            {fields.map((f) =>
              f.type === 'checkboxes' ? (
                <fieldset key={f.key}>
                  <legend className="mb-1 font-medium text-slate-700">{f.label}</legend>
                  <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-slate-200 p-2">
                    {f.options?.map((o) => {
                      const value = optValue(o);
                      const selected = form[f.key] ? form[f.key].split(',') : [];
                      const checked = selected.includes(value);
                      return (
                        <label
                          key={value}
                          className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 cursor-pointer ${checked ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-slate-50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setForm({
                                ...form,
                                [f.key]: (checked ? selected.filter((v) => v !== value) : [...selected, value]).join(',')
                              })
                            }
                            className="h-4 w-4 accent-[#004d00]"
                          />
                          {optLabel(o)}
                        </label>
                      );
                    })}
                  </div>
                  {f.help && <span className="mt-1 block text-xs text-slate-400">{f.help}</span>}
                </fieldset>
              ) : (
              <label key={f.key} className="block">
                <span className="mb-1 block font-medium text-slate-700">
                  {f.label}
                  {f.required && (f.type !== 'password' || editing === 'new') && <span className="text-red-500"> *</span>}
                </span>
                {f.type === 'select' ? (
                  <select value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={adminInput}>
                    {f.options?.map((o) => (
                      <option key={optValue(o)} value={optValue(o)}>{optLabel(o)}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : f.type === 'password' ? 'password' : 'text'}
                    step={f.type === 'number' ? '0.5' : undefined}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.type === 'password' && editing !== 'new' ? 'Leave blank to keep current password' : f.placeholder}
                    autoComplete={f.type === 'password' ? 'new-password' : 'off'}
                    className={`${adminInput} ${f.mono ? 'font-mono-code' : ''}`}
                  />
                )}
                {f.help && <span className="mt-1 block text-xs text-slate-400">{f.help}</span>}
              </label>
              )
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(null)} className={adminBtnSecondary}>Cancel</button>
              <button type="submit" disabled={saving} className={adminBtnPrimary}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
};
