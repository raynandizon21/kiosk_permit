import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { ALL_EXAM_TERMS } from '../../../context/AppContext';
import { MaintenancePanel, Row } from './MaintenancePanel';
import { StatusPill } from '../AdminPageParts';
import { formatDate } from '../../../utils/format';

export const AdminCourses: React.FC = () => (
  <MaintenancePanel
    type="courses"
    title="Courses"
    subtitle="Programs students can be enrolled in."
    noun="course"
    plural="Courses"
    fields={[
      { key: 'code', label: 'Code', required: true, placeholder: 'BSIT', mono: true },
      { key: 'name', label: 'Course name', required: true, placeholder: 'BS Information Technology' },
      { key: 'department', label: 'Description', placeholder: 'College of Computer Studies' }
    ]}
  />
);

type CourseOption = { id: number; code: string; name: string; active: boolean };

export const AdminSubjects: React.FC = () => {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  useEffect(() => {
    api<CourseOption[]>('/api/file-maintenance/courses')
      .then((rows) => setCourses(rows.filter((c) => c.active)))
      .catch(() => setCourses([]));
  }, []);

  return (
    <MaintenancePanel
      type="subjects"
      title="Subjects"
      subtitle="Subjects that appear on the examination permit. Link each to its courses so it is auto-enrolled for those students."
      noun="subject"
      plural="Subjects"
      fields={[
        { key: 'code', label: 'Code', required: true, placeholder: 'IT-311', mono: true },
        { key: 'description', label: 'Description', required: true, placeholder: 'Web Systems and Technologies' },
        { key: 'units', label: 'Units', type: 'number', required: true, placeholder: '3' },
        {
          key: 'course_ids',
          label: 'Courses',
          type: 'checkboxes',
          options: courses.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.name}` })),
          display: (row) => (row.course_codes ? String(row.course_codes) : 'All courses'),
          help: 'Check every course that takes this subject. Leave all unchecked for general subjects like GE (all courses).'
        }
      ]}
    />
  );
};

const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer'];

export const AdminPeriods: React.FC = () => {
  const { user } = useAuth();
  return (
    <MaintenancePanel
      type="periods"
      title="School Year & Semester"
      subtitle="The current one is what the kiosk and SOA use."
      noun="school year"
      plural="School Years"
      fields={[
        { key: 'academic_year', label: 'School year', required: true, placeholder: '2025-2026', mono: true },
        { key: 'semester', label: 'Semester', type: 'select', options: SEMESTERS, required: true },
        { key: 'active_term', label: 'Exam term', type: 'select', options: ALL_EXAM_TERMS, required: true },
        {
          key: 'start_date',
          label: 'From',
          type: 'date',
          display: (row: Row) => (row.start_date ? formatDate(String(row.start_date)) : '—')
        },
        {
          key: 'end_date',
          label: 'To',
          type: 'date',
          display: (row: Row) => (row.end_date ? formatDate(String(row.end_date)) : '—')
        }
      ]}
      extraHeader="Period"
      renderExtra={(row) =>
        row.is_current ? (
          <StatusPill tone="blue">
            <CheckCircle2 className="h-3 w-3" /> Current
          </StatusPill>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      }
      rowActions={(row, run) =>
        !row.is_current && (
          <button
            onClick={() => {
              if (confirm(`Make ${row.academic_year} ${row.semester} the current school year? The kiosk will switch to it.`)) {
                run(() => api(`/api/file-maintenance/periods/${row.id}/current`, { method: 'PUT', body: { encoded_by: user?.id } }));
              }
            }}
            className="mr-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-snc-green-mid hover:bg-emerald-50 cursor-pointer"
          >
            Set as current
          </button>
        )
      }
    />
  );
};

export const AdminUsers: React.FC = () => (
  <MaintenancePanel
    type="users"
    title="Admin Users"
    subtitle="Accounting and registrar staff who can sign in to this portal."
    noun="user"
    plural="Users"
    fields={[
      { key: 'first_name', label: 'First name', required: true },
      { key: 'last_name', label: 'Last name', required: true },
      { key: 'position', label: 'Position', placeholder: 'Cashier' },
      { key: 'username', label: 'Username', required: true, mono: true },
      { key: 'password', label: 'Password', type: 'password', required: true, help: 'At least 6 characters.' }
    ]}
  />
);
