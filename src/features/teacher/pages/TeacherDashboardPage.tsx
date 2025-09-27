import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';
import { CreateClassForm } from '@/features/teacher/components/CreateClassForm';
import { CreateTestForm } from '@/features/teacher/components/CreateTestForm';
import { ClassApi, SubjectApi, TestApi } from '@/services/api';
import type { ClassSummary, SubjectSummary, TestOverview } from '@/types';

const formatDateTimeLocal = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoStringFromLocalInput = (value: string) =>
  value ? new Date(value).toISOString() : '';

type TestDraft = {
  title: string;
  startTime: string;
  durationMinutes: number;
};

type SubjectDraft = {
  name: string;
  description: string;
};

export const TeacherDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [tests, setTests] = useState<Record<string, TestOverview[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classEditingId, setClassEditingId] = useState<string | null>(null);
  const [classNameDraft, setClassNameDraft] = useState('');
  const [classLoadingId, setClassLoadingId] = useState<string | null>(null);
  const [classErrors, setClassErrors] = useState<Record<string, string | null>>({});

  const [testEditingId, setTestEditingId] = useState<string | null>(null);
  const [testDraft, setTestDraft] = useState<TestDraft>({
    title: '',
    startTime: '',
    durationMinutes: 45,
  });
  const [testLoadingId, setTestLoadingId] = useState<string | null>(null);
  const [testErrors, setTestErrors] = useState<Record<string, string | null>>({});

  const [subjectName, setSubjectName] = useState('');
  const [subjectDescription, setSubjectDescription] = useState('');
  const [subjectFormLoading, setSubjectFormLoading] = useState(false);
  const [subjectFormError, setSubjectFormError] = useState<string | null>(null);
  const [subjectEditingId, setSubjectEditingId] = useState<string | null>(null);
  const [subjectDraft, setSubjectDraft] = useState<SubjectDraft>({
    name: '',
    description: '',
  });
  const [subjectLoadingId, setSubjectLoadingId] = useState<string | null>(null);
  const [subjectErrors, setSubjectErrors] = useState<Record<string, string | null>>({});

  const refresh = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const [teacherClasses, teacherSubjects] = await Promise.all([
        ClassApi.listClassesForTeacher(profile.id),
        SubjectApi.listSubjectsForTeacher(profile.id),
      ]);
      setClasses(teacherClasses);
      setSubjects(teacherSubjects);

      const testsByClassEntries = await Promise.all(
        teacherClasses.map(async (klass) => {
          const classTests = await TestApi.listTestsForClass(klass.id);
          return [klass.id, classTests] as const;
        }),
      );

      setTests(Object.fromEntries(testsByClassEntries));
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
  const totalSubjects = useMemo(() => subjects.length, [subjects.length]);

  const setClassError = (id: string, message: string | null) =>
    setClassErrors((prev) => ({ ...prev, [id]: message }));

  const setTestError = (id: string, message: string | null) =>
    setTestErrors((prev) => ({ ...prev, [id]: message }));

  const setSubjectError = (id: string, message: string | null) =>
    setSubjectErrors((prev) => ({ ...prev, [id]: message }));

  const handleStartEditClass = (klass: ClassSummary) => {
    setClassEditingId(klass.id);
    setClassNameDraft(klass.name);
    setClassError(klass.id, null);
  };

  const handleCancelEditClass = () => {
    if (classEditingId) {
      setClassError(classEditingId, null);
    }
    setClassEditingId(null);
    setClassNameDraft('');
  };

  const handleSaveClass = async (classId: string) => {
    if (!classNameDraft.trim()) {
      setClassError(classId, 'Tên lớp học không được để trống.');
      return;
    }

    setClassLoadingId(classId);
    setClassError(classId, null);
    try {
      const updated = await ClassApi.updateClass(classId, {
        name: classNameDraft.trim(),
      });
      setClasses((prev) => prev.map((klass) => (klass.id === classId ? updated : klass)));
      setClassEditingId(null);
      setClassNameDraft('');
    } catch (err) {
      setClassError(
        classId,
        err instanceof Error ? err.message : 'Không thể cập nhật lớp học.',
      );
    } finally {
      setClassLoadingId(null);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Bạn có chắc chắn muốn xoá lớp học này?');
      if (!confirmed) return;
    }

    setClassLoadingId(classId);
    setClassError(classId, null);
    try {
      await ClassApi.deleteClass(classId);
      setClasses((prev) => prev.filter((klass) => klass.id !== classId));
      setTests((prev) => {
        const next = { ...prev };
        delete next[classId];
        return next;
      });
      if (classEditingId === classId) {
        handleCancelEditClass();
      }
    } catch (err) {
      setClassError(
        classId,
        err instanceof Error ? err.message : 'Không thể xoá lớp học.',
      );
    } finally {
      setClassLoadingId(null);
    }
  };

  const handleStartEditTest = (test: TestOverview) => {
    setTestEditingId(test.id);
    setTestDraft({
      title: test.title,
      startTime: formatDateTimeLocal(test.startTime),
      durationMinutes: test.durationMinutes,
    });
    setTestError(test.id, null);
  };

  const handleCancelEditTest = () => {
    if (testEditingId) {
      setTestError(testEditingId, null);
    }
    setTestEditingId(null);
    setTestDraft({ title: '', startTime: '', durationMinutes: 45 });
  };

  const handleSaveTest = async (testId: string, classId: string) => {
    if (!testDraft.title.trim()) {
      setTestError(testId, 'Tiêu đề bài thi không được để trống.');
      return;
    }
    if (!testDraft.startTime) {
      setTestError(testId, 'Vui lòng chọn thời gian bắt đầu.');
      return;
    }

    setTestLoadingId(testId);
    setTestError(testId, null);
    try {
      const updated = await TestApi.updateTest(testId, {
        title: testDraft.title.trim(),
        startTime: toIsoStringFromLocalInput(testDraft.startTime),
        durationMinutes: testDraft.durationMinutes,
      });
      setTests((prev) => {
        const next = { ...prev };
        next[classId] = (next[classId] ?? []).map((test) =>
          test.id === testId ? { ...test, ...updated } : test,
        );
        return next;
      });
      handleCancelEditTest();
    } catch (err) {
      setTestError(
        testId,
        err instanceof Error ? err.message : 'Không thể cập nhật bài thi.',
      );
    } finally {
      setTestLoadingId(null);
    }
  };

  const handleDeleteTest = async (testId: string, classId: string) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Bạn có chắc chắn muốn xoá bài thi này?');
      if (!confirmed) return;
    }

    setTestLoadingId(testId);
    setTestError(testId, null);
    try {
      await TestApi.deleteTest(testId);
      setTests((prev) => {
        const next = { ...prev };
        next[classId] = (next[classId] ?? []).filter((test) => test.id !== testId);
        return next;
      });
      if (testEditingId === testId) {
        handleCancelEditTest();
      }
    } catch (err) {
      setTestError(
        testId,
        err instanceof Error ? err.message : 'Không thể xoá bài thi.',
      );
    } finally {
      setTestLoadingId(null);
    }
  };

  const handleCreateSubject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile?.id) {
      setSubjectFormError('Không xác định được tài khoản giáo viên.');
      return;
    }
    if (!subjectName.trim()) {
      setSubjectFormError('Tên môn học không được để trống.');
      return;
    }

    setSubjectFormLoading(true);
    setSubjectFormError(null);
    try {
      const created = await SubjectApi.createSubject(profile.id, {
        name: subjectName.trim(),
        description: subjectDescription.trim() || undefined,
      });
      setSubjects((prev) => [created, ...prev]);
      setSubjectName('');
      setSubjectDescription('');
    } catch (err) {
      setSubjectFormError(
        err instanceof Error ? err.message : 'Không thể tạo môn học mới.',
      );
    } finally {
      setSubjectFormLoading(false);
    }
  };

  const handleStartEditSubject = (subject: SubjectSummary) => {
    setSubjectEditingId(subject.id);
    setSubjectDraft({
      name: subject.name,
      description: subject.description ?? '',
    });
    setSubjectError(subject.id, null);
  };

  const handleCancelEditSubject = () => {
    if (subjectEditingId) {
      setSubjectError(subjectEditingId, null);
    }
    setSubjectEditingId(null);
    setSubjectDraft({ name: '', description: '' });
  };

  const handleSaveSubject = async (subjectId: string) => {
    if (!subjectDraft.name.trim()) {
      setSubjectError(subjectId, 'Tên môn học không được để trống.');
      return;
    }

    setSubjectLoadingId(subjectId);
    setSubjectError(subjectId, null);
    try {
      const updated = await SubjectApi.updateSubject(subjectId, {
        name: subjectDraft.name.trim(),
        description: subjectDraft.description.trim() || null,
      });
      setSubjects((prev) => prev.map((subject) => (subject.id === subjectId ? updated : subject)));
      handleCancelEditSubject();
    } catch (err) {
      setSubjectError(
        subjectId,
        err instanceof Error ? err.message : 'Không thể cập nhật môn học.',
      );
    } finally {
      setSubjectLoadingId(null);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Bạn có chắc chắn muốn xoá môn học này?');
      if (!confirmed) return;
    }

    setSubjectLoadingId(subjectId);
    setSubjectError(subjectId, null);
    try {
      await SubjectApi.deleteSubject(subjectId);
      setSubjects((prev) => prev.filter((subject) => subject.id !== subjectId));
      if (subjectEditingId === subjectId) {
        handleCancelEditSubject();
      }
    } catch (err) {
      setSubjectError(
        subjectId,
        err instanceof Error ? err.message : 'Không thể xoá môn học.',
      );
    } finally {
      setSubjectLoadingId(null);
    }
  };

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
                  Tạo lớp học mới, quản lý môn học, lên lịch đề thi và theo dõi tiến độ học sinh theo thời gian thực.
                </p>
              </div>
              <dl className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <dt className="text-xs uppercase tracking-wide text-indigo-100/80">Lớp học</dt>
                  <dd className="mt-2 text-2xl font-semibold">{classes.length}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <dt className="text-xs uppercase tracking-wide text-indigo-100/80">Môn học</dt>
                  <dd className="mt-2 text-2xl font-semibold">{totalSubjects}</dd>
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
                    {classEditingId === klass.id ? (
                      <div className="space-y-3">
                        <input
                          value={classNameDraft}
                          onChange={(event) => setClassNameDraft(event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="flex items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => handleSaveClass(klass.id)}
                            disabled={classLoadingId === klass.id}
                            className="rounded-lg bg-indigo-600 px-3 py-1 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditClass}
                            className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(klass.id)}
                            disabled={classLoadingId === klass.id}
                            className="ml-auto text-xs font-medium text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Xoá lớp
                          </button>
                        </div>
                        {classErrors[klass.id] && (
                          <p className="text-xs text-rose-600">{classErrors[klass.id]}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold text-slate-900">{klass.name}</h3>
                        <p className="text-sm text-slate-500">
                          Mã mời: <span className="font-semibold text-indigo-600">{klass.inviteCode}</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Tạo ngày {new Date(klass.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => handleStartEditClass(klass)}
                            className="font-semibold text-indigo-600 transition hover:text-indigo-500"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(klass.id)}
                            disabled={classLoadingId === klass.id}
                            className="font-semibold text-rose-600 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Xoá lớp
                          </button>
                        </div>
                        {classErrors[klass.id] && (
                          <p className="text-xs text-rose-600">{classErrors[klass.id]}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <p className="font-medium text-slate-700">Bài thi đã tạo: {tests[klass.id]?.length ?? 0}</p>
                    <div className="space-y-2">
                      {(tests[klass.id] ?? []).map((test) => (
                        <div
                          key={test.id}
                          className="rounded-xl border border-slate-200/80 bg-white/70 p-3 text-xs shadow-sm"
                        >
                          {testEditingId === test.id ? (
                            <div className="space-y-2">
                              <input
                                value={testDraft.title}
                                onChange={(event) =>
                                  setTestDraft((prev) => ({ ...prev, title: event.target.value }))
                                }
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                              />
                              <input
                                type="datetime-local"
                                value={testDraft.startTime}
                                onChange={(event) =>
                                  setTestDraft((prev) => ({
                                    ...prev,
                                    startTime: event.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                              />
                              <input
                                type="number"
                                min={5}
                                value={testDraft.durationMinutes}
                                onChange={(event) =>
                                  setTestDraft((prev) => ({
                                    ...prev,
                                    durationMinutes: Number(event.target.value),
                                  }))
                                }
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                              />
                              <div className="flex items-center gap-3 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => handleSaveTest(test.id, klass.id)}
                                  disabled={testLoadingId === test.id}
                                  className="rounded-lg bg-indigo-600 px-3 py-1 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditTest}
                                  className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTest(test.id, klass.id)}
                                  disabled={testLoadingId === test.id}
                                  className="ml-auto font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Xoá bài thi
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="font-semibold text-slate-800">{test.title}</p>
                              <p className="text-slate-500">
                                Bắt đầu lúc {new Date(test.startTime).toLocaleString('vi-VN')} · {test.durationMinutes} phút
                              </p>
                              <div className="flex items-center gap-3 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditTest(test)}
                                  className="font-semibold text-indigo-600 transition hover:text-indigo-500"
                                >
                                  Chỉnh sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTest(test.id, klass.id)}
                                  disabled={testLoadingId === test.id}
                                  className="font-semibold text-rose-600 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Xoá bài thi
                                </button>
                              </div>
                            </div>
                          )}
                          {testErrors[test.id] && (
                            <p className="pt-2 text-[11px] text-rose-600">{testErrors[test.id]}</p>
                          )}
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

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Môn học đang quản lý</h2>
              <span className="text-sm text-slate-600">{subjects.length} môn đã được tạo</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Thêm môn học mới</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Lưu trữ thông tin môn học để gắn với lớp và đề thi dễ dàng hơn.
                </p>
                <form className="mt-4 space-y-3" onSubmit={handleCreateSubject}>
                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                    Tên môn học
                    <input
                      required
                      value={subjectName}
                      onChange={(event) => setSubjectName(event.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Ví dụ: Vật lý 12"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                    Mô tả (tuỳ chọn)
                    <textarea
                      value={subjectDescription}
                      onChange={(event) => setSubjectDescription(event.target.value)}
                      className="min-h-[80px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Thông tin thêm về môn học"
                    />
                  </label>
                  {subjectFormError && (
                    <p className="text-sm text-rose-600">{subjectFormError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={subjectFormLoading}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {subjectFormLoading ? 'Đang lưu...' : 'Thêm môn học'}
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm"
                  >
                    {subjectEditingId === subject.id ? (
                      <div className="space-y-3">
                        <input
                          value={subjectDraft.name}
                          onChange={(event) =>
                            setSubjectDraft((prev) => ({ ...prev, name: event.target.value }))
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        <textarea
                          value={subjectDraft.description}
                          onChange={(event) =>
                            setSubjectDraft((prev) => ({
                              ...prev,
                              description: event.target.value,
                            }))
                          }
                          className="min-h-[80px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="flex items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => handleSaveSubject(subject.id)}
                            disabled={subjectLoadingId === subject.id}
                            className="rounded-lg bg-indigo-600 px-3 py-1 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditSubject}
                            className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(subject.id)}
                            disabled={subjectLoadingId === subject.id}
                            className="ml-auto font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Xoá môn học
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-semibold text-slate-900">{subject.name}</h3>
                          <span className="text-xs text-slate-400">
                            Cập nhật lần cuối {new Date(subject.updatedAt ?? subject.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        {subject.description && (
                          <p className="text-sm text-slate-600">{subject.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => handleStartEditSubject(subject)}
                            className="font-semibold text-indigo-600 transition hover:text-indigo-500"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(subject.id)}
                            disabled={subjectLoadingId === subject.id}
                            className="font-semibold text-rose-600 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Xoá môn học
                          </button>
                        </div>
                      </div>
                    )}
                    {subjectErrors[subject.id] && (
                      <p className="pt-2 text-xs text-rose-600">{subjectErrors[subject.id]}</p>
                    )}
                  </div>
                ))}
                {subjects.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600 shadow-sm">
                    Bạn chưa có môn học nào. Hãy bắt đầu bằng cách thêm môn mới ở bên trái.
                  </div>
                )}
              </div>
            </div>
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
