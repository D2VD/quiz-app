import { supabase } from '@/lib/supabaseClient';
import { TestDetail, TestOverview, TestQuestion } from '@/types';

const mapQuestion = (row: any): TestQuestion => ({
  id: row.id,
  text: row.text,
  type: row.type,
  options: row.options ?? undefined,
  correctOptionId: row.correct_option_id ?? null,
});

const mapTestDetail = (row: any): TestDetail => ({
  id: row.id,
  title: row.title,
  classId: row.class_id,
  startTime: row.start_time,
  durationMinutes: row.duration,
  createdAt: row.created_at,
  questions: (row.questions ?? []).map(mapQuestion),
});

export async function fetchTest(testId: string): Promise<TestDetail | null> {
  const { data, error } = await supabase
    .from('tests')
    .select('*, questions(*)')
    .eq('id', testId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapTestDetail(data) : null;
}

export async function listTestsForStudent(studentId: string): Promise<TestOverview[]> {
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('class_id')
    .eq('student_id', studentId);

  if (enrollmentError) throw enrollmentError;
  const classIds = (enrollments ?? []).map((enrollment) => enrollment.class_id);
  if (classIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('tests')
    .select('*, submissions(score, submitted_at)')
    .in('class_id', classIds)
    .order('start_time', { ascending: true });

  if (error) throw error;

  const now = Date.now();
  return (data ?? []).map((row) => {
    const submission = (row.submissions ?? [])[0];
    const startTimeMs = Date.parse(row.start_time);
    const endTimeMs = startTimeMs + row.duration * 60 * 1000;
    let status: TestOverview['status'] = 'upcoming';
    if (submission) {
      status = 'completed';
    } else if (now >= startTimeMs && now <= endTimeMs) {
      status = 'running';
    }

    return {
      id: row.id,
      title: row.title,
      classId: row.class_id,
      startTime: row.start_time,
      durationMinutes: row.duration,
      createdAt: row.created_at,
      status,
      submittedAt: submission?.submitted_at ?? null,
      score: submission?.score ?? null,
    } satisfies TestOverview;
  });
}

export async function listTestsForClass(classId: string) {
  const { data, error } = await supabase
    .from('tests')
    .select('id, title, start_time, duration, created_at')
    .eq('class_id', classId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    classId,
    startTime: row.start_time,
    durationMinutes: row.duration,
    createdAt: row.created_at,
    status: 'upcoming' as const,
  }));
}

interface CreateTestPayload {
  title: string;
  classId: string;
  startTime: string;
  durationMinutes: number;
  questions: Omit<TestQuestion, 'id'>[];
}

export async function createTest(payload: CreateTestPayload) {
  const { questions, classId, startTime, durationMinutes, title } = payload;
  const { data: test, error: testError } = await supabase
    .from('tests')
    .insert({
      title,
      class_id: classId,
      start_time: startTime,
      duration: durationMinutes,
    })
    .select('*')
    .single();

  if (testError) throw testError;

  if (questions.length > 0) {
    const formattedQuestions = questions.map((question) => ({
      ...question,
      test_id: test.id,
      options: question.options ?? null,
      correct_option_id: question.correctOptionId ?? null,
    }));

    const { error: questionError } = await supabase
      .from('questions')
      .insert(formattedQuestions);

    if (questionError) throw questionError;
  }

  return test.id as string;
}
