import { UserProfile, Class, Test, Submission, Question, QuestionType, Option } from '../types';
import { UserRole } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid'; // A small utility to generate UUIDs on the client

// --- Gemini AI Service (via Cloudflare Function) ---
const generateQuestions = async (topic: string, numQuestions: number, questionTypes: QuestionType[]): Promise<Omit<Question, 'id'|'test_id'>[]> => {
    // We now call our own backend function deployed on Cloudflare
    const response = await fetch('/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, numQuestions, questionTypes })
    });
    if (!response.ok) {
        throw new Error('Failed to generate questions from AI service.');
    }
    const data = await response.json();
    return data.questions;
};

export const api = {
  // --- User & Auth ---
  register: async (fullName: string, email: string, pass: string, role: UserRole): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          role,
        }
      }
    });
    if (error) throw error;
  },
  
  login: async (email: string, pass: string): Promise<void> => {
     const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
     if (error) throw error;
  },

  getUserProfile: async (userId: string): Promise<{ fullName: string, role: UserRole } | null> => {
    const { data, error } = await supabase.from('profiles').select('full_name, role').eq('id', userId).single();
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return { fullName: data.full_name, role: data.role as UserRole };
  },

  // --- Classes ---
  getClassesForTeacher: async (teacherId: string): Promise<Class[]> => {
    const { data, error } = await supabase.from('classes').select('*').eq('teacher_id', teacherId);
    if (error) throw error;
    // FIX: Map snake_case from DB to camelCase in app
    return data.map(c => ({...c, teacherId: c.teacher_id, inviteCode: c.invite_code}));
  },

  createClass: async (className: string, teacherId: string): Promise<Class> => {
    const inviteCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const { data, error } = await supabase.from('classes').insert({ name: className, teacher_id: teacherId, invite_code: inviteCode }).select().single();
    if (error) throw error;
    // FIX: Map snake_case from DB to camelCase in app
    return {...data, teacherId: data.teacher_id, inviteCode: data.invite_code};
  },

  joinClass: async(inviteCode: string, studentId: string): Promise<void> => {
    const { data: targetClass, error: findError } = await supabase.from('classes').select('id').eq('invite_code', inviteCode.toUpperCase()).single();
    if (findError || !targetClass) throw new Error("Mã mời không hợp lệ.");
    
    const { error: insertError } = await supabase.from('enrollments').insert({ class_id: targetClass.id, student_id: studentId });
    if (insertError) {
        if (insertError.code === '23505') { // unique constraint violation
            throw new Error("Bạn đã ở trong lớp học này.");
        }
        throw insertError;
    }
  },

  // --- Tests ---
  getTestsForClass: async (classId: string): Promise<Omit<Test, 'questions'>[]> => {
    const { data, error } = await supabase.from('tests').select('*').eq('class_id', classId);
    if (error) throw error;
    // FIX: Map snake_case from DB to camelCase in app
    return data.map(t => ({ ...t, startTime: new Date(t.start_time), classId: t.class_id }));
  },

  getTestsForStudent: async (studentId: string): Promise<Omit<Test, 'questions'>[]> => {
    const { data: enrollments, error: enrollError } = await supabase.from('enrollments').select('class_id').eq('student_id', studentId);
    if (enrollError) throw enrollError;
    const classIds = enrollments.map(e => e.class_id);
    if (classIds.length === 0) return [];

    const { data, error } = await supabase.from('tests').select('*').in('class_id', classIds);
    if (error) throw error;
    // FIX: Map snake_case from DB to camelCase in app
    return data.map(t => ({ ...t, startTime: new Date(t.start_time), classId: t.class_id }));
  },
  
  getTestById: async (testId: string): Promise<Test | undefined> => {
    const { data, error } = await supabase.from('tests').select('*, questions(*)').eq('id', testId).single();
    if (error) throw error;
    // FIX: Map snake_case from DB to camelCase in app
    const questions = data.questions.map((q: any) => ({ ...q, correctOptionId: q.correct_option_id }));
    return { ...data, startTime: new Date(data.start_time), classId: data.class_id, questions };
  },

  createTest: async(testData: Omit<Test, 'id'>): Promise<Test> => {
    // FIX: Map camelCase from app to snake_case for DB
    const { questions, classId, startTime, ...restOfTest } = testData;
    const testToInsert = { ...restOfTest, class_id: classId, start_time: startTime.toISOString() };
    
    const { data: newTest, error: testError } = await supabase.from('tests').insert(testToInsert).select().single();
    if (testError) throw testError;

    const questionsToInsert = questions.map(q => ({ ...q, test_id: newTest.id, id: uuidv4(), correct_option_id: q.correctOptionId }));
    const { error: questionsError } = await supabase.from('questions').insert(questionsToInsert);
    if (questionsError) throw questionsError;

    // FIX: Map snake_case from DB to camelCase in app
    return { ...newTest, startTime: new Date(newTest.start_time), classId: newTest.class_id, questions };
  },

  updateTest: async(testId: string, testData: Partial<Test>): Promise<Test> => {
      // FIX: Map camelCase from app to snake_case for DB
      const { questions, classId, startTime, ...restOfTest } = testData;
      const testToUpdate: any = { ...restOfTest };
      if (classId) testToUpdate.class_id = classId;
      if (startTime) testToUpdate.start_time = startTime.toISOString();

      const { data: updatedTest, error: testError } = await supabase.from('tests').update(testToUpdate).eq('id', testId).select().single();
      if (testError) throw testError;

      // Simple strategy: delete all old questions and insert new ones
      await supabase.from('questions').delete().eq('test_id', testId);
      if (questions && questions.length > 0) {
        const questionsToInsert = questions.map(q => ({ ...q, test_id: testId, id: q.id || uuidv4(), correct_option_id: q.correctOptionId }));
        const { error: questionsError } = await supabase.from('questions').insert(questionsToInsert);
        if (questionsError) throw questionsError;
      }
      
      const finalTest = await api.getTestById(testId);
      if (!finalTest) throw new Error("Could not refetch test after update.");
      return finalTest;
  },

  deleteTest: async(testId: string): Promise<void> => {
      const { error } = await supabase.from('tests').delete().eq('id', testId);
      if (error) throw error;
  },

  // --- Submissions ---
  getSubmissionsForStudent: async(studentId: string): Promise<Submission[]> => {
    const { data, error } = await supabase.from('submissions').select('*').eq('student_id', studentId);
    if (error) throw error;
    // FIX: Map snake_case from DB to camelCase in app
    return data.map(s => ({ ...s, submittedAt: new Date(s.submitted_at), testId: s.test_id, studentId: s.student_id }));
  },
  
  submitTest: async (testId: string, studentId: string, answers: Record<string, string>): Promise<Submission> => {
    const test = await api.getTestById(testId);
    if (!test) throw new Error("Test not found");
    
    const mcQuestions = test.questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
    let score = 0;
    mcQuestions.forEach(q => {
        if (q.correctOptionId === answers[q.id]) {
            score++;
        }
    });
    const finalScore = mcQuestions.length > 0 ? (score / mcQuestions.length) * 100 : 100;

    const submissionToInsert = {
        test_id: testId,
        student_id: studentId,
        score: finalScore,
        answers,
    };
    const { data, error } = await supabase.from('submissions').insert(submissionToInsert).select().single();
    if (error) throw error;
    
    // FIX: Map snake_case from DB to camelCase in app
    return { ...data, submittedAt: new Date(data.submitted_at), testId: data.test_id, studentId: data.student_id };
  },

  getSubmissionForTest: async (studentId: string, testId: string): Promise<Submission | undefined> => {
      const { data, error } = await supabase.from('submissions').select('*').eq('student_id', studentId).eq('test_id', testId).single();
      if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found, which is a valid case
        throw error;
      }
      // FIX: Map snake_case from DB to camelCase in app
      return data ? { ...data, submittedAt: new Date(data.submitted_at), testId: data.test_id, studentId: data.student_id } : undefined;
  },
  
  getTestSubmissions: async(testId: string): Promise<Submission[]> => {
      const { data, error } = await supabase.from('submissions').select('*').eq('test_id', testId);
      if (error) throw error;
      // FIX: Map snake_case from DB to camelCase in app
      return data.map(s => ({ ...s, submittedAt: new Date(s.submitted_at), testId: s.test_id, studentId: s.student_id }));
  },

  generateQuestions,
};
