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

const fetchCreatedClass = async (
  teacherId: string,
  inviteCode: string,
): Promise<ClassSummary | null> => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('invite_code', inviteCode)
    .maybeSingle();

  if (error) throw error;
  return data ? mapClass(data) : null;
};

export async function createClass(name: string, teacherId: string) {
  const MAX_ATTEMPTS = 5;
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    const inviteCode = generateInviteCode();

    const { error } = await supabase
      .from('classes')
      .insert([
        {
          name,
          teacher_id: teacherId,
          invite_code: inviteCode,
        },
      ]);

    if (!error) {
      try {
        const created = await fetchCreatedClass(teacherId, inviteCode);
        if (created) {
          return created;
        }

        const classes = await listClassesForTeacher(teacherId);
        const fromList = classes.find(
          (klass) => klass.inviteCode === inviteCode && klass.name === name,
        );

        if (fromList) {
          return fromList;
        }

        throw new Error(
          'Lớp học đã được tạo nhưng chưa thể hiển thị ngay. Vui lòng tải lại trang để xem lớp mới.',
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

export async function joinClass(inviteCode: string) {
  const { data, error } = await supabase.rpc('join_class_with_invite_code', {
    invite_code_to_join: inviteCode,
  });

  if (error) {
    console.error('Lỗi khi tham gia lớp học:', error);
    // Ném lỗi với thông báo từ Postgres để UI có thể hiển thị
    throw new Error(error.message);
  }

  return data;
}