import { UserRole } from './constants';
import { User } from '@supabase/supabase-js';

export type RegistrationOutcome = 'created' | 'resent';

export interface UserProfile extends User {
  role: UserRole;
  fullName: string;
}

export interface Class {
  id: string;
  name: string;
  // FIX: Use camelCase for consistency
  teacherId: string;
  inviteCode: string;
}

export interface Option {
  id: string;
  text: string;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple-choice',
  ESSAY = 'essay',
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: Option[];
  correctOptionId?: string | null;
  // FIX: Make test_id optional for client-side question creation before test is saved.
  test_id?: string;
}

export interface Test {
  id: string;
  title: string;
  // FIX: Use camelCase for consistency
  classId: string;
  startTime: Date;
  duration: number; // in minutes
  questions: Question[];
}

export interface Submission {
  id: string;
  // FIX: Use camelCase for consistency
  testId: string;
  studentId: string;
  submittedAt: Date;
  score: number;
  answers: Record<string, string>; // questionId -> answer (optionId for MC, text for Essay)
}

export enum TestStatus {
  UPCOMING = 'Sắp diễn ra',
  ONGOING = 'Đang diễn ra',
  IN_PROGRESS = 'Đang làm bài',
  COMPLETED = 'Đã hoàn thành',
}
