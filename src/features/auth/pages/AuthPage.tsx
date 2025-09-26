import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';

type FormState = {
  fullName: string;
  email: string;
  password: string;
};

const createDefaultState = (): FormState => ({
  fullName: '',
  email: '',
  password: '',
});

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState<FormState>(createDefaultState);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        const profile = await login(form.email, form.password);

        if (profile?.role === 'teacher') {
          navigate('/teacher');
        } else if (profile?.role === 'student') {
          navigate('/student');
        } else {
          navigate('/');
        }
      } else {
        const outcome = await register(form.fullName, form.email, form.password);
        setMessage(
          outcome === 'created'
            ? 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.'
            : 'Tài khoản đã tồn tại nhưng chưa xác nhận. Email xác nhận đã được gửi lại.',
        );
        setMode('login');
        setForm(createDefaultState());
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 md:flex-row">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">{mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}</h1>
        <p className="text-slate-600">
          QuizLab giúp giáo viên tạo bài thi và quản lý lớp học trong khi học sinh luyện tập và làm bài trực tuyến với trải
          nghiệm phòng chờ đếm ngược trực quan.
        </p>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6 text-indigo-700">
          <h2 className="text-lg font-semibold">Tính năng nổi bật</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm">
            <li>Tạo đề thi trắc nghiệm và tự luận nhanh chóng.</li>
            <li>Phòng chờ với đồng hồ đếm ngược theo thời gian thực.</li>
            <li>Chấm điểm tự động cho câu hỏi trắc nghiệm.</li>
            <li>Quản lý lớp học, mời học sinh và theo dõi tiến độ.</li>
          </ul>
        </div>
      </div>
      <div className="flex-1">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex rounded-lg border border-slate-200 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setMessage(null);
              }}
              className={`flex-1 rounded-md px-4 py-2 transition ${
                mode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setMessage(null);
              }}
              className={`flex-1 rounded-md px-4 py-2 transition ${
                mode === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              Đăng ký
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="fullName">
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="password">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                minLength={6}
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-indigo-600">{message}</p>}
        </div>
      </div>
    </div>
  );
};
