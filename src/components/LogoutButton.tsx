// src/components/LogoutButton.tsx

'use client'; // Đánh dấu đây là một Client Component

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // SỬ DỤNG CLIENT MỚI CHO TRÌNH DUYỆT

export default function LogoutButton() {
  const router = useRouter();
  
  // Khởi tạo Supabase client bên trong component
  const supabase = createClient();

  // Hàm xử lý sự kiện khi người dùng nhấn nút Đăng xuất
  const handleLogout = async () => {
    // Gọi hàm signOut của Supabase để xóa session và cookie
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error logging out:', error.message);
      // Có thể hiển thị thông báo lỗi cho người dùng ở đây
    } else {
      // Sau khi đăng xuất thành công, chuyển hướng người dùng về trang đăng nhập
      router.push('/login');
      
      // Yêu cầu Next.js làm mới lại các Server Component
      // Điều này đảm bảo Header sẽ hiển thị lại nút "Đăng nhập"
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors"
    >
      Đăng xuất
    </button>
  );
}