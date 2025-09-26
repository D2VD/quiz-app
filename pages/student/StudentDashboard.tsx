import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Test, Submission, TestStatus } from '../../types';
import Spinner from '../../components/Spinner';

// FIX: The dashboard only needs a summary of the test, not the full question list.
interface TestWithStatus extends Omit<Test, 'questions'> {
  status: TestStatus;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const fetchStudentData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedTests, submissions] = await Promise.all([
        api.getTestsForStudent(user.id),
        api.getSubmissionsForStudent(user.id),
      ]);
      const submittedTestIds = submissions.map(s => s.testId);

      const testsWithStatus: TestWithStatus[] = fetchedTests.map(test => {
        let status: TestStatus;
        if (submittedTestIds.includes(test.id)) {
          status = TestStatus.COMPLETED;
        } else if (new Date() < new Date(test.startTime)) {
          status = TestStatus.UPCOMING;
        } else {
          // Test has started and is not submitted
          let savedAnswersExist = false;
          try {
              const savedAnswersRaw = localStorage.getItem(`quiz-answers-${user.id}-${test.id}`);
              if (savedAnswersRaw) {
                  const savedAnswers = JSON.parse(savedAnswersRaw);
                  if (Object.keys(savedAnswers).length > 0) {
                      savedAnswersExist = true;
                  }
              }
          } catch (e) {
              console.error("Could not parse saved answers for test " + test.id, e);
          }

          if (savedAnswersExist) {
              status = TestStatus.IN_PROGRESS;
          } else {
              status = TestStatus.ONGOING;
          }
        }
        return { ...test, status };
      }).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      setTests(testsWithStatus);

    } catch (error) {
      console.error("Failed to fetch student data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !user) return;
    setIsJoining(true);
    setJoinError('');
    try {
      await api.joinClass(inviteCode.toUpperCase(), user.id);
      setInviteCode('');
      await fetchStudentData(); // Refresh test list
    } catch(err: any) {
      setJoinError(err.message || "Không thể tham gia lớp học.");
    } finally {
      setIsJoining(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center pt-20"><Spinner /></div>;
  }
  
  const getStatusBadgeColor = (status: TestStatus) => {
    switch(status) {
      case TestStatus.UPCOMING: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case TestStatus.ONGOING: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case TestStatus.IN_PROGRESS: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case TestStatus.COMPLETED: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Học sinh</h1>
        <form onSubmit={handleJoinClass} className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Nhập mã mời..." 
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button type="submit" disabled={isJoining} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                {isJoining ? 'Đang xử lý...' : 'Tham gia lớp'}
            </button>
            {joinError && <p className="text-red-500 text-sm">{joinError}</p>}
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {tests.length > 0 ? tests.map(test => (
            <li key={test.id}>
              <Link to={test.status === TestStatus.COMPLETED ? `/test/review/${test.id}` : `/test/${test.id}`} className="block p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{test.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Bắt đầu: {new Date(test.startTime).toLocaleString('vi-VN')} | Thời gian: {test.duration} phút
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(test.status)}`}>
                            {test.status}
                        </span>
                        {test.status === TestStatus.COMPLETED ? (
                            <span className="text-gray-500 dark:text-gray-400">Xem lại bài &rarr;</span>
                        ) : (
                            <span className="text-gray-500 dark:text-gray-400">{test.status === TestStatus.IN_PROGRESS ? 'Tiếp tục làm bài' : 'Vào thi'} &rarr;</span>
                        )}
                    </div>
                </div>
              </Link>
            </li>
          )) : (
            <li className="p-6 text-center text-gray-500 dark:text-gray-400">Bạn không có bài thi nào được giao.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default StudentDashboard;
