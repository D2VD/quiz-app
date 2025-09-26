import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';
import { StudentDashboardPage } from '@/features/student/pages/StudentDashboardPage';

export const HomePage: React.FC = () => {
  const { session, profile } = useAuth();

  if (session && profile?.role === 'student') {
    return <StudentDashboardPage />;
  }

  if (session && profile?.role === 'teacher') {
    return (
      <div className="space-y-10">
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-500 to-purple-500 p-10 text-white">
          <h1 className="text-3xl font-semibold">Xin chào {profile.fullName}!</h1>
          <p className="mt-3 max-w-2xl text-sm text-indigo-100">
            Quản lý lớp học, tạo đề thi và theo dõi tiến độ học sinh trong một giao diện thống nhất.
          </p>
          <Link
            to="/teacher"
            className="mt-6 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-100"
          >
            Đi tới bảng điều khiển giáo viên
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-16 text-center">
      <div className="space-y-6">
        <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
          QuizLab
        </span>
        <h1 className="text-4xl font-bold leading-tight text-slate-900">
          Phòng thi trực tuyến với trải nghiệm phòng chờ đếm ngược chuyên nghiệp
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-slate-600">
          Giáo viên dễ dàng tạo bài thi trắc nghiệm và tự luận, mời học sinh tham gia lớp, đặt giờ mở đề và chấm điểm tự động cho phần trắc nghiệm.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Bắt đầu ngay
          </Link>
          <a
            href="#features"
            className="rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Tìm hiểu thêm
          </a>
        </div>
      </div>

      <section id="features" className="grid gap-6 text-left sm:grid-cols-3">
        {[{
          title: 'Phòng chờ trực quan',
          description: 'Đồng hồ đếm ngược tự động chuyển sang trang làm bài khi đến giờ.'
        }, {
          title: 'Tạo đề linh hoạt',
          description: 'Kết hợp câu hỏi trắc nghiệm và tự luận trong cùng một đề thi.'
        }, {
          title: 'Quản lý lớp học',
          description: 'Phân quyền rõ ràng giữa giáo viên và học sinh với mã mời tiện lợi.'
        }].map((feature) => (
          <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
};
