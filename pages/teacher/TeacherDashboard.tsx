import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
// FIX: Import Omit<Test,..> compatible type
import { Class, Test } from '../../types';
import Spinner from '../../components/Spinner';
import { PlusCircle, Edit, Trash } from '../../components/icons';

// FIX: The dashboard only fetches test summaries, not the full test object with questions.
interface ClassWithTests extends Class {
  tests: Omit<Test, 'questions'>[];
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassWithTests[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeacherData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedClasses = await api.getClassesForTeacher(user.id);
      const classesWithTests = await Promise.all(
        fetchedClasses.map(async (c) => {
          const tests = await api.getTestsForClass(c.id);
          return { ...c, tests };
        })
      );
      setClasses(classesWithTests);
    } catch (error) {
      console.error("Failed to fetch teacher data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  const handleDeleteTest = async (testId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bài thi này không? Mọi dữ liệu liên quan sẽ bị mất.')) {
      try {
        await api.deleteTest(testId);
        await fetchTeacherData(); // Refresh data
      } catch (error) {
        console.error("Failed to delete test:", error);
        alert('Xóa bài thi thất bại.');
      }
    }
  };


  if (loading) {
    return <div className="flex justify-center pt-20"><Spinner /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Giáo viên</h1>
        <Link
          to="/teacher/create-class"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusCircle className="w-5 h-5 mr-2 -ml-1" />
          Tạo lớp học mới
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">Bạn chưa có lớp học nào.</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Hãy bắt đầu bằng việc tạo một lớp học mới.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {classes.map((c) => (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{c.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Mã mời: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{c.inviteCode}</span>
                  </p>
                </div>
                <Link
                  to={`/teacher/create-test/${c.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusCircle className="w-5 h-5 mr-2 -ml-1" />
                  Tạo bài thi
                </Link>
              </div>
              
              {c.tests.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {c.tests.map(test => (
                    <li key={test.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{test.title}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Bắt đầu: {new Date(test.startTime).toLocaleString('vi-VN')} | Thời gian: {test.duration} phút
                              </p>
                          </div>
                          <div className="flex items-center gap-4">
                              <Link to={`/teacher/edit-test/${test.id}`} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-gray-600 dark:hover:text-white">
                                  <Edit className="h-5 w-5"/>
                              </Link>
                              <button onClick={() => handleDeleteTest(test.id)} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">
                                  <Trash className="h-5 w-5"/>
                              </button>
                          </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-6 text-center text-gray-500 dark:text-gray-400">Chưa có bài thi nào trong lớp này.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
