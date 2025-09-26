import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Question, QuestionType, Option, Test } from '../../types';
import Spinner from '../../components/Spinner';
import { Trash, PlusCircle, Sparkles } from '../../components/icons';

const TestEditor: React.FC = () => {
    const { testId, classId } = useParams<{ testId?: string; classId?: string }>();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(60);
    const [startTime, setStartTime] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    // FIX: Add state to store the classId for both creating and editing tests.
    const [testClassId, setTestClassId] = useState<string | undefined>(classId);
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiNumQuestions, setAiNumQuestions] = useState(5);

    const isEditing = !!testId;

    useEffect(() => {
        if (isEditing) {
            api.getTestById(testId)
                .then(data => {
                    if (data) {
                        setTitle(data.title);
                        setDuration(data.duration);
                        // Format for datetime-local input
                        const d = new Date(data.startTime);
                        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                        setStartTime(d.toISOString().slice(0, 16));
                        setQuestions(data.questions);
                        // FIX: Store the classId from the fetched test data when editing.
                        setTestClassId(data.classId);
                    } else {
                        setError("Không tìm thấy bài thi.");
                    }
                })
                .catch(() => setError("Lỗi khi tải bài thi."))
                .finally(() => setLoading(false));
        } else {
            const defaultStartTime = new Date();
            defaultStartTime.setMinutes(defaultStartTime.getMinutes() + 10 - defaultStartTime.getTimezoneOffset());
            setStartTime(defaultStartTime.toISOString().slice(0, 16));
            setLoading(false);
        }
    }, [testId, isEditing]);

    const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions];
        (newQuestions[qIndex] as any)[field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options) {
            newQuestions[qIndex].options![optIndex].text = value;
            setQuestions(newQuestions);
        }
    };
    
    const setCorrectOption = (qIndex: number, optionId: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correctOptionId = optionId;
        setQuestions(newQuestions);
    }
    
    const addOption = (qIndex: number) => {
        const newQuestions = [...questions];
        const newOption: Option = { id: crypto.randomUUID(), text: '' };
        if (newQuestions[qIndex].options) {
            newQuestions[qIndex].options!.push(newOption);
        } else {
            newQuestions[qIndex].options = [newOption];
        }
        setQuestions(newQuestions);
    };

    const removeOption = (qIndex: number, optIndex: number) => {
        const newQuestions = [...questions];
        const removedOptionId = newQuestions[qIndex].options?.[optIndex].id;
        newQuestions[qIndex].options?.splice(optIndex, 1);
        // If the removed option was the correct one, unset it
        if (newQuestions[qIndex].correctOptionId === removedOptionId) {
            newQuestions[qIndex].correctOptionId = undefined;
        }
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        // FIX: Create a question object that conforms to the Question type (test_id is now optional).
        const newQuestion: Question = { id: crypto.randomUUID(), text: '', type: QuestionType.MULTIPLE_CHOICE, options: [{id: crypto.randomUUID(), text:''}], correctOptionId: undefined };
        setQuestions([
            ...questions,
            newQuestion,
        ]);
    };

    const removeQuestion = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(qIndex, 1);
        setQuestions(newQuestions);
    };

    const handleGenerateQuestions = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiTopic || aiNumQuestions <= 0) return;
        setIsGenerating(true);
        setError('');
        try {
            const generated = await api.generateQuestions(aiTopic, aiNumQuestions, [QuestionType.MULTIPLE_CHOICE, QuestionType.ESSAY]);
            // FIX: Ensure generated questions conform to the Question type.
            const newQuestions: Question[] = generated.map(q => ({...q, id: crypto.randomUUID()}));
            setQuestions(prev => [...prev, ...newQuestions]);
            setAiTopic('');
        } catch (err) {
            setError('Không thể tạo câu hỏi. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        
        // FIX: The original code incorrectly tried to access a mock database variable.
        // This now correctly uses the classId from state, which is populated
        // from URL parameters for new tests or from fetched data for edited tests.
        // It also ensures a classId is present before attempting to save.
        if (!testClassId) {
            setError("Không tìm thấy mã lớp học để lưu bài thi.");
            setIsSaving(false);
            return;
        }

        const testData = {
            title,
            duration,
            startTime: new Date(startTime),
            questions,
            classId: testClassId,
        };

        try {
            if (isEditing && testId) {
                await api.updateTest(testId, testData);
            } else {
                // FIX: Ensure the created object matches the expected type for new tests.
                await api.createTest(testData);
            }
            navigate('/teacher');
        } catch (err) {
            setError('Lưu bài thi thất bại.');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    if (error && !isGenerating) return <div className="text-center text-red-500">{error}</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* AI Generator */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4 border border-indigo-300 dark:border-indigo-700">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-indigo-500" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Tạo câu hỏi bằng AI</h3>
                </div>
                 {error && isGenerating && <p className="text-red-500 text-sm text-center">{error}</p>}
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="ai-topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chủ đề</label>
                        <input type="text" id="ai-topic" value={aiTopic} onChange={e => setAiTopic(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="Ví dụ: Lịch sử Việt Nam giai đoạn 1945-1975"/>
                    </div>
                    <div>
                        <label htmlFor="ai-num" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số lượng</label>
                        <input type="number" id="ai-num" value={aiNumQuestions} onChange={e => setAiNumQuestions(parseInt(e.target.value, 10))} className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <button type="button" onClick={handleGenerateQuestions} disabled={isGenerating} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center">
                        {isGenerating ? <><Spinner />&nbsp;Đang tạo...</> : 'Tạo nhanh'}
                    </button>
                </div>
            </div>

            {/* Test settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
                 <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Cài đặt bài thi</h3>
                 <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tiêu đề bài thi</label>
                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian làm bài (phút)</label>
                        <input type="number" id="duration" value={duration} onChange={e => setDuration(parseInt(e.target.value, 10))} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian bắt đầu</label>
                        <input type="datetime-local" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"/>
                    </div>
                </div>
            </div>
            
            {/* Questions */}
            <div className="space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">Câu hỏi {qIndex + 1}</p>
                            <button type="button" onClick={() => removeQuestion(qIndex)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><Trash className="w-5 h-5"/></button>
                        </div>
                        <div className="space-y-4">
                             <textarea value={q.text} onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)} rows={3} placeholder="Nội dung câu hỏi" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"></textarea>
                            <select value={q.type} onChange={e => handleQuestionChange(qIndex, 'type', e.target.value as QuestionType)} className="block w-full md:w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                                <option value={QuestionType.MULTIPLE_CHOICE}>Trắc nghiệm</option>
                                <option value={QuestionType.ESSAY}>Tự luận</option>
                            </select>

                            {q.type === QuestionType.MULTIPLE_CHOICE && (
                                <div className="space-y-3 pt-2">
                                    {q.options?.map((opt, optIndex) => (
                                        <div key={opt.id} className="flex items-center gap-2">
                                            <input type="radio" name={`correct-opt-${q.id}`} checked={q.correctOptionId === opt.id} onChange={() => setCorrectOption(qIndex, opt.id)} className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300" title="Chọn làm đáp án đúng" />
                                            <input type="text" value={opt.text} onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)} placeholder={`Lựa chọn ${optIndex + 1}`} className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                                            <button type="button" onClick={() => removeOption(qIndex, optIndex)} className="p-1 text-gray-500 hover:text-red-600"><Trash className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addOption(qIndex)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                        <PlusCircle className="w-4 h-4"/> Thêm lựa chọn
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button type="button" onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2">
                 <PlusCircle className="w-5 h-5"/> Thêm câu hỏi thủ công
            </button>
            
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => navigate('/teacher')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" disabled={isSaving} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400">
                    {isSaving ? 'Đang lưu...' : 'Lưu bài thi'}
                </button>
            </div>
        </form>
    );
};

export default TestEditor;
