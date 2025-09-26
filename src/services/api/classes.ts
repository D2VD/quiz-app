import { ClassSummary } from '@/types';
import { supabase } from '@/lib/supabaseClient';

const mapClass = (row: any): ClassSummary => ({
  id: row.id,
  name: row.name,
  inviteCode: row.invite_code,
  teacherId: row.teacher_id,
  createdAt: row.created_at,
});

export async function listClassesForTeacher(teacherId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapClass);
}

export async function createClass(name: string, teacherId: string) {
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const { data, error } = await supabase
    .from('classes')
    .insert({
      name,
      teacher_id: teacherId,
      invite_code: inviteCode,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapClass(data);
}

export async function joinClass(inviteCode: string, studentId: string) {
  const code = inviteCode.trim().toUpperCase();
  const { data: klass, error: findError } = await supabase
    .from('classes')
    .select('id')
    .eq('invite_code', code)
    .maybeSingle();

  if (findError || !klass) {
    throw new Error('Mã mời không hợp lệ.');
  }

  const { error: insertError } = await supabase
    .from('enrollments')
    .insert({ class_id: klass.id, student_id: studentId });

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('Bạn đã tham gia lớp học này.');
    }
    throw insertError;
  }
}
