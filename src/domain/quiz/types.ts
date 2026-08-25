/**
 * Domain types for the Quiz application
 * This file contains all core domain entities and type definitions
 */

// ============================================================================
// QUESTION TYPES
// ============================================================================

/** Base interface for all answer options */
export interface AnswerOption {
  id: string;
  text: string;
}

/** Single choice question - user selects exactly one option */
export interface SingleChoiceQuestion {
  id: string;
  type: 'single';
  text: string;
  options: AnswerOption[];
  correctAnswer: string[]; // Array with exactly one option ID
  explanation?: string;
}

/** Multiple choice question - user can select multiple options */
export interface MultipleChoiceQuestion {
  id: string;
  type: 'multiple';
  text: string;
  options: AnswerOption[];
  correctAnswer: string[]; // Array with one or more option IDs
  explanation?: string;
}

/** Text question - user types a text answer */
export interface TextQuestion {
  id: string;
  type: 'text';
  text: string;
  correctAnswers: string[]; // Array of acceptable answers
  explanation?: string;
}

/** Order question - user must arrange items in correct order */
export interface OrderQuestion {
  id: string;
  type: 'order';
  text: string;
  items: AnswerOption[]; // Items to be ordered
  correctOrder: string[]; // Correct sequence of item IDs
  explanation?: string;
}

/** Discriminated union of all question types */
export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TextQuestion
  | OrderQuestion;

// ============================================================================
// TEST ENTITY
// ============================================================================

export interface Test {
  id: string;
  version: number;
  title: string;
  description?: string;
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// QUIZ ATTEMPT (Progress tracking)
// ============================================================================

export type QuizMode = 'practice' | 'exam';

export type QuizStatus = 'in-progress' | 'completed';

/** User's answer to a specific question */
export interface UserAnswer {
  questionId: string;
  value: unknown; // Type will be narrowed based on question type
}

/** Typed user answers for better type safety */
export interface SingleUserAnswer extends UserAnswer {
  questionId: string;
  value: string | null; // Selected option ID or null
}

export interface MultipleUserAnswer extends UserAnswer {
  questionId: string;
  value: string[]; // Array of selected option IDs
}

export interface TextUserAnswer extends UserAnswer {
  questionId: string;
  value: string; // User's text input
}

export interface OrderUserAnswer extends UserAnswer {
  questionId: string;
  value: string[]; // User's ordering of item IDs
}

/** Quiz attempt represents a user's progress through a test */
export interface QuizAttempt {
  id: string;
  testId: string;
  mode: QuizMode;
  currentQuestionIndex: number;
  answers: UserAnswer[];
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  status: QuizStatus;
}

// ============================================================================
// ANSWER CHECKING
// ============================================================================

export interface AnswerResult {
  isCorrect: boolean;
  isAnswered: boolean;
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface QuestionStatistics {
  questionId: string;
  questionType: Question['type'];
  isCorrect: boolean;
  isAnswered: boolean;
  userAnswer: unknown;
  correctAnswer: unknown;
}

export interface StatisticsByType {
  single: { total: number; correct: number };
  multiple: { total: number; correct: number };
  text: { total: number; correct: number };
  order: { total: number; correct: number };
}

export interface QuizStatistics {
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  byType: StatisticsByType;
  durationSeconds: number;
  formattedDuration?: string;
  questionDetails: QuestionStatistics[];
}

// ============================================================================
// JSON IMPORT/EXPORT SCHEMAS
// ============================================================================

export interface TestJsonV1 {
  version: 1;
  id: string;
  title: string;
  description?: string;
  questions: QuestionJsonV1[];
}

export interface QuestionJsonV1 {
  id: string;
  type: 'single' | 'multiple' | 'text' | 'order';
  text: string;
  explanation?: string;
  // Fields vary by type
  options?: AnswerOption[]; // For single and multiple
  correctAnswer?: string[]; // For single and multiple
  correctAnswers?: string[]; // For text
  items?: AnswerOption[]; // For order
  correctOrder?: string[]; // For order
}

export interface AttemptSaveJsonV1 {
  version: 1;
  attemptId: string;
  testId: string;
  mode: QuizMode;
  currentQuestionIndex: number;
  answers: UserAnswer[];
  startedAt: string;
  updatedAt: string;
  status: QuizStatus;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Extract the question type from a question */
export type QuestionType = Question['type'];

/** Get the correct answer type for a given question type */
export type CorrectAnswerFor<T extends QuestionType> =
  T extends 'single' ? string[] :
  T extends 'multiple' ? string[] :
  T extends 'text' ? string[] :
  T extends 'order' ? string[] :
  never;

/** Get the user answer type for a given question type */
export type UserAnswerFor<T extends QuestionType> =
  T extends 'single' ? string | null :
  T extends 'multiple' ? string[] :
  T extends 'text' ? string :
  T extends 'order' ? string[] :
  never;
