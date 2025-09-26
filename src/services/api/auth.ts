import { RegistrationOutcome, UserProfile, UserRole } from '@/types';
import { supabase } from '@/lib/supabaseClient';

const getRedirectUrl = () =>
  typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;

export async function register(
  fullName: string,
  email: string,
  password: string,
  role: UserRole,
): Promise<RegistrationOutcome> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectUrl(),
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Không thể tạo tài khoản.');
  }

  const user = data?.user;
  if (!user) {
    throw new Error('Không thể tạo tài khoản. Vui lòng thử lại sau.');
  }

  if ((user.identities?.length ?? 0) === 0) {
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: getRedirectUrl() },
    });

    if (resendError) {
      throw new Error(resendError.message || 'Không thể gửi lại email xác nhận.');
    }

    return 'resent';
  }

  return 'created';
}

export async function login(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message || 'Không thể đăng nhập.');
  }
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message || 'Không thể đăng xuất.');
  }
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Không thể lấy thông tin hồ sơ:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    role: data.role as UserRole,
  };
}
