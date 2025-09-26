import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useCountdown } from '@/hooks/useCountdown';
import { TestApi } from '@/services/api';
import type { TestDetail } from '@/types';

export const TestWaitingRoomPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countdown = useCountdown(test?.startTime ?? null, 1000);

  useEffect(() => {
    const load = async () => {
      if (!testId) return;
      try {
        const data = await TestApi.fetchTest(testId);
        if (!data) {
          setError('Không tìm thấy bài thi.');
          return;
        }
        setTest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải bài thi.');
      }
    };
    load();
  }, [testId]);

  useEffect(() => {
    if (countdown.isExpired && testId) {
      navigate(`/test/${testId}/take`, { replace: true });
    }
  }, [countdown.isExpired, navigate, testId]);

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  if (!test) {
    return <p className="text-sm text-slate-500">Đang tải phòng chờ...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 text-center">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">{test.title}</h1>
        <p className="text-sm text-slate-500">
          Bài thi sẽ bắt đầu lúc {new Date(test.startTime).toLocaleString('vi-VN')}.
        </p>
      </div>

      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-purple-600 p-10 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-100">Phòng chờ</p>
        <p className="mt-4 text-5xl font-bold">{countdown.formatted}</p>
        <p className="mt-4 text-sm text-indigo-100">
          Khi đồng hồ về 0, bạn sẽ tự động chuyển sang trang làm bài.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Hướng dẫn</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Đảm bảo kết nối Internet ổn định trong suốt thời gian làm bài.</li>
          <li>Chuẩn bị giấy nháp nếu cần cho phần tự luận.</li>
          <li>Không tải lại trang khi đang trong phòng chờ hoặc làm bài.</li>
        </ul>
      </div>
    </div>
  );
};
