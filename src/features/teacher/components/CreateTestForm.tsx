import { FormEvent, useState } from 'react';

import type { ClassSummary, QuestionOption, QuestionType } from '@/types';
import { TestApi } from '@/services/api';

interface Props {
  classes: ClassSummary[];
  onCreated?: () => void;
}

interface DraftQuestion {
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  correctOptionId?: string;
}

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyQuestion = (): DraftQuestion => ({
  text: '',
  type: 'multiple_choice',
  options: [
    { id: makeId(), text: '' },
    { id: makeId(), text: '' },
  ],
});

export const CreateTestForm: React.FC<Props> = ({ classes, onCreated }) => {
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(45);
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await TestApi.createTest({
        title,
        classId,
        startTime: new Date(startTime).toISOString(),
        durationMinutes: duration,
        questions: questions.map((question) => ({
          text: question.text,
          type: question.type,
          options: question.type === 'multiple_choice' ? question.options : undefined,
          correctOptionId:
            question.type === 'multiple_choice' ? question.correctOptionId ?? question.options[0]?.id : undefined,
        })),
      });
      setSuccess('Tạo đề thi thành công.');
      setTitle('');
      setStartTime('');
      setDuration(45);
      setQuestions([emptyQuestion()]);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo đề thi.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (index: number, updater: (draft: DraftQuestion) => DraftQuestion) => {
    setQuestions((prev) => prev.map((question, idx) => (idx === index ? updater(question) : question)));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (index: number) => setQuestions((prev) => prev.filter((_, idx) => idx !== index));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Tạo đề thi mới</h2>
      <p className="mt-1 text-sm text-slate-500">Thiết lập thời gian mở bài và thêm câu hỏi trắc nghiệm hoặc tự luận.</p>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Tiêu đề
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Lớp học
            <select
              required
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {classes.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Thời gian bắt đầu
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Thời lượng (phút)
            <input
              type="number"
              min={5}
              required
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Danh sách câu hỏi</h3>
          {questions.map((question, index) => (
            <div key={index} className="rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                    Nội dung câu hỏi
                    <textarea
                      required
                      value={question.text}
                      onChange={(event) =>
                        updateQuestion(index, (draft) => ({ ...draft, text: event.target.value }))
                      }
                      className="min-h-[80px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                    Loại câu hỏi
                    <select
                      value={question.type}
                      onChange={(event) =>
                        updateQuestion(index, (draft) => ({
                          ...draft,
                          type: event.target.value as QuestionType,
                          options:
                            event.target.value === 'multiple_choice'
                              ? draft.options.length > 0
                                ? draft.options
                                : [
                                    { id: makeId(), text: '' },
                                    { id: makeId(), text: '' },
                                  ]
                              : [],
                        }))
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="multiple_choice">Trắc nghiệm</option>
                      <option value="short_answer">Tự luận</option>
                    </select>
                  </label>

                  {question.type === 'multiple_choice' && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-600">Các phương án</p>
                      {question.options.map((option, optionIndex) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            required
                            value={option.text}
                            onChange={(event) =>
                              updateQuestion(index, (draft) => ({
                                ...draft,
                                options: draft.options.map((opt, idx) =>
                                  idx === optionIndex ? { ...opt, text: event.target.value } : opt,
                                ),
                              }))
                            }
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            placeholder={`Đáp án ${optionIndex + 1}`}
                          />
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={question.correctOptionId === option.id}
                            onChange={() =>
                              updateQuestion(index, (draft) => ({ ...draft, correctOptionId: option.id }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestion(index, (draft) => ({
                                ...draft,
                                options: draft.options.filter((_, idx) => idx !== optionIndex),
                                correctOptionId:
                                  draft.correctOptionId === option.id ? draft.options[0]?.id : draft.correctOptionId,
                              }))
                            }
                            className="text-xs font-medium text-rose-500"
                            disabled={question.options.length <= 2}
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(index, (draft) => ({
                            ...draft,
                            options: [...draft.options, { id: makeId(), text: '' }],
                          }))
                        }
                        className="text-xs font-semibold text-indigo-600"
                      >
                        + Thêm đáp án
                      </button>
                    </div>
                  )}
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="text-xs font-medium text-rose-600"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-lg border border-dashed border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
          >
            + Thêm câu hỏi
          </button>
        </div>

        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-sm text-rose-600">{error}</span>}
          {success && <span className="text-sm text-emerald-600">{success}</span>}
          <button
            type="submit"
            disabled={loading || classes.length === 0}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Đang lưu...' : 'Tạo đề thi'}
          </button>
        </div>
      </form>
    </div>
  );
};
