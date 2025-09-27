import { Link, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const { session, profile, logout } = useAuth();

  const isTeacherRoute = location.pathname.startsWith('/teacher');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
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
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
};
