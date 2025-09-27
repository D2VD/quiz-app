import { supabase } from '@/lib/supabaseClient';
import { TestDetail, TestOverview, TestQuestion } from '@/types';

// --- CÁC HÀM VÀ KIỂU DỮ LIỆU KHÔNG THAY ĐỔI ---

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

const mapTestOverview = (row: any): TestOverview => ({
  id: row.id,
  title: row.title,
  classId: row.class_id,
  startTime: row.start_time,
  durationMinutes: row.duration,
  createdAt: row.created_at,
  status: 'upcoming',
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
    .select('id, title, start_time, duration, created_at, class_id')
    .eq('class_id', classId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapTestOverview(row));
}

interface CreateTestPayload {
  title: string;
  classId: string;
  startTime: string;
  durationMinutes: number;
  questions: Omit<TestQuestion, 'id'>[];
}

// --- BẮT ĐẦU PHẦN CHỈNH SỬA ---

export async function createTest(payload: CreateTestPayload) {
  const { questions, classId, startTime, durationMinutes, title } = payload;

  // Chuyển đổi mảng câu hỏi từ camelCase (frontend) sang snake_case (database)
  // để khớp với định dạng JSON mà hàm RPC mong đợi.
  const formattedQuestionsForRpc = questions.map((q) => ({
    text: q.text,
    type: q.type,
    options: q.options ?? null,
    correct_option_id: q.correctOptionId ?? null,
  }));

  // Chuẩn bị các tham số cho lệnh gọi RPC.
  // Tên các key phải khớp chính xác với tên tham số trong hàm SQL.
  const rpcParams = {
    class_uuid: classId,
    test_title: title,
    test_start_time: startTime,
    test_duration: durationMinutes,
    questions_data: formattedQuestionsForRpc,
  };

  // Gọi hàm RPC duy nhất để thực hiện toàn bộ thao tác trong một giao dịch.
  // "Tất cả hoặc không có gì": Hoặc tạo thành công cả bài thi và câu hỏi,
  // hoặc không tạo gì cả nếu có lỗi.
  const { data: newTestId, error } = await supabase.rpc(
    'create_test_with_questions',
    rpcParams
  );

  if (error) {
    console.error('Lỗi RPC khi tạo đề thi và câu hỏi:', error);
    throw new Error(error.message || 'Không thể tạo đề thi do lỗi máy chủ.');
  }

  // Hàm RPC trả về ID của bài thi mới khi thành công.
  // Trả về ID này, khớp với hành vi của hàm gốc.
  return newTestId as string;
}

// --- KẾT THÚC PHẦN CHỈNH SỬA ---

interface UpdateTestPayload {
  title?: string;
  startTime?: string;
  durationMinutes?: number;
}

export async function updateTest(testId: string, updates: UpdateTestPayload) {
  const payload: Record<string, unknown> = {};

  if (typeof updates.title !== 'undefined') {
    payload.title = updates.title.trim();
  }
  if (typeof updates.startTime !== 'undefined') {
    payload.start_time = updates.startTime;
  }
  if (typeof updates.durationMinutes !== 'undefined') {
    payload.duration = updates.durationMinutes;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('Không có thay đổi nào để cập nhật.');
  }

  const { data, error } = await supabase
    .from('tests')
    .update(payload)
    .eq('id', testId)
    .select('id, title, class_id, start_time, duration, created_at')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Không tìm thấy bài thi để cập nhật.');
  }

  return mapTestOverview(data);
}

export async function deleteTest(testId: string) {
  const { error } = await supabase.from('tests').delete().eq('id', testId);

  if (error) throw error;
}