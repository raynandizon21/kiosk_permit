import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Pencil, Plus, X } from 'lucide-react';
import { api, errorMessage } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { peso } from '../../../utils/format';
import { AdminModal, adminBtnPrimary, adminBtnSecondary, adminInput } from '../AdminModal';
import { AdminPageHeader, AdminStat, DataCard, FilterTabs, IconAction, StatusPill, tbl } from '../AdminPageParts';

type Course = { id: number; code: string; name: string; active: boolean };
type Subject = { id: number; code: string; description: string; units: number; course_ids: string | null; active: boolean };

/** Course ids a subject belongs to; empty = general subject for all courses. */
const courseIdsOf = (x: Subject) => (x.course_ids ? x.course_ids.split(',').map(Number) : []);
type Row = {
  id: number;
  studentNumber: string;
  fullName: string;
  course: string;
  yearLevel: string;
  section: string;
  assessed: number;
  subjects: number;
  units: number;
  active: boolean;
};

interface AssessmentForm {
  first_name: string;
  last_name: string;
  course: string;
  assessment: { tuition_fee: number; lab_fee: number; misc_fee: number; previous_balance: number };
  items: { name: string; amount: number; type: 'fee' | 'discount' }[];
  subjects: { subject_id: number; instructor: string; schedule: string }[];
}

type Tab = 'fees' | 'subjects';
type Filter = 'all' | 'pending' | 'done';

const FEE_FIELDS = [
  ['tuition_fee', 'Tuition fee'],
  ['lab_fee', 'Laboratory fee'],
  ['misc_fee', 'Miscellaneous fee'],
  ['previous_balance', 'Previous balance']
] as const;

/** Per-student fees and enrolled subjects for the current semester. */
export const AdminAssessments: React.FC = () => {
  const { user } = useAuth();
  const { period, loadAdminData, liveTick } = useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<AssessmentForm | null>(null);
  const [tab, setTab] = useState<Tab>('fees');
  const [showOther, setShowOther] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');

  const load = useCallback(async () => {
    try {
      const all = await api<Row[]>('/api/students/records');
      setRows(all.filter((r) => r.active));
    } catch (err) {
      setPageError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, liveTick]);

  useEffect(() => {
    Promise.all([api<Course[]>('/api/file-maintenance/courses'), api<Subject[]>('/api/file-maintenance/subjects')])
      .then(([c, s]) => {
        setCourses(c.filter((x) => x.active));
        setSubjects(s.filter((x) => x.active));
      })
      .catch((err) => setPageError(errorMessage(err)));
  }, [liveTick]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filter === 'all' || (filter === 'pending' ? r.assessed <= 0 : r.assessed > 0)) &&
          (!q || r.fullName.toLowerCase().includes(q) || r.studentNumber.toLowerCase().includes(q) || r.course.toLowerCase().includes(q))
      ),
    [rows, q, filter]
  );
  const assessedCount = rows.filter((r) => r.assessed > 0).length;
  const totalAssessed = rows.reduce((sum, r) => sum + r.assessed, 0);

  const open = async (row: Row) => {
    setEditing(row);
    setForm(null);
    setTab('fees');
    setShowOther(false);
    setFormError('');
    try {
      setForm(await api<AssessmentForm>(`/api/students/${row.id}/record`));
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const update = (patch: Partial<AssessmentForm>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing || !form) return;
    setSaving(true);
    setFormError('');
    try {
      await api(`/api/students/${editing.id}/assessment`, {
        method: 'PUT',
        body: { assessment: form.assessment, items: form.items, subjects: form.subjects, encoded_by: user?.id }
      });
      setEditing(null);
      await Promise.all([load(), loadAdminData()]);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ---- derived form values ----
  const a = form?.assessment;
  const items = form?.items ?? [];
  const enrolled = new Set((form?.subjects ?? []).map((x) => x.subject_id));
  const total = a
    ? a.tuition_fee + a.lab_fee + a.misc_fee + a.previous_balance +
      items.reduce((sum, i) => sum + (i.type === 'discount' ? -1 : 1) * (Number(i.amount) || 0), 0)
    : 0;
  const course = courses.find((c) => c.name === form?.course) ?? null;
  const units = subjects.filter((x) => enrolled.has(x.id)).reduce((sum, x) => sum + Number(x.units), 0);
  const isOther = (x: Subject) => {
    const ids = courseIdsOf(x);
    return ids.length > 0 && !(course && ids.includes(course.id));
  };
  const groups = [
    { title: course ? `${course.code} subjects` : 'Course subjects', items: subjects.filter((x) => course && courseIdsOf(x).includes(course.id)) },
    { title: 'General subjects (all courses)', items: subjects.filter((x) => courseIdsOf(x).length === 0) },
    {
      title: 'Other courses',
      items: subjects.filter((x) => isOther(x) && (showOther || enrolled.has(x.id)))
    }
  ];
  const otherCount = subjects.filter(isOther).length;

  const toggleSubject = (id: number) =>
    form &&
    update({
      subjects: enrolled.has(id)
        ? form.subjects.filter((x) => x.subject_id !== id)
        : [...form.subjects, { subject_id: id, instructor: '', schedule: '' }]
    });

  const setSubjectField = (id: number, key: 'instructor' | 'schedule', value: string) =>
    form && update({ subjects: form.subjects.map((x) => (x.subject_id === id ? { ...x, [key]: value } : x)) });

  return (
    <div className="admin-page">
      <AdminPageHeader
        section="File Maintenance"
        title="Assessment"
        subtitle={`Fees and enrolled subjects per student${period ? ` for ${period.academicYear} ${period.semester}` : ''}.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStat label="Students" value={String(rows.length)} active={filter === 'all'} onClick={() => setFilter('all')} />
        <AdminStat label="Assessed" value={String(assessedCount)} active={filter === 'done'} onClick={() => setFilter('done')} />
        <AdminStat label="Not Yet Assessed" value={String(rows.length - assessedCount)} active={filter === 'pending'} onClick={() => setFilter('pending')} />
        <AdminStat label="Total Assessment" value={peso(totalAssessed)} />
      </div>

      {pageError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>}

      <DataCard
        title="Assessment List"
        search={{ value: query, onChange: setQuery, placeholder: 'Search students...' }}
        toolbar={
          <FilterTabs<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'done', label: 'Assessed' },
              { value: 'pending', label: 'Not yet assessed' }
            ]}
          />
        }
      >
        <table className={tbl.table}>
          <thead className={tbl.head}>
            <tr>
              <th className={tbl.th}>Student No.</th>
              <th className={tbl.th}>Name</th>
              <th className={tbl.th}>Course &amp; Section</th>
              <th className={`${tbl.th} text-right`}>Subjects</th>
              <th className={`${tbl.th} text-right`}>Total Assessment</th>
              <th className={tbl.th}>Status</th>
              <th className={`${tbl.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={tbl.row}>
                <td className={`${tbl.td} font-mono-code text-[13px]`}>{r.studentNumber}</td>
                <td className={`${tbl.td} font-medium text-slate-900`}>{r.fullName}</td>
                <td className={tbl.td}>
                  {r.course}
                  <div className="text-xs text-slate-400">{r.yearLevel} · {r.section}</div>
                </td>
                <td className={`${tbl.td} text-right`}>
                  {r.subjects} <span className="text-xs text-slate-400">({r.units} units)</span>
                </td>
                <td className={`${tbl.td} text-right font-mono-code text-[13px]`}>{peso(r.assessed)}</td>
                <td className={tbl.td}>
                  {r.assessed > 0 ? <StatusPill tone="green">Assessed</StatusPill> : <StatusPill tone="amber">Not yet assessed</StatusPill>}
                </td>
                <td className={tbl.td}>
                  <div className="flex justify-end">
                    <IconAction icon={Pencil} label="Edit assessment" onClick={() => open(r)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className={tbl.empty}>No students found.</div>}
      </DataCard>

      {editing && (
        <AdminModal
          title={`Assessment — ${editing.fullName}`}
          subtitle={`${editing.studentNumber} · ${editing.course}${period ? ` · ${period.academicYear} ${period.semester}` : ''}`}
          onClose={() => setEditing(null)}
          wide
        >
          {!form || !a ? (
            formError ? (
              <p className="text-sm text-red-600">{formError}</p>
            ) : (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              </div>
            )
          ) : (
            <form onSubmit={submit} className="space-y-5 text-sm">
              <div className="flex rounded-xl bg-slate-100 p-1">
                {(
                  [
                    ['fees', 'Fees'],
                    ['subjects', `Subjects (${form.subjects.length})`]
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer ${tab === key ? 'bg-white text-snc-green shadow-sm' : 'text-slate-500'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
                </div>
              )}

              {tab === 'fees' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {FEE_FIELDS.map(([key, label]) => (
                      <label key={key} className="block">
                        <span className="mb-1 block font-medium text-slate-700">{label} (₱)</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={a[key] || ''}
                          onChange={(e) => update({ assessment: { ...a, [key]: Number(e.target.value) } })}
                          className={`${adminInput} font-mono-code`}
                        />
                      </label>
                    ))}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-slate-700">Other fees &amp; discounts</span>
                      <button
                        type="button"
                        onClick={() => update({ items: [...items, { name: '', amount: 0, type: 'fee' }] })}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-snc-green-mid cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add line
                      </button>
                    </div>
                    {items.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-400">None. e.g. ID fee, insurance, or a scholarship discount.</p>}
                    <div className="space-y-2">
                      {items.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <select
                            value={item.type}
                            onChange={(e) => update({ items: items.map((x, j) => (j === i ? { ...x, type: e.target.value as 'fee' | 'discount' } : x)) })}
                            className={`${adminInput} !w-32`}
                          >
                            <option value="fee">Fee</option>
                            <option value="discount">Discount</option>
                          </select>
                          <input
                            value={item.name}
                            onChange={(e) => update({ items: items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                            placeholder="Description"
                            className={`${adminInput} flex-1`}
                          />
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.amount || ''}
                            onChange={(e) => update({ items: items.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)) })}
                            placeholder="₱"
                            className={`${adminInput} !w-32 font-mono-code`}
                          />
                          <button
                            type="button"
                            onClick={() => update({ items: items.filter((_, j) => j !== i) })}
                            aria-label="Remove line"
                            className="rounded-lg px-2 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-snc-green px-4 py-3 text-white">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total assessment</span>
                    <span className="font-mono-code text-lg font-bold">{peso(total, true)}</span>
                  </div>
                </div>
              )}

              {tab === 'subjects' && (
                <div className="space-y-5">
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-900">
                    <strong>{form.subjects.length}</strong> subject{form.subjects.length === 1 ? '' : 's'} ·{' '}
                    <strong>{units}</strong> units
                  </div>
                  {groups.map((g) =>
                    g.items.length === 0 ? null : (
                      <div key={g.title}>
                        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{g.title}</h4>
                        <div className="space-y-2">
                          {g.items.map((sub) => {
                            const on = enrolled.has(sub.id);
                            const entry = form.subjects.find((x) => x.subject_id === sub.id);
                            return (
                              <div key={sub.id} className={`rounded-xl border p-3 ${on ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200'}`}>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={on} onChange={() => toggleSubject(sub.id)} className="h-4 w-4 accent-[#004d00]" />
                                  <span className="font-mono-code text-xs font-bold text-slate-700">{sub.code}</span>
                                  <span className="flex-1 text-slate-800">{sub.description}</span>
                                  <span className="text-xs text-slate-400">{sub.units} units</span>
                                </label>
                                {on && entry && (
                                  <div className="mt-2 grid grid-cols-2 gap-2 pl-7">
                                    <input
                                      value={entry.instructor ?? ''}
                                      onChange={(e) => setSubjectField(sub.id, 'instructor', e.target.value)}
                                      placeholder="Instructor (optional)"
                                      className={adminInput}
                                    />
                                    <input
                                      value={entry.schedule ?? ''}
                                      onChange={(e) => setSubjectField(sub.id, 'schedule', e.target.value)}
                                      placeholder="Schedule (optional)"
                                      className={adminInput}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                  {otherCount > 0 && (
                    <button type="button" onClick={() => setShowOther((v) => !v)} className="text-xs font-semibold text-snc-green-mid hover:underline cursor-pointer">
                      {showOther ? 'Hide' : 'Show'} subjects from other courses ({otherCount})
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setEditing(null)} className={adminBtnSecondary}>Cancel</button>
                <button type="submit" disabled={saving} className={adminBtnPrimary}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save assessment
                </button>
              </div>
            </form>
          )}
        </AdminModal>
      )}
    </div>
  );
};
