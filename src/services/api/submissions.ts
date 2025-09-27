import { supabase } from '@/lib/supabaseClient';
import { SubmissionPayload, SubmissionSummary } from '@/types';

export async function submitTest(payload: SubmissionPayload) {
  const { testId, answers } = payload;
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) {
    throw new Error('Bạn cần đăng nhập để nộp bài.');
  }

  const { error } = await supabase.from('submissions').insert({
    test_id: testId,
    student_id: userId,
    answers,
  });

  if (error) {
    throw new Error(error.message || 'Không thể nộp bài.');
  }
}

export async function getSubmissionForCurrentStudent(
  testId: string,
): Promise<SubmissionSummary | null> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('submissions')
    .select('submitted_at, score')
    .eq('test_id', testId)
    .eq('student_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Không thể kiểm tra trạng thái bài nộp.');
  }

  if (!data) {
    return null;
  }

  return {
    submittedAt: data.submitted_at as string,
    score: data.score ?? null,
  } satisfies SubmissionSummary;
}
