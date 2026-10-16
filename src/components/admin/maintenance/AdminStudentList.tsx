import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Pencil, RotateCcw, UserX } from 'lucide-react';
import { api, errorMessage } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { AdminModal, adminBtnPrimary, adminBtnSecondary, adminInput } from '../AdminModal';
import { ActiveStatus, AdminPageHeader, AdminStat, DataCard, IconAction, NewRecordButton, tbl } from '../AdminPageParts';

type Course = { id: number; code: string; name: string; active: boolean };
type RecordRow = {
  id: number;
  lrn: string;
  studentNumber: string;
  fullName: string;
  course: string;
  yearLevel: string;
  section: string;
  guardian: string;
  guardianContact: string;
  assessed: number;
  active: boolean;
};

interface StudentRecord {
  lrn: string;
  student_number: string;
  rfid: string;
  first_name: string;
  last_name: string;
  course: string;
  year_level: string;
  section: string;
  contact: string;
  email: string;
  guardian_name: string;
  guardian_contact: string;
  address: string;
}

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Grade 11', 'Grade 12'];

const EMPTY: StudentRecord = {
  lrn: '',
  student_number: '',
  rfid: '',
  first_name: '',
  last_name: '',
  course: '',
  year_level: YEAR_LEVELS[0],
  section: '',
  contact: '',
  email: '',
  guardian_name: '',
  guardian_contact: '',
  address: ''
};


