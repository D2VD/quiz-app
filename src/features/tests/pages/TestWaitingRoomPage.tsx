import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useCountdown } from '@/hooks/useCountdown';
import { SubmissionApi, TestApi } from '@/services/api';
import type { SubmissionSummary, TestDetail } from '@/types';

export const TestWaitingRoomPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [submission, setSubmission] = useState<SubmissionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countdown = useCountdown(test?.startTime ?? null, 1000);

  useEffect(() => {
    const load = async () => {
      if (!testId) return;
      try {
        const [data, submissionInfo] = await Promise.all([
          TestApi.fetchTest(testId),
          SubmissionApi.getSubmissionForCurrentStudent(testId),
        ]);
        if (!data) {
          setError('Không tìm thấy bài thi.');
          return;
        }
        setTest(data);
        setSubmission(submissionInfo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải bài thi.');
      }
    };
    load();
  }, [testId]);

  const hasSubmitted = Boolean(submission);
  const canStart = Boolean(test && countdown.isExpired && !hasSubmitted);

  const handleStart = () => {
    if (!canStart || !testId) return;
    navigate(`/test/${testId}/take`);
  };

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
          {hasSubmitted
            ? 'Bạn đã nộp bài thi này. Vui lòng quay lại bảng điều khiển để xem thông tin chi tiết.'
            : canStart
              ? 'Đã đến giờ làm bài, hãy nhấn nút bắt đầu để vào đề thi.'
              : 'Khi đồng hồ về 0, nút Bắt đầu sẽ được kích hoạt để bạn vào làm bài.'}
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-indigo-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          Bắt đầu làm bài
        </button>
      </div>

      {hasSubmitted && submission && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Bài nộp của bạn</h2>
          <p className="mt-2 text-sm text-slate-600">
            Đã nộp lúc {new Date(submission.submittedAt).toLocaleString('vi-VN')}.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Điểm: {submission.score ?? 'đang chấm'}
          </p>
        </div>
      )}

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
