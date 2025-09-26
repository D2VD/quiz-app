// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Nếu người dùng chưa đăng nhập và cố gắng truy cập trang được bảo vệ
  if (!session && req.nextUrl.pathname.startsWith('/teacher')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Nếu người dùng đã đăng nhập nhưng không phải giáo viên
  if (session && req.nextUrl.pathname.startsWith('/teacher')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'teacher') {
      // Không phải giáo viên, chuyển hướng về trang chủ
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/teacher/:path*'], // Áp dụng middleware cho tất cả các route bắt đầu bằng /teacher
};