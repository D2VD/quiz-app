import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { CreateClassForm } from '@/features/teacher/components/CreateClassForm';
import { CreateTestForm } from '@/features/teacher/components/CreateTestForm';
import { ClassApi, TestApi } from '@/services/api';
import type { ClassSummary, TestOverview } from '@/types';

export const TeacherDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [tests, setTests] = useState<Record<string, TestOverview[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const teacherClasses = await ClassApi.listClassesForTeacher(profile.id);
      setClasses(teacherClasses);
      const testsByClass: Record<string, TestOverview[]> = {};
      for (const klass of teacherClasses) {
        const classTests = await TestApi.listTestsForClass(klass.id);
        testsByClass[klass.id] = classTests;
      }
      setTests(testsByClass);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const totalStudents = useMemo(() => classes.length * 30, [classes.length]);

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-sm">
        <h1 className="text-2xl font-semibold">Bảng điều khiển giáo viên</h1>
        <p className="mt-2 max-w-2xl text-sm text-indigo-100">
          Tạo lớp học mới, lên lịch đề thi và theo dõi tiến độ học sinh theo thời gian thực.
        </p>
        <dl className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-indigo-200">Lớp học</dt>
            <dd className="text-2xl font-semibold">{classes.length}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-indigo-200">Số bài thi</dt>
            <dd className="text-2xl font-semibold">
              {Object.values(tests).reduce((total, list) => total + list.length, 0)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-indigo-200">Học sinh dự kiến</dt>
            <dd className="text-2xl font-semibold">~{totalStudents}</dd>
          </div>
        </dl>
      </div>

      <CreateClassForm
        onCreated={(klass) => {
          setClasses((prev) => [klass, ...prev]);
        }}
      />

      {classes.length > 0 ? (
        <CreateTestForm classes={classes} onCreated={refresh} />
      ) : (
        <p className="text-sm text-slate-500">
          Hãy tạo ít nhất một lớp học trước khi thêm đề thi.
        </p>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>}

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Các lớp học của bạn</h2>
        {classes.map((klass) => (
          <div key={klass.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{klass.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Mã mời: <span className="font-semibold text-indigo-600">{klass.inviteCode}</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Tạo ngày {new Date(klass.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <p>Bài thi đã tạo: {tests[klass.id]?.length ?? 0}</p>
                <div className="space-y-2">
                  {(tests[klass.id] ?? []).map((test) => (
                    <div key={test.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                      <p className="font-semibold text-slate-700">{test.title}</p>
                      <p className="mt-1 text-slate-500">
                        Bắt đầu lúc {new Date(test.startTime).toLocaleString('vi-VN')} · {test.durationMinutes} phút
                      </p>
                    </div>
                  ))}
                  {(tests[klass.id] ?? []).length === 0 && (
                    <p className="text-xs text-slate-400">Chưa có bài thi nào cho lớp này.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Bạn chưa có lớp học nào. Hãy tạo lớp đầu tiên ngay!
          </div>
        )}
      </section>
    </div>
  );
};
