import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Home, Plus, Search } from 'lucide-react';

/** Breadcrumb + title + subtitle, shared by every admin data page. */
export const AdminPageHeader: React.FC<{
  section: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}> = ({ section, title, subtitle, children }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-sm text-slate-500">
        <Link to="/admin" aria-label="Dashboard" className="hover:text-snc-green">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium text-slate-700">{section}</span>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
);

/** Summary number card: small uppercase label + big value. Becomes a filter when onClick is given. */
export const AdminStat: React.FC<{
  label: string;
  value: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ label, value, active, onClick }) => {
  const body = (
    <>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className="mt-1.5 block text-2xl font-semibold tabular-nums text-slate-900">{value}</span>
    </>
  );
  const cls = `rounded-2xl bg-white p-5 text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 transition ${
    active ? 'ring-2 ring-snc-green-mid' : 'ring-slate-200/70'
  }`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} hover:ring-slate-300 cursor-pointer`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
};

/** White card that holds a data table: "X List" title, actions on the right, pill search under the title. */
export const DataCard: React.FC<{
  title: string;
  search?: { value: string; onChange: (v: string) => void; placeholder: string };
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, search, actions, toolbar, children }) => (
  <section className="flex min-h-0 flex-1 flex-col rounded-3xl bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {(search || toolbar) && (
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {search && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder}
              className="h-10 w-full rounded-full border-0 bg-slate-100 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-snc-green-mid/30"
            />
          </div>
        )}
        {toolbar}
      </div>
    )}
    <div className="mt-4 min-h-0 flex-1 overflow-auto">{children}</div>
  </section>
);

/** Dark "+ New Record" style button for the DataCard header. */
export const NewRecordButton: React.FC<{ label?: string; onClick: () => void; icon?: LucideIcon }> = ({
  label = 'New Record',
  onClick,
  icon: Icon = Plus
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 rounded-lg bg-snc-green-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-snc-green cursor-pointer"
  >
    <Icon className="h-4 w-4" /> {label}
  </button>
);

/** Segmented filter shown in the DataCard toolbar. */
export function FilterTabs<T extends string>({
  value,
  onChange,
  options
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-full bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            value === o.value ? 'bg-white text-snc-green shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Table class names — keep every data table identical. */
export const tbl = {
  table: 'w-full text-left text-sm',
  head: 'sticky top-0 z-10 bg-white',
  th: 'border-b border-slate-200 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500',
  row: 'border-b border-slate-100 transition-colors hover:bg-slate-50/80',
  td: 'px-3 py-3.5 text-slate-700',
  empty: 'py-14 text-center text-sm text-slate-400'
};

const PILL_TONES = {
  green: 'bg-emerald-50 text-emerald-600',
  gray: 'bg-slate-100 text-slate-500',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600'
};

export type PillTone = keyof typeof PILL_TONES;

/** Small rounded status label (Active / Inactive / Pending …). */
export const StatusPill: React.FC<{ tone: PillTone; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${PILL_TONES[tone]}`}>
    {children}
  </span>
);

export const ActiveStatus: React.FC<{ active: boolean }> = ({ active }) => (
  <StatusPill tone={active ? 'green' : 'gray'}>{active ? 'Active' : 'Inactive'}</StatusPill>
);

/** Icon-only row action (edit, deactivate, restore …). */
export const IconAction: React.FC<{
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger' | 'primary';
}> = ({ icon: Icon, label, onClick, tone = 'default' }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
      tone === 'danger'
        ? 'text-slate-500 hover:bg-red-50 hover:text-red-600'
        : tone === 'primary'
          ? 'text-snc-green-mid hover:bg-emerald-50'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon className="h-4 w-4" />
  </button>
);
