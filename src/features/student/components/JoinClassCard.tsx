import { FormEvent, useState } from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { ClassApi } from '@/services/api';

export const JoinClassCard: React.FC<{ onJoined?: () => void }> = ({ onJoined }) => {
  const { profile } = useAuth();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    setLoading(true);
    setStatus(null);
    try {
      await ClassApi.joinClass(code, profile.id);
      setStatus('Tham gia lớp thành công!');
      setCode('');
      onJoined?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không thể tham gia lớp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Tham gia lớp học</h2>
      <p className="mt-1 text-sm text-slate-500">Nhập mã mời do giáo viên cung cấp để tham gia lớp học.</p>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <input
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase tracking-[0.3em] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Mã mời"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Đang xử lý...' : 'Tham gia'}
        </button>
      </form>
      {status && <p className="mt-3 text-sm text-indigo-600">{status}</p>}
    </div>
  );
};
