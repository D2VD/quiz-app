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
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">{list.length} bài thi</span>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {list.map((test) => (
          <Link
            key={test.id}
            to={`/test/${test.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200"
          >
            <h3 className="text-base font-semibold text-slate-900">{test.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bắt đầu lúc {new Date(test.startTime).toLocaleString('vi-VN')}
            </p>
            <p className="mt-1 text-sm text-slate-500">Thời lượng: {test.durationMinutes} phút</p>
            {test.status === 'completed' && (
              <p className="mt-2 text-sm font-medium text-indigo-600">
                Đã nộp · Điểm: {test.score ?? 'đang chấm'}
              </p>
            )}
            {test.status === 'running' && <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Đang diễn ra</span>}
            {test.status === 'upcoming' && <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Sắp diễn ra</span>}
          </Link>
        ))}
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Chưa có bài thi nào.
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Chào mừng trở lại!</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Theo dõi các bài thi sắp diễn ra, tham gia lớp mới bằng mã mời và xem lại các bài thi đã hoàn thành.
        </p>
      </div>

      <JoinClassCard onJoined={refresh} />

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>}

      <div className="space-y-8">
        {renderSection('Đang diễn ra', running)}
        {renderSection('Sắp diễn ra', upcoming)}
        {renderSection('Đã hoàn thành', completed)}
      </div>
    </div>
  );
};
