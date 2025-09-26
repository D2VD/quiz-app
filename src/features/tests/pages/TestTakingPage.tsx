import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useCountdown } from '@/hooks/useCountdown';
import { SubmissionApi, TestApi } from '@/services/api';
import type { TestDetail } from '@/types';

export const TestTakingPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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

  const endTime = useMemo(() => {
    if (!test) return null;
    const start = Date.parse(test.startTime);
    return new Date(start + test.durationMinutes * 60 * 1000).toISOString();
  }, [test]);

  const countdown = useCountdown(endTime, 1000);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!testId || !test) return;

    setSubmitting(true);
    setError(null);
    try {
      await SubmissionApi.submitTest({
        testId,
        answers: test.questions.map((question) => ({
          questionId: question.id,
          value: answers[question.id] ?? null,
        })),
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nộp bài.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (countdown.isExpired && !submitting) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown.isExpired]);

  if (!test) {
    return <p className="text-sm text-slate-500">Đang chuẩn bị đề thi...</p>;
  }

  return (
    <form className="mx-auto max-w-4xl space-y-8" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-emerald-800">{test.title}</h1>
          <p className="text-sm text-emerald-700/80">Thời gian còn lại</p>
        </div>
        <p className="text-4xl font-bold tracking-tight text-emerald-800">{countdown.formatted}</p>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="space-y-6">
        {test.questions.map((question, index) => (
          <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              Câu {index + 1}: {question.text}
            </p>
            {question.type === 'multiple_choice' ? (
              <div className="mt-4 grid gap-2">
                {(question.options ?? []).map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      answers[question.id] === option.id
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={(event) =>
                        setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
                      }
                    />
                    <span>{option.text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Nhập câu trả lời của bạn"
                rows={4}
                value={answers[question.id] ?? ''}
                onChange={(event) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
                }
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
        </button>
      </div>
    </form>
  );
};
