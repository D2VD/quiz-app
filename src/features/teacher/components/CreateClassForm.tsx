import { FormEvent, useState } from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { ClassApi } from '@/services/api';
import type { ClassSummary } from '@/types';

interface Props {
  onCreated: (klass: ClassSummary) => void;
}

export const CreateClassForm: React.FC<Props> = ({ onCreated }) => {
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher';
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isTeacher) {
      setError('Tài khoản của bạn chưa được cấp quyền giáo viên.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const klass = await ClassApi.createClass(name);
      setName('');
      onCreated(klass);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo lớp học.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Tạo lớp học mới</h2>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Tên lớp học"
        />
        <button
          type="submit"
          disabled={loading || !isTeacher}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Đang tạo...' : 'Tạo lớp'}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </div>
  );
};
