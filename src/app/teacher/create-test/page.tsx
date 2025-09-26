// src/app/teacher/create-test/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CreateTestForm from './CreateTestForm';

async function getClasses(userId: string) {
  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', userId);
  
  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
  return data;
}

export default async function CreateTestPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const classes = await getClasses(session.user.id);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Tạo Đề thi mới</h1>
      <CreateTestForm classes={classes} userId={session.user.id} />
    </div>
  );
}