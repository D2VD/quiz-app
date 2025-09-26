import { supabase } from '@/lib/supabaseClient';
import { SubmissionPayload } from '@/types';

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
