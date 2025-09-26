import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => (
  <div className="mx-auto max-w-2xl space-y-6 text-center">
    <h1 className="text-4xl font-semibold text-slate-900">404 - Không tìm thấy trang</h1>
    <p className="text-sm text-slate-500">
      Trang bạn truy cập không tồn tại hoặc đã bị di chuyển.
    </p>
    <Link
      to="/"
      className="inline-flex rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
    >
      Quay về trang chủ
    </Link>
  </div>
);