const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; className?: string }> = ({ label, required, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </span>
    {children}
  </label>
);

export const AdminStudentList: React.FC = () => {
  const { user } = useAuth();
  const { loadAdminData, liveTick } = useApp();
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<StudentRecord>(EMPTY);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingForm, setLoadingForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    if (editingId === null) return;
    api<Course[]>('/api/file-maintenance/courses')
      // File maintenance lists include deactivated rows — only offer active ones
      .then((c) => setCourses(c.filter((x) => x.active)))
      .catch((err) => setFormError(errorMessage(err)));
  }, [editingId]);

  const loadRecords = useCallback(async () => {
    try {
      setRecords(await api<RecordRow[]>('/api/students/records'));
    } catch (err) {
      setPageError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords, liveTick]);

  /** Refresh this table and the shared admin data after a write. */
  const refresh = () => Promise.all([loadRecords(), loadAdminData()]);

  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      records.filter(
        (s) =>
          !q ||
          s.fullName.toLowerCase().includes(q) ||
          s.lrn.includes(q) ||
          s.studentNumber.toLowerCase().includes(q) ||
          s.course.toLowerCase().includes(q)
      ),
    [records, q]
  );
  const activeCount = records.filter((r) => r.active).length;

  const open = async (id: number | 'new') => {
    setFormError('');
    setEditingId(id);
    if (id === 'new') {
      setForm(EMPTY);
      return;
    }
    setLoadingForm(true);
    try {
      const record = await api<StudentRecord>(`/api/students/${id}/record`);
      setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, record[k as keyof StudentRecord] ?? ''])) as unknown as StudentRecord);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setLoadingForm(false);
    }
  };

  const set = <K extends keyof StudentRecord>(key: K, value: StudentRecord[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const body = { ...form, encoded_by: user?.id };
      if (editingId === 'new') await api('/api/students', { method: 'POST', body });
      else await api(`/api/students/${editingId}`, { method: 'PUT', body });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id: number, name: string) => {
    if (!confirm(`Deactivate ${name}? They will no longer be able to sign in at the kiosk.`)) return;
    setPageError('');
    try {
      await api(`/api/students/${id}`, { method: 'DELETE', body: { encoded_by: user?.id } });
      await refresh();
    } catch (err) {
      setPageError(errorMessage(err));
    }
  };

  const restore = async (id: number) => {
    setPageError('');
    try {
      await api(`/api/students/${id}/restore`, { method: 'PUT', body: { encoded_by: user?.id } });
      await refresh();
    } catch (err) {
      setPageError(errorMessage(err));
    }
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        section="File Maintenance"
        title="Student List"
        subtitle="Student information. Set fees and subjects under Assessment."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStat label="Active Students" value={String(activeCount)} />
        <AdminStat label="Total Students" value={String(records.length)} />
        <AdminStat label="Deactivated" value={String(records.length - activeCount)} />
      </div>

      {pageError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>}

      <DataCard
        title="Student List"
        actions={<NewRecordButton onClick={() => open('new')} />}
        search={{ value: query, onChange: setQuery, placeholder: 'Search students...' }}
      >
        <table className={tbl.table}>
          <thead className={tbl.head}>
            <tr>
              <th className={tbl.th}>Student No.</th>
              <th className={tbl.th}>Name</th>
              <th className={tbl.th}>LRN</th>
              <th className={tbl.th}>Course &amp; Section</th>
              <th className={tbl.th}>Guardian</th>
              <th className={tbl.th}>Status</th>
              <th className={`${tbl.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className={`${tbl.row} ${s.active ? '' : 'opacity-60'}`}>
                <td className={`${tbl.td} font-mono-code text-[13px]`}>{s.studentNumber}</td>
                <td className={`${tbl.td} font-medium text-slate-900`}>{s.fullName}</td>
                <td className={`${tbl.td} font-mono-code text-[13px]`}>{s.lrn}</td>
                <td className={tbl.td}>
                  {s.course}
                  <div className="text-xs text-slate-400">{s.yearLevel} · {s.section}</div>
                </td>
                <td className={tbl.td}>
                  {s.guardian || '—'}
                  {s.guardianContact && <div className="text-xs text-slate-400">{s.guardianContact}</div>}
                </td>
                <td className={tbl.td}>
                  <ActiveStatus active={s.active} />
                </td>
                <td className={tbl.td}>
                  <div className="flex items-center justify-end gap-1">
                    {s.active ? (
                      <>
                        <IconAction icon={Pencil} label="Edit student" onClick={() => open(s.id)} />
                        <IconAction icon={UserX} label="Deactivate student" tone="danger" onClick={() => deactivate(s.id, s.fullName)} />
                      </>
                    ) : (
                      <IconAction icon={RotateCcw} label="Restore student" tone="primary" onClick={() => restore(s.id)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className={tbl.empty}>No students found.</div>}
      </DataCard>

      {editingId !== null && (
        <AdminModal
          title={editingId === 'new' ? 'Add student' : `Edit ${form.first_name} ${form.last_name}`}
          onClose={() => setEditingId(null)}
          wide
        >
          {loadingForm ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5 text-sm">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="First name" required>
                    <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className={adminInput} />
                  </Field>
                  <Field label="Last name" required>
                    <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className={adminInput} />
                  </Field>
                  <Field label="LRN" required>
                    <input value={form.lrn} onChange={(e) => set('lrn', e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={`${adminInput} font-mono-code`} placeholder="12 digits" />
                  </Field>
                  <Field label="Student number" required>
                    <input value={form.student_number} onChange={(e) => set('student_number', e.target.value)} className={`${adminInput} font-mono-code`} placeholder="SNC-2025-0001" />
                  </Field>
                  <Field label="ID card (RFID)">
                    <input value={form.rfid} onChange={(e) => set('rfid', e.target.value)} className={`${adminInput} font-mono-code`} placeholder="Tap or type card number (optional)" />
                  </Field>
                  <Field label="Course" required>
                    <select value={form.course} onChange={(e) => set('course', e.target.value)} className={adminInput}>
                      <option value="">Select a course…</option>
                      {form.course && !courses.some((c) => c.name === form.course) && <option value={form.course}>{form.course}</option>}
                      {courses.map((c) => (
                        <option key={c.id} value={c.name}>{c.code} — {c.name}</option>
                      ))}
                    </select>
                    <span className="mt-1 block text-xs text-slate-400">The course's subjects are enrolled automatically. Fees are set in Assessment.</span>
                  </Field>
                  <Field label="Year level" required>
                    <select value={form.year_level} onChange={(e) => set('year_level', e.target.value)} className={adminInput}>
                      {!YEAR_LEVELS.includes(form.year_level) && <option value={form.year_level}>{form.year_level}</option>}
                      {YEAR_LEVELS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Section" required>
                    <input value={form.section} onChange={(e) => set('section', e.target.value)} className={adminInput} placeholder="BSIT 1-A" />
                  </Field>
                  <Field label="Contact number">
                    <input value={form.contact} onChange={(e) => set('contact', e.target.value)} className={adminInput} />
                  </Field>
                  <Field label="Email">
                    <input value={form.email} onChange={(e) => set('email', e.target.value)} className={adminInput} />
                  </Field>
                  <Field label="Parent / guardian">
                    <input value={form.guardian_name} onChange={(e) => set('guardian_name', e.target.value)} className={adminInput} />
                  </Field>
                  <Field label="Guardian contact">
                    <input value={form.guardian_contact} onChange={(e) => set('guardian_contact', e.target.value)} className={adminInput} />
                  </Field>
                  <Field label="Address" className="sm:col-span-2">
                    <input value={form.address} onChange={(e) => set('address', e.target.value)} className={adminInput} />
                  </Field>
                </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setEditingId(null)} className={adminBtnSecondary}>Cancel</button>
                <button type="submit" disabled={saving} className={adminBtnPrimary}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save student
                </button>
              </div>
            </form>
          )}
        </AdminModal>
      )}
    </div>
  );
};
