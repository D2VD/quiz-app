import { createBrowserRouter } from 'react-router-dom';

import { AppShell } from '@/app/layout/AppShell';
import { ProtectedRoute } from '@/app/layout/ProtectedRoute';
import { AuthPage } from '@/features/auth/pages/AuthPage';
import { StudentDashboardPage } from '@/features/student/pages/StudentDashboardPage';
import { TeacherDashboardPage } from '@/features/teacher/pages/TeacherDashboardPage';
import { TestTakingPage } from '@/features/tests/pages/TestTakingPage';
import { TestWaitingRoomPage } from '@/features/tests/pages/TestWaitingRoomPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <AuthPage /> },
      {
        element: <ProtectedRoute allowRoles={['teacher']} />,
        children: [
          { path: '/teacher', element: <TeacherDashboardPage /> },
        ],
      },
      {
        element: <ProtectedRoute allowRoles={['student']} />,
        children: [
          { path: '/student', element: <StudentDashboardPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/test/:testId', element: <TestWaitingRoomPage /> },
          { path: '/test/:testId/take', element: <TestTakingPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
