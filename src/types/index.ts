export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  id: string;
  fullName: string;
  role: UserRole;
}

export interface ClassSummary {
  id: string;
  name: string;
  inviteCode: string;
  teacherId: string;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export type QuestionType = 'multiple_choice' | 'short_answer';

export interface TestQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  correctOptionId?: string | null;
}

export interface TestDetail {
  id: string;
  title: string;
  classId: string;
  startTime: string;
  durationMinutes: number;
  createdAt: string;
  questions: TestQuestion[];
}

export interface TestOverview extends Omit<TestDetail, 'questions'> {
  status: 'upcoming' | 'running' | 'completed';
  submittedAt?: string | null;
  score?: number | null;
}

export interface SubmissionAnswer {
  questionId: string;
  value: string | string[] | null;
}

export interface SubmissionPayload {
  testId: string;
  answers: SubmissionAnswer[];
}

export interface SubmissionSummary {
  submittedAt: string;
  score: number | null;
}

export type RegistrationOutcome = 'created' | 'resent';
