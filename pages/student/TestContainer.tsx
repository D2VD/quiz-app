import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Test, QuestionType } from '../../types';
import Spinner from '../../components/Spinner';
import CountdownTimer from '../../components/CountdownTimer';
import { useCountdown } from '../../hooks/useCountdown';
import { useAuth } from '../../hooks/useAuth';

// --- Waiting Room Component ---
const WaitingRoom: React.FC<{ test: Test }> = ({ test }) => {
  const navigate = useNavigate();
  const { days, hours, minutes, seconds, isFinished } = useCountdown(test.startTime);

  useEffect(() => {
    if (isFinished) {
      // Auto-navigate when timer finishes
      navigate(0); // Reload the page to transition to TestPage
    }
  }, [isFinished, navigate]);

  return (
    <div className="text-center flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white mb-4">{test.title}</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Bài thi sẽ bắt đầu sau:</p>
      <CountdownTimer days={days} hours={hours} minutes={minutes} seconds={seconds} />
    </div>
  );
};

// --- Test Page Component ---
const TestPage: React.FC<{ test: Test }> = ({ test }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const answersRef = useRef(answers);

    const testEndTime = new Date(new Date(test.startTime).getTime() + test.duration * 60 * 1000);
    const { minutes, seconds, isFinished } = useCountdown(testEndTime);
    
    useEffect(() => {
        answersRef.current = answers;
    });

    // Load answers from localStorage on mount
    useEffect(() => {
        const localStorageKey = user ? `quiz-answers-${user.id}-${test.id}` : null;
        if (localStorageKey) {
            try {
                const savedAnswersRaw = localStorage.getItem(localStorageKey);
                if (savedAnswersRaw) {
                    setAnswers(JSON.parse(savedAnswersRaw));
                }
            } catch (error) {
                console.error("Failed to load saved answers from localStorage", error);
            }
        }
    }, [user, test.id]);

    // Save answers to localStorage periodically
    useEffect(() => {
        const localStorageKey = user ? `quiz-answers-${user.id}-${test.id}` : null;
        if (!localStorageKey) return;

        const intervalId = setInterval(() => {
            if (Object.keys(answersRef.current).length > 0) {
                localStorage.setItem(localStorageKey, JSON.stringify(answersRef.current));
            }
        }, 5000); // Save every 5 seconds

        return () => clearInterval(intervalId);
    }, [user, test.id]);

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers(prev => ({...prev, [questionId]: value}));
    };
    
    const handleSubmit = useCallback(async () => {
        if(!user || isSubmitting) return;
        setIsSubmitting(true);
        const localStorageKey = user ? `quiz-answers-${user.id}-${test.id}` : null;
        try {
            await api.submitTest(test.id, user.id, answers);
            if (localStorageKey) {
                localStorage.removeItem(localStorageKey);
            }
            alert('Nộp bài thành công!');
            navigate('/');
        } catch(error) {
            console.error(error);
            alert('Có lỗi xảy ra khi nộp bài.');
            setIsSubmitting(false);
        }
    }, [user, isSubmitting, test.id, answers, navigate]);

    useEffect(() => {
        if(isFinished) {
            handleSubmit();
        }
    }, [isFinished, handleSubmit]);

    return (
        <div>
            <div className="sticky top-16 bg-white dark:bg-gray-800 py-4 shadow-md z-10 mb-8 flex justify-between items-center px-6 rounded-b-lg">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{test.title}</h1>
                <div className="flex items-center space-x-2 text-red-500 font-mono text-xl">
                    <span>{minutes.toString().padStart(2, '0')}</span>
                    <span>:</span>
                    <span>{seconds.toString().padStart(2, '0')}</span>
                </div>
            </div>
            
            <div className="space-y-8 max-w-4xl mx-auto">
                {test.questions.map((q, index) => (
                    <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <p className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">{index + 1}. {q.text}</p>
                        
                        {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                            <div className="space-y-3">
                                {q.options.map(opt => (
                                    <label key={opt.id} className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
                                        <input 
                                            type="radio" 
                                            name={q.id}
                                            value={opt.id}
                                            checked={answers[q.id] === opt.id}
                                            onChange={() => handleAnswerChange(q.id, opt.id)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <span className="ml-3 text-gray-700 dark:text-gray-300">{opt.text}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {q.type === QuestionType.ESSAY && (
                             <div>
                                <textarea
                                    rows={5}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                    placeholder="Nhập câu trả lời của bạn..."
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                ))}

                <div className="text-center pt-4">
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400">
                        {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- Container Component ---
const TestContainer: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!testId) {
      setError('Không tìm thấy mã đề thi.');
      setLoading(false);
      return;
    }
    api.getTestById(testId)
      .then(fetchedTest => {
        if (fetchedTest) {
          setTest(fetchedTest);
        } else {
          setError('Không tìm thấy đề thi.');
        }
      })
      .catch(() => setError('Lỗi khi tải đề thi.'))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  }
  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }
  if (!test) {
    return <div className="text-center text-gray-500">Không có dữ liệu đề thi.</div>;
  }

  const isTestUpcoming = new Date() < new Date(test.startTime);

  return isTestUpcoming ? <WaitingRoom test={test} /> : <TestPage test={test} />;
};

export default TestContainer;
