import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

const CreateClass: React.FC = () => {
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !user) return;

    setLoading(true);
    setError('');
    try {
      // FIX: user.id is now correctly typed and accessible.
      await api.createClass(className, user.id);
      navigate('/teacher');
    } catch (err) {
      setError('Không thể tạo lớp học. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Tạo lớp học mới</h1>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label htmlFor="className" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên lớp học
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="className"
              id="className"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Ví dụ: Toán cao cấp A1"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3">
            <button
                type="button"
                onClick={() => navigate('/teacher')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-600"
            >
                Hủy
            </button>
            <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
                {loading ? 'Đang tạo...' : 'Tạo lớp'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClass;
