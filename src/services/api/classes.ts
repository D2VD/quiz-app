import type { PostgrestError } from '@supabase/supabase-js';

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

const generateInviteCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

/** Type guard để phân biệt PostgrestError */
const isPostgrestError = (error: unknown): error is PostgrestError =>
  Boolean(error && typeof error === 'object' && 'code' in error);

/** Chuẩn hoá thông điệp lỗi khi tạo lớp */
const formatCreateClassError = (error?: PostgrestError | null) => {
  if (!error) {
    return 'Không thể tạo lớp học.';
  }

  if (error.code === '23505') {
    if (error.message?.includes('classes_invite_code_key')) {
      return 'Không thể sinh mã mời duy nhất cho lớp học. Vui lòng thử lại.';
    }
    if (error.message?.includes('classes_teacher_id_name_key')) {
      return 'Bạn đã có lớp học khác với tên này.';
    }
  }

  if (error.code === '23503') {
    return 'Không tìm thấy tài khoản giáo viên hợp lệ. Vui lòng đăng nhập lại.';
  }

  if (error.code === '42501') {
    return 'Tài khoản hiện không có quyền tạo lớp học. Kiểm tra lại policy Supabase cho bảng classes.';
  }

  // Trường hợp policy đệ quy
  if (error.message?.includes('infinite recursion detected in policy')) {
    return 'Cấu hình bảo mật của lớp học đang gặp lỗi. Vui lòng liên hệ quản trị viên để kiểm tra lại policy Supabase.';
  }

  return error.message || 'Không thể tạo lớp học.';
};

export async function createClass(name: string, teacherId: string) {
  const MAX_ATTEMPTS = 5;
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    const inviteCode = generateInviteCode();

    // Thử trả về bản ghi ngay sau khi insert
    const { data, error } = await supabase
      .from('classes')
      .insert([
        {
          name,
          teacher_id: teacherId,
          invite_code: inviteCode,
        },
      ])
      .select('*')
      .maybeSingle();

    // Thành công và có data => trả về luôn
    if (!error && data) {
      return mapClass(data);
    }

    // Nếu insert OK nhưng do policy/returning không trả data, thử tra lại
    if (!error && !data) {
      try {
        const classes = await listClassesForTeacher(teacherId);
        const created = classes.find(
          (klass) => klass.inviteCode === inviteCode && klass.name === name
        );
        if (created) return created;

        throw new Error(
          'Lớp học đã được tạo nhưng chưa thể hiển thị ngay. Vui lòng tải lại trang để xem lớp mới.'
        );
      } catch (lookupError) {
        if (isPostgrestError(lookupError)) {
          throw new Error(formatCreateClassError(lookupError));
        }
        throw lookupError instanceof Error
          ? lookupError
          : new Error('Không thể tải lớp học vừa tạo.');
      }
    }

    // Trùng mã mời -> thử lại sinh mã khác
    if (error?.code === '23505' && error.message?.includes('classes_invite_code_key')) {
      attempt += 1;
      continue;
    }

    // Các lỗi khác
    throw new Error(formatCreateClassError(error ?? null));
  }

  throw new Error('Không thể tạo lớp học do trùng mã mời. Vui lòng thử lại sau.');
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
