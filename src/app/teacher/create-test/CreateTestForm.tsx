// src/app/teacher/create-test/CreateTestForm.tsx
'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
// THAY ĐỔI 1: Import từ đường dẫn mới
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type FormValues = {
  title: string;
  classId: string;
  startTime: string;
  duration: number;
  questions: {
    content: string;
    options: {
      text: string;
    }[];
    correctAnswerIndex: string;
  }[];
};

interface CreateTestFormProps {
  classes: { id: number; name: string }[];
  userId: string;
}

export default function CreateTestForm({ classes, userId }: CreateTestFormProps) {
  const router = useRouter();
  // THAY ĐỔI 2: Khởi tạo supabase client ở đây
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      questions: [{ content: '', options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }], correctAnswerIndex: '0' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      // Bước 1: Tạo đề thi (test) trong database
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert({
          title: data.title,
          class_id: parseInt(data.classId, 10),
          start_time: new Date(data.startTime).toISOString(),
          duration_minutes: data.duration,
        })
        .select()
        .single();

      if (testError) throw testError;
      if (!testData) throw new Error('Không thể tạo đề thi.');

      const testId = testData.id;

      // Bước 2: Chuẩn bị dữ liệu câu hỏi và đáp án
      for (const questionItem of data.questions) {
        // Chèn câu hỏi
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert({
            test_id: testId,
            content: questionItem.content,
            type: 'multiple_choice',
          })
          .select()
          .single();
        
        if (questionError) throw questionError;
        if (!questionData) throw new Error('Không thể tạo câu hỏi.');

        const questionId = questionData.id;

        // Chèn các đáp án
        const optionsToInsert = questionItem.options.map((option, index) => ({
          question_id: questionId,
          content: option.text,
          is_correct: index === parseInt(questionItem.correctAnswerIndex, 10),
        }));

        const { error: optionsError } = await supabase.from('options').insert(optionsToInsert);
        if (optionsError) throw optionsError;
      }

      // Hoàn tất, chuyển về trang dashboard
      alert('Tạo đề thi thành công!');
      router.push('/teacher');
      router.refresh();

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow-md">
      {/* Phần thông tin chung của đề thi */}
      <div className="space-y-4 border-b pb-6">
        <h2 className="text-xl font-semibold">Thông tin chung</h2>
        <div>
          <label>Tiêu đề đề thi</label>
          <input {...register('title', { required: true })} className="mt-1 block w-full input" />
        </div>
        <div>
          <label>Gán cho lớp</label>
          <select {...register('classId', { required: true })} className="mt-1 block w-full input">
            <option value="">-- Chọn lớp --</option>
            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
        </div>
        <div>
          <label>Thời gian bắt đầu</label>
          <input type="datetime-local" {...register('startTime', { required: true })} className="mt-1 block w-full input" />
        </div>
        <div>
          <label>Thời gian làm bài (phút)</label>
          <input type="number" {...register('duration', { required: true, valueAsNumber: true, min: 1 })} className="mt-1 block w-full input" />
        </div>
      </div>

      {/* Phần câu hỏi */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Danh sách câu hỏi</h2>
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-md mb-4 relative">
            <h3 className="font-bold mb-2">Câu hỏi {index + 1}</h3>
            <textarea {...register(`questions.${index}.content`, { required: true })} placeholder="Nội dung câu hỏi" className="w-full input mb-2" />
            
            <div className="space-y-2">
              {field.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <input type="radio" value={optionIndex} {...register(`questions.${index}.correctAnswerIndex`, { required: true })} />
                  <input {...register(`questions.${index}.options.${optionIndex}.text`, { required: true })} placeholder={`Đáp án ${optionIndex + 1}`} className="w-full input" />
                </div>
              ))}
            </div>

            <button type="button" onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">Xóa câu</button>
          </div>
        ))}
        <button type="button" onClick={() => append({ content: '', options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }], correctAnswerIndex: '0' })} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Thêm câu hỏi
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-md font-bold hover:bg-indigo-700">
        Lưu Đề Thi
      </button>
    </form>
  );
}