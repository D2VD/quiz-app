import { Link, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const { session, profile, logout } = useAuth();

  const isTeacherRoute = location.pathname.startsWith('/teacher');

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-sky-50" />
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-sky-300/40 to-indigo-400/40 blur-3xl animate-blob" />
        <div
          className="absolute top-1/3 -right-16 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-purple-300/35 to-indigo-400/35 blur-3xl animate-blob"
          style={{ animationDelay: '-6s' }}
        />
        <div
          className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-cyan-300/30 to-sky-400/30 blur-3xl animate-blob-slow"
          style={{ animationDelay: '-3s' }}
        />
      </div>
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-semibold tracking-tight text-slate-900">
            QuizLab
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
            {session && profile ? (
              <>
                <span className="hidden rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:inline">
                  {profile.fullName} · {profile.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                </span>
                {profile.role === 'teacher' && (
                  <Link
                    to="/teacher"
                    className={`rounded-md px-3 py-1.5 transition hover:text-indigo-600 ${
                      isTeacherRoute ? 'text-indigo-600' : 'text-slate-600'
                    }`}
                  >
                    Quản lý
                  </Link>
                )}
                <button
                  onClick={() => {
                    void logout();
                  }}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md border border-indigo-200 px-3 py-1.5 text-indigo-600 transition hover:bg-indigo-50"
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
};
