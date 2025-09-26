import { ClassSummary } from '@/types';
import { supabase } from '@/lib/supabaseClient';

const mapClass = (row: any): ClassSummary => ({
  id: row.id,
  name: row.name,
  inviteCode: row.invite_code,
  teacherId: row.teacher_id,
  createdAt: row.created_at,
});

const generateInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export async function listClassesForTeacher(teacherId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapClass);
}

export async function createClass(name: string) {
  const sanitizedName = name.trim();
  if (!sanitizedName) {
    throw new Error('Tên lớp học không được để trống.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCode();
    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: sanitizedName,
        teacher_id: user.id,
        invite_code: inviteCode,
      })
      .select('*')
      .single();

    if (!error && data) {
      return mapClass(data);
    }

    if (error?.code === '23505') {
      // Invite code trùng, thử lại với mã mới
      continue;
    }

    if (error?.code === '42501') {
      throw new Error('Bạn chưa có quyền tạo lớp học. Vui lòng liên hệ quản trị viên để được gán vai trò giáo viên.');
    }

    throw new Error(error?.message || 'Không thể tạo lớp học.');
  }

  throw new Error('Không thể tạo lớp học. Vui lòng thử lại.');
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
