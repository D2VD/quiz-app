// src/app/teacher/create-class/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Hàm tạo mã mời ngẫu nhiên
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function CreateClassPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const onSubmit = async (data: any) => {
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Bạn cần đăng nhập để tạo lớp.");

      const invite_code = generateInviteCode();

      const { error } = await supabase.from('classes').insert({
        name: data.className,
        teacher_id: user.id,
        invite_code: invite_code,
      });

      if (error) throw error;

      // Tạo lớp thành công, quay về dashboard
      router.push('/teacher');
      router.refresh(); // Yêu cầu server render lại trang dashboard
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-3xl font-bold mb-6">Tạo Lớp học mới</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label htmlFor="className" className="block text-sm font-medium text-gray-700">
            Tên lớp học
          </label>
          <input
            id="className"
            type="text"
            {...register('className', { required: 'Tên lớp không được để trống' })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.className && <p className="text-red-500 text-sm mt-1">{errors.className.message as string}</p>}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Tạo lớp
          </button>
        </div>
      </form>
    </div>
  );
}