import { Link, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const { session, profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold text-indigo-600">
            QuizLab
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            {session && profile ? (
              <>
                <span className="hidden text-slate-500 sm:inline">
                  {profile.fullName} · {profile.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                </span>
                {profile.role === 'teacher' && (
                  <Link
                    to="/teacher"
                    className={location.pathname.startsWith('/teacher') ? 'text-indigo-600' : ''}
                  >
                    Quản lý
                  </Link>
                )}
                <button
                  onClick={() => {
                    void logout();
                  }}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
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
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};
