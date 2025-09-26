import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Test, Submission, QuestionType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/Spinner';

const TestReview: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!testId || !user) {
      setError('Không thể tải dữ liệu.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [fetchedTest, fetchedSubmission] = await Promise.all([
          api.getTestById(testId),
          api.getSubmissionForTest(user.id, testId)
        ]);

        if (fetchedTest) {
          setTest(fetchedTest);
        } else {
          setError('Không tìm thấy bài thi.');
        }

        if (fetchedSubmission) {
          setSubmission(fetchedSubmission);
        } else {
          setError('Không tìm thấy bài làm của bạn.');
        }

      } catch (err) {
        setError('Lỗi khi tải dữ liệu xem lại bài thi.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testId, user]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!test || !submission) {
    return <div className="text-center text-gray-500">Không có dữ liệu để hiển thị.</div>;
  }

  const getOptionStyling = (optionId: string, correctOptionId?: string | null, userAnswerId?: string) => {
    const isCorrect = optionId === correctOptionId;
    const isSelected = optionId === userAnswerId;

    if (isCorrect) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/50 dark:border-green-700 ring-2 ring-green-500';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/50 dark:border-red-700 ring-2 ring-red-500';
    }
    return 'border-gray-200 dark:border-gray-700';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{test.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Đã nộp vào: {new Date(submission.submittedAt).toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="text-center">
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Điểm số</p>
            <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{submission.score.toFixed(2)}</p>
        </div>
      </div>

      {test.questions.map((q, index) => {
        const userAnswer = submission.answers[q.id];
        return (
          <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <p className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">{index + 1}. {q.text}</p>
            
            {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
              <div className="space-y-3">
                {q.options.map(opt => (
                  <div key={opt.id} className={`p-3 rounded-lg border ${getOptionStyling(opt.id, q.correctOptionId, userAnswer)}`}>
                    <span className="ml-3 text-gray-700 dark:text-gray-300">{opt.text}</span>
                  </div>
                ))}
              </div>
            )}

            {q.type === QuestionType.ESSAY && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Câu trả lời của bạn:</p>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{userAnswer || 'Bạn không trả lời câu này.'}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="text-center pt-4">
          <Link to="/" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Quay về Dashboard
          </Link>
      </div>
    </div>
  );
};

export default TestReview;
