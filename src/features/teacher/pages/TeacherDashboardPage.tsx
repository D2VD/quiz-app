import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

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
  const totalTests = useMemo(
    () => Object.values(tests).reduce((total, list) => total + list.length, 0),
    [tests],
  );

  return (
    <div className="space-y-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-8 text-white shadow-xl">
            <div className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-indigo-400/30 blur-3xl animate-blob" />
            <div
              className="pointer-events-none absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-sky-400/30 blur-3xl animate-blob"
              style={{ animationDelay: '-4s' }}
            />
            <div className="relative space-y-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-indigo-100 transition hover:border-white/40 hover:bg-white/20"
              >
                QuizLab
              </Link>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold">Bảng điều khiển giáo viên</h1>
                <p className="max-w-2xl text-sm text-indigo-100/90">
                  Tạo lớp học mới, lên lịch đề thi và theo dõi tiến độ học sinh theo thời gian thực.
                </p>
              </div>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <dt className="text-xs uppercase tracking-wide text-indigo-100/80">Lớp học</dt>
                  <dd className="mt-2 text-2xl font-semibold">{classes.length}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <dt className="text-xs uppercase tracking-wide text-indigo-100/80">Số bài thi</dt>
                  <dd className="mt-2 text-2xl font-semibold">{totalTests}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <dt className="text-xs uppercase tracking-wide text-indigo-100/80">Học sinh dự kiến</dt>
                  <dd className="mt-2 text-2xl font-semibold">~{totalStudents}</dd>
                </div>
              </dl>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Các lớp học của bạn</h2>
              <span className="text-sm text-slate-600">{classes.length} lớp đang hoạt động</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((klass) => (
                <div
                  key={klass.id}
                  className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur"
                >
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-slate-900">{klass.name}</h3>
                    <p className="text-sm text-slate-500">
                      Mã mời: <span className="font-semibold text-indigo-600">{klass.inviteCode}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Tạo ngày {new Date(klass.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <p className="font-medium text-slate-700">Bài thi đã tạo: {tests[klass.id]?.length ?? 0}</p>
                    <div className="space-y-2">
                      {(tests[klass.id] ?? []).map((test) => (
                        <div
                          key={test.id}
                          className="rounded-xl border border-slate-200/80 bg-white/70 p-3 text-xs shadow-sm"
                        >
                          <p className="font-semibold text-slate-800">{test.title}</p>
                          <p className="mt-1 text-slate-500">
                            Bắt đầu lúc {new Date(test.startTime).toLocaleString('vi-VN')} · {test.durationMinutes} phút
                          </p>
                        </div>
                      ))}
                      {(tests[klass.id] ?? []).length === 0 && (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-white/60 p-3 text-xs text-slate-400">
                          Chưa có bài thi nào cho lớp này.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {classes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600 shadow-sm">
                Bạn chưa có lớp học nào. Hãy tạo lớp đầu tiên ngay!
              </div>
            )}
          </section>
        </section>

        <aside className="space-y-6">
          <CreateClassForm
            onCreated={(klass) => {
              setClasses((prev) => [klass, ...prev]);
            }}
          />

          {classes.length > 0 ? (
            <CreateTestForm classes={classes} onCreated={refresh} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600 shadow-sm">
              Hãy tạo ít nhất một lớp học trước khi thêm đề thi.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
              Đang tải dữ liệu...
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
