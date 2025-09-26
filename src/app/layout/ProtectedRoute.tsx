import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  allowRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowRoles, redirectTo = '/login' }) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Đang tải...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowRoles && profile && !allowRoles.includes(profile.role)) {
    const fallback = profile.role === 'teacher' ? '/teacher' : profile.role === 'student' ? '/student' : '/';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};
