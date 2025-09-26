// src/app/login/page.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client'; // SỬ DỤNG CLIENT MỚI
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  // Khởi tạo Supabase client bên trong component
  const supabase = createClient();

  const onSubmit = async (data: any) => {
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        // Chế độ Đăng ký
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            // Dữ liệu này sẽ được gửi tới trigger trong database
            // để tạo profile mới
            data: {
              full_name: data.fullName,
            },
          },
        });
        if (error) throw error;
        setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực (nếu đã bật).');
      } else {
        // Chế độ Đăng nhập
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;

        // Đăng nhập thành công, chuyển hướng và LÀM MỚI
        // router.refresh() là chìa khóa để giải quyết lỗi hydration
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          {isSignUp ? 'Tạo tài khoản' : 'Đăng nhập vào QuizApp'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {isSignUp && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Họ và Tên
              </label>
              <input
                id="fullName"
                type="text"
                {...register('fullName', { required: 'Họ và tên là bắt buộc' })}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Địa chỉ Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email', { required: 'Email là bắt buộc' })}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              {...register('password', { required: 'Mật khẩu là bắt buộc' })}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Đang xử lý...' : (isSignUp ? 'Đăng ký' : 'Đăng nhập')}
            </button>
          </div>
        </form>
        
        {error && <p className="text-sm text-center text-red-600">{error}</p>}
        {message && <p className="text-sm text-center text-green-600">{message}</p>}

        <p className="text-sm text-center text-gray-600">
          {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="ml-1 font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isSignUp ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
          </button>
        </p>
      </div>
    </div>
  );
}