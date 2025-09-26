// src/components/Header.tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server'; // import không đổi
import LogoutButton from './LogoutButton';

export default async function Header() {
  // THAY ĐỔI: Không cần truyền cookies() vào nữa
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">
          QuizApp
        </Link>
        <div className="flex items-center gap-4">
          {session ? (
            <>
              {/* Hiển thị email của người dùng đã đăng nhập */}
              <span className="text-sm hidden sm:block">{session.user.email}</span>
              {/* Nút Đăng xuất là một Client Component để xử lý sự kiện click */}
              <LogoutButton />
            </>
          ) : (
            <>
              {/* Nếu chưa đăng nhập, hiển thị nút Đăng nhập */}
              <Link
                href="/login"
                className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}