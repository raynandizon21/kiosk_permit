import { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, FileCheck2, FileSignature, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../lib/api';
import { SCHOOL_LOGO } from '../common/CollegeSeal';
import { AdminLoginBrandArt } from './AdminLoginBrandArt';

const BUILDING_BG = '/images/uploads/snc-building-front.jpg';

/** Same split login as the library admin console. */
export function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(username.trim(), password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-shell min-h-screen lg:grid lg:grid-cols-[60%_40%]">
      <aside className="admin-login-brand relative hidden lg:flex min-h-screen flex-col justify-between overflow-hidden p-10 xl:p-12">
        <div
          className="admin-login-brand-photo absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BUILDING_BG})` }}
          aria-hidden
        />
        <div className="admin-login-brand-art absolute inset-0">
          <AdminLoginBrandArt />
        </div>
        <div className="absolute inset-0 snc-hero-overlay" aria-hidden />
        <div className="admin-login-brand-glow pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative z-10 flex items-center gap-3">
          <img src={SCHOOL_LOGO} alt="" className="h-14 w-14 object-contain drop-shadow-lg" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Accounting Portal</p>
            <p className="kiosk-brand-title !text-xl">St. Nicolas College</p>
          </div>
        </div>

        <div className="relative z-10 my-8 max-w-lg">
          <p className="welcome-text !text-3xl">Self-Service Kiosk</p>
          <h1 className="title-text snc-hero-glow mt-2 !text-5xl xl:!text-6xl">Permit &amp; SOA</h1>
          <ul className="mt-8 space-y-4">
            <li className="admin-login-feature">
              <FileText className="h-5 w-5 shrink-0 text-snc-neon" strokeWidth={1.5} />
              <span>Statements of account and cashier payments</span>
            </li>
            <li className="admin-login-feature">
              <FileCheck2 className="h-5 w-5 shrink-0 text-snc-neon" strokeWidth={1.5} />
              <span>Examination permits cleared automatically on payment</span>
            </li>
            <li className="admin-login-feature">
              <FileSignature className="h-5 w-5 shrink-0 text-snc-neon" strokeWidth={1.5} />
              <span>Review promissory notes submitted at the kiosk</span>
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-xs text-white/50">© {new Date().getFullYear()} St. Nicolas College</div>
      </aside>

      <main className="admin-login-form-panel relative flex min-h-screen flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="pointer-events-none absolute inset-0 admin-login-form-dots" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-md">
          <div className="admin-login-card overflow-hidden rounded-2xl">
            <div className="snc-modal-header flex items-center gap-4 px-7 py-5">
              <img src={SCHOOL_LOGO} alt="" className="h-12 w-12 shrink-0 object-contain drop-shadow-lg" />
              <div className="leading-tight">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-snc-neon">Accounting Portal</p>
                <h2 className="text-xl font-bold text-white">Sign in</h2>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <p className="mb-5 text-sm text-slate-500">Accounting and registrar staff only.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                )}

                <div>
                  <label htmlFor="username" className="admin-login-label">Username</label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="admin-login-input"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="admin-login-label">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="admin-login-input pr-11"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer select-none items-center gap-2.5">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="admin-login-submit flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" /> Sign in
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
