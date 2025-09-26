// src/app/teacher/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function TeacherDashboard() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Lấy danh sách lớp học của giáo viên này
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', session.user.id);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Bảng điều khiển của Giáo viên</h1>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Lớp học của tôi</h2>
          <Link href="/teacher/create-class" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Tạo lớp mới
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes && classes.length > 0 ? (
            classes.map((cls) => (
              <div key={cls.id} className="p-4 border rounded-lg shadow">
                <h3 className="text-xl font-bold">{cls.name}</h3>
                <p className="text-gray-600">Mã mời: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{cls.invite_code}</span></p>
              </div>
            ))
          ) : (
            <p>Bạn chưa tạo lớp học nào.</p>
          )}
        </div>
      </div>

      {/* Phần quản lý đề thi sẽ được thêm ở đây */}
    </div>
  );
}