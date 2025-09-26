
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../constants';
import TeacherDashboard from './teacher/TeacherDashboard';
import StudentDashboard from './student/StudentDashboard';
import Spinner from '../components/Spinner';

const Home: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center pt-20"><Spinner /></div>;
  }

  if (!user) {
    // This case should be handled by ProtectedRoute, but as a fallback:
    return <div className="text-center pt-20">Vui lòng đăng nhập.</div>;
  }

  if (user.role === UserRole.TEACHER) {
    return <TeacherDashboard />;
  }

  if (user.role === UserRole.STUDENT) {
    return <StudentDashboard />;
  }

  return <div className="text-center pt-20">Vai trò người dùng không xác định.</div>;
};

export default Home;
