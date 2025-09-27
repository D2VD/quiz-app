import { supabase } from '@/lib/supabaseClient';
import type { SubjectSummary } from '@/types';

const mapSubject = (row: any): SubjectSummary => ({
  id: row.id,
  name: row.name,
  description: row.description ?? null,
  teacherId: row.teacher_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null,
});

export async function listSubjectsForTeacher(teacherId: string) {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapSubject);
}

interface SubjectPayload {
  name: string;
  description?: string | null;
}

export async function createSubject(teacherId: string, payload: SubjectPayload) {
  const name = payload.name.trim();
  if (!name) {
    throw new Error('Tên môn học không được để trống.');
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert([
      {
        name,
        description: payload.description?.trim() || null,
        teacher_id: teacherId,
      },
    ])
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Không thể tạo môn học.');
  }

  return mapSubject(data);
}

export async function updateSubject(subjectId: string, payload: SubjectPayload) {
  const updates: Record<string, unknown> = {};

  if (typeof payload.name !== 'undefined') {
    const sanitized = payload.name.trim();
    if (!sanitized) {
      throw new Error('Tên môn học không được để trống.');
    }
    updates.name = sanitized;
  }

  if (typeof payload.description !== 'undefined') {
    updates.description = payload.description?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('Không có thay đổi nào để cập nhật.');
  }

  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', subjectId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Không tìm thấy môn học để cập nhật.');
  }

  return mapSubject(data);
}

export async function deleteSubject(subjectId: string) {
  const { error } = await supabase.from('subjects').delete().eq('id', subjectId);

  if (error) throw error;
}
