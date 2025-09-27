import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';
import { JoinClassCard } from '@/features/student/components/JoinClassCard';
import { TestApi } from '@/services/api';
import type { TestOverview } from '@/types';

const groupTests = (tests: TestOverview[]) => {
  const upcoming: TestOverview[] = [];
  const running: TestOverview[] = [];
  const completed: TestOverview[] = [];

  for (const test of tests) {
    if (test.status === 'completed') completed.push(test);
    else if (test.status === 'running') running.push(test);
    else upcoming.push(test);
  }

  return { upcoming, running, completed };
};

export const StudentDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [tests, setTests] = useState<TestOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const results = await TestApi.listTestsForStudent(profile.id);
      setTests(results);
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

  const { upcoming, running, completed } = useMemo(() => groupTests(tests), [tests]);

  const renderSection = (title: string, list: TestOverview[]) => (
    <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">{list.length} bài thi</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((test) => (
          <Link
            key={test.id}
            to={`/test/${test.id}`}
            className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-left text-sm text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <h3 className="text-base font-semibold text-slate-900">{test.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bắt đầu lúc {new Date(test.startTime).toLocaleString('vi-VN')}
            </p>
            <p className="mt-1 text-sm text-slate-500">Thời lượng: {test.durationMinutes} phút</p>
            {test.status === 'completed' && (
              <p className="mt-3 text-sm font-medium text-indigo-600">
                Đã nộp · Điểm: {test.score ?? 'đang chấm'}
              </p>
            )}
            {test.status === 'running' && (
              <span className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Đang diễn ra
              </span>
            )}
            {test.status === 'upcoming' && (
              <span className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Sắp diễn ra
              </span>
            )}
          </Link>
        ))}
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
            Chưa có bài thi nào.
          </div>
        )}
      </div>
    </section>
  );

  const summary = {
    total: tests.length,
    running: running.length,
    upcoming: upcoming.length,
    completed: completed.length,
  };

  const studentName = profile?.fullName?.trim();

  return (
    <div className="space-y-10">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="space-y-8">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-8 text-white shadow-xl">
            <div className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl animate-blob" />
            <div
              className="pointer-events-none absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-sky-300/35 blur-3xl animate-blob"
              style={{ animationDelay: '-5s' }}
            />
            <div className="relative space-y-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-indigo-100 transition hover:border-white/40 hover:bg-white/20"
              >
                QuizLab
              </Link>
              <h1 className="text-3xl font-semibold text-white">
                Chào mừng trở lại
                {studentName ? (
                  <>
                    {' '}
                    <span className="text-amber-200">{studentName}</span>!
                  </>
                ) : (
                  '!'
                )}
              </h1>
              <p className="max-w-2xl text-sm text-indigo-100/90">
                Theo dõi các bài thi sắp diễn ra, tham gia lớp mới bằng mã mời và xem lại các bài thi đã hoàn thành.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {renderSection('Đang diễn ra', running)}
            {renderSection('Sắp diễn ra', upcoming)}
            {renderSection('Đã hoàn thành', completed)}
          </div>
        </section>

        <aside className="space-y-6">
          <JoinClassCard onJoined={refresh} />

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-slate-900">Tổng quan nhanh</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Tổng số bài thi</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.total}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Đang diễn ra</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.running}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Sắp diễn ra</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.upcoming}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Đã hoàn thành</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.completed}</dd>
              </div>
            </dl>
          </div>

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
