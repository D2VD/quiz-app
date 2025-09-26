import { RegistrationOutcome, UserProfile, UserRole } from '@/types';
import { supabase } from '@/lib/supabaseClient';

const resolveRedirectUrl = () => {
  const configuredRedirect =
    (import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL as string | undefined) ||
    (import.meta.env.VITE_SITE_URL as string | undefined);

  if (configuredRedirect) {
    return configuredRedirect;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/login`;
  }

  return undefined;
};

const buildErrorMessage = (rawMessage: string | null | undefined) => {
  if (!rawMessage) return 'Không thể tạo tài khoản.';

  if (rawMessage.includes('redirect_to')) {
    return 'Supabase từ chối URL chuyển hướng. Hãy cập nhật Additional Redirect URLs hoặc biến `VITE_SUPABASE_AUTH_REDIRECT_URL`.';
  }

  if (rawMessage.includes('row level security') || rawMessage.includes('row-level security')) {
    return 'Supabase đang chặn trigger tạo hồ sơ. Hãy thêm policy cho service_role trong bảng profiles.';
  }

  return rawMessage;
};

export async function register(
  fullName: string,
  email: string,
  password: string,
): Promise<RegistrationOutcome> {
  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedName = fullName.trim();
  const redirectTo = resolveRedirectUrl();

  const { data, error } = await supabase.auth.signUp({
    email: sanitizedEmail,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        full_name: sanitizedName,
      },
    },
  });

  if (error) {
    throw new Error(buildErrorMessage(error.message));
  }

  const user = data?.user;
  if (!user) {
    throw new Error('Không thể tạo tài khoản. Vui lòng thử lại sau.');
  }

  const identityCount = user.identities?.length ?? 0;

  if (identityCount === 0) {
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: sanitizedEmail,
      options: { emailRedirectTo: redirectTo },
    });

    if (resendError) {
      throw new Error(buildErrorMessage(resendError.message));
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
