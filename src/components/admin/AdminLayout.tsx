import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  Calculator,
  CreditCard,
  FileSignature,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Monitor,
  ShieldCheck,
  UserCog,
  Users
} from 'lucide-react';
import { StudentAvatar } from '../common/StudentAvatar';
import { useAuth } from '../../context/AuthContext';
import { useApp, ALL_EXAM_TERMS } from '../../context/AppContext';
import { ExamTerm, Student } from '../../types';
import SystemStatusBadge from '../common/SystemStatusBadge';
import { SCHOOL_LOGO } from '../common/CollegeSeal';
import { AdminCashierModal } from './AdminCashierModal';
import { LiveToasts, NotificationBell } from './AdminNotifications';

type NavItem = { to: string; icon: LucideIcon; label: string; end?: boolean; badge?: number };

type AdminOutletContext = { openPayment: (student?: Student | null) => void };

/** Child pages call this to open the shared Record Payment dialog. */
export function useAdminOutlet() {
  return useOutletContext<AdminOutletContext>();
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { period, promissoryNotes, loadAdminData, setActiveTerm } = useApp();
  const navigate = useNavigate();
  const [paymentFor, setPaymentFor] = useState<Student | null | undefined>(undefined);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadAdminData().catch((err: Error) => setLoadError(err.message));
  }, [loadAdminData]);

  const pendingCount = promissoryNotes.filter((n) => n.status === 'pending').length;

  const navSections: { title: string; items: NavItem[] }[] = [
    { title: 'Overview', items: [{ to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true }] },
    {
      title: 'Accounts',
      items: [
        { to: '/admin/students', icon: Users, label: 'Students & SOA' },
        { to: '/admin/promissory-notes', icon: FileSignature, label: 'Promissory Notes', badge: pendingCount }
      ]
    },
    {
      title: 'File Maintenance',
      items: [
        { to: '/admin/maintenance/students', icon: UserCog, label: 'Student List' },
        { to: '/admin/maintenance/assessments', icon: Calculator, label: 'Assessment' },
        { to: '/admin/maintenance/courses', icon: GraduationCap, label: 'Courses' },
        { to: '/admin/maintenance/subjects', icon: BookOpen, label: 'Subjects' },
        { to: '/admin/maintenance/periods', icon: CalendarRange, label: 'School Year & Semester' }
      ]
    },
    {
      title: 'System',
      items: [
        { to: '/admin/logs', icon: History, label: 'Activity Logs' },
        { to: '/admin/maintenance/users', icon: ShieldCheck, label: 'Admin Users' }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const handleTermChange = async (term: ExamTerm) => {
    const err = await setActiveTerm(term);
    if (err) setLoadError(err);
  };

  return (
    <div className="admin-shell flex h-screen font-sans">
      <aside className="admin-sidebar z-10 hidden md:flex w-64 flex-col shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <img src={SCHOOL_LOGO} alt="St. Nicolas College" className="h-11 w-11 shrink-0 object-contain" />
          <div className="min-w-0">
            <span className="block text-sm font-bold leading-tight text-white">Permit &amp; SOA Kiosk</span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-emerald-300/80">Accounting Portal</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {navSections.map((section, i) => (
            <div key={section.title} className={i === 0 ? '' : 'pt-4'}>
              <p className="admin-sidebar-section px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `admin-nav-link flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'admin-nav-link--active' : ''}`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {!!item.badge && (
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">{item.badge}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <a
            href="/kiosk"
            target="_blank"
            rel="noreferrer"
            className="admin-nav-link flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium"
          >
            <Monitor className="h-4 w-4 text-snc-neon" /> Open Student Kiosk
          </a>
          <div className="flex items-center gap-3 rounded-xl bg-black/25 p-3">
            <StudentAvatar name={user?.fullname ?? 'Admin'} className="h-9 w-9 border border-snc-neon/40 text-xs" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{user?.fullname}</div>
              <div className="truncate text-[11px] text-emerald-200/70">{user?.position || 'Staff'}</div>
            </div>
            <button onClick={handleLogout} title="Sign out" className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="admin-topbar z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 px-6 py-3">
          {/* Left: current school year + exam term switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {period && (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                <CalendarDays className="h-3.5 w-3.5 text-snc-green-mid" />
                {period.academicYear} · {period.semester}
              </span>
            )}
            <div className="flex items-center rounded-full bg-slate-100 p-1" role="radiogroup" aria-label="Active exam term">
              {ALL_EXAM_TERMS.map((t) => {
                const active = period?.activeTerm === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => !active && handleTermChange(t)}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      active ? 'bg-snc-green text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <SystemStatusBadge variant="light" className="hidden lg:inline-block [&>button]:normal-case [&>button]:tracking-normal" />
            <NotificationBell />
            <button
              onClick={() => setPaymentFor(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-snc-green-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-snc-green cursor-pointer"
            >
              <CreditCard className="h-4 w-4" /> Record Payment
            </button>
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 md:hidden cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile nav (sidebar hidden below md) */}
        <nav className="flex gap-1 overflow-x-auto border-b border-green-900/10 bg-white px-3 py-2 md:hidden">
          {navSections.flatMap((s) => s.items).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${isActive ? 'bg-snc-green text-white' : 'text-slate-600'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-content overflow-y-auto">
          {loadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
          )}
          <Outlet context={{ openPayment: (s?: Student | null) => setPaymentFor(s ?? null) } satisfies AdminOutletContext} />
        </div>
      </main>

      <LiveToasts />

      {paymentFor !== undefined && (
        <AdminCashierModal initialStudent={paymentFor} onClose={() => setPaymentFor(undefined)} />
      )}
    </div>
  );
}
