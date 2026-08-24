/**
 * Quiz Engine - Core business logic for quiz navigation and state management
 * This module is framework-agnostic and contains no React dependencies
 */

import type {
  Question,
  Test,
  QuizAttempt,
  UserAnswer,
  QuizMode,
} from './types';
import { checkAnswer, hasAnsweredQuestion } from './answer-checker';
import { createQuizAttempt } from './serializers';

// ============================================================================
// QUIZ NAVIGATION
// ============================================================================

/**
 * Get the current question from a quiz attempt
 */
export function getCurrentQuestion(
  test: Test,
  attempt: QuizAttempt
): Question | undefined {
  if (attempt.currentQuestionIndex < 0 || attempt.currentQuestionIndex >= test.questions.length) {
    return undefined;
  }
  return test.questions[attempt.currentQuestionIndex];
}

/**
 * Check if there's a next question
 */
export function hasNextQuestion(test: Test, attempt: QuizAttempt): boolean {
  return attempt.currentQuestionIndex < test.questions.length - 1;
}

/**
 * Check if there's a previous question
 */
export function hasPreviousQuestion(attempt: QuizAttempt): boolean {
  return attempt.currentQuestionIndex > 0;
}

/**
 * Navigate to the next question
 * Returns updated attempt or null if cannot navigate
 */
export function goToNextQuestion(
  test: Test,
  attempt: QuizAttempt
): QuizAttempt | null {
  if (!hasNextQuestion(test, attempt)) {
    return null;
  }

  return {
    ...attempt,
    currentQuestionIndex: attempt.currentQuestionIndex + 1,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Navigate to the previous question
 * Returns updated attempt or null if cannot navigate
 */
export function goToPreviousQuestion(
  attempt: QuizAttempt
): QuizAttempt | null {
  if (!hasPreviousQuestion(attempt)) {
    return null;
  }

  return {
    ...attempt,
    currentQuestionIndex: attempt.currentQuestionIndex - 1,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Navigate to a specific question by index
 * Returns updated attempt or null if index is invalid
 */
export function goToQuestion(
  test: Test,
  attempt: QuizAttempt,
  index: number
): QuizAttempt | null {
  if (index < 0 || index >= test.questions.length) {
    return null;
  }

  return {
    ...attempt,
    currentQuestionIndex: index,
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// ANSWER MANAGEMENT
// ============================================================================

/**
 * Save/update a user's answer
 * Returns updated attempt
 */
export function saveAnswer(
  attempt: QuizAttempt,
  questionId: string,
  value: unknown
): QuizAttempt {
  const existingIndex = attempt.answers.findIndex(a => a.questionId === questionId);
  
  const newAnswer: UserAnswer = { questionId, value };
  let newAnswers: UserAnswer[];

  if (existingIndex >= 0) {
    // Update existing answer
    newAnswers = [...attempt.answers];
    newAnswers[existingIndex] = newAnswer;
  } else {
    // Add new answer
    newAnswers = [...attempt.answers, newAnswer];
  }

  return {
    ...attempt,
    answers: newAnswers,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Remove an answer (for clearing responses)
 * Returns updated attempt
 */
export function removeAnswer(
  attempt: QuizAttempt,
  questionId: string
): QuizAttempt {
  const newAnswers = attempt.answers.filter(a => a.questionId !== questionId);

  return {
    ...attempt,
    answers: newAnswers,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get user's answer for a specific question
 */
export function getUserAnswer(
  attempt: QuizAttempt,
  questionId: string
): UserAnswer | undefined {
  return attempt.answers.find(a => a.questionId === questionId);
}

/**
 * Check if a question has been answered
 */
export function isQuestionAnswered(
  attempt: QuizAttempt,
  questionId: string
): boolean {
  return hasAnsweredQuestion(attempt.answers, questionId);
}

/**
 * Get count of answered questions
 */
export function getAnsweredCount(test: Test, attempt: QuizAttempt): number {
  return test.questions.filter(q => isQuestionAnswered(attempt, q.id)).length;
}

// ============================================================================
// QUIZ LIFECYCLE
// ============================================================================

/**
 * Start a new quiz attempt
 */
export function startQuiz(testId: string, mode: QuizMode): QuizAttempt {
  return createQuizAttempt(testId, mode);
}

/**
 * Complete a quiz attempt
 * Returns updated attempt with finishedAt and status
 */
export function completeQuiz(attempt: QuizAttempt): QuizAttempt {
  const now = new Date().toISOString();
  return {
    ...attempt,
    status: 'completed',
    finishedAt: now,
    updatedAt: now,
  };
}

/**
 * Check if quiz can be completed
 * (All questions answered - optional rule, can be customized)
 */
export function canCompleteQuiz(_test: Test, attempt: QuizAttempt): boolean {
  // For now, allow completion even with unanswered questions
  // Could be changed to require all questions answered
  return attempt.status === 'in-progress';
}

/**
 * Check if all questions have been answered
 */
export function areAllQuestionsAnswered(
  test: Test,
  attempt: QuizAttempt
): boolean {
  return test.questions.every(q => isQuestionAnswered(attempt, q.id));
}

/**
 * Get unanswered question count
 */
export function getUnansweredCount(
  test: Test,
  attempt: QuizAttempt
): number {
  return test.questions.filter(q => !isQuestionAnswered(attempt, q.id)).length;
}

// ============================================================================
// QUIZ STATE QUERIES
// ============================================================================

/**
 * Get progress percentage
 */
export function getProgressPercentage(
  test: Test,
  attempt: QuizAttempt
): number {
  if (test.questions.length === 0) {
    return 0;
  }
  return Math.round(((attempt.currentQuestionIndex + 1) / test.questions.length) * 100);
}

/**
 * Get question status for navigation display
 * Returns: 'current' | 'answered' | 'unanswered'
 */
export function getQuestionStatus(
  attempt: QuizAttempt,
  questionId: string,
  currentIndex: number
): 'current' | 'answered' | 'unanswered' {
  const questionIndex = currentIndex; // Caller should track this
  
  if (questionIndex === attempt.currentQuestionIndex) {
    return 'current';
  }

  if (isQuestionAnswered(attempt, questionId)) {
    return 'answered';
  }

  return 'unanswered';
}

/**
 * Get all question statuses for the quiz navigator
 */
export function getAllQuestionStatuses(
  test: Test,
  attempt: QuizAttempt
): ('current' | 'answered' | 'unanswered')[] {
  return test.questions.map((q, index) => {
    if (index === attempt.currentQuestionIndex) {
      return 'current';
    }
    if (isQuestionAnswered(attempt, q.id)) {
      return 'answered';
    }
    return 'unanswered';
  });
}

// ============================================================================
// PRACTICE MODE HELPERS
// ============================================================================

/**
 * Check if current answer is correct (for practice mode)
 * Returns null if question not answered
 */
export function checkCurrentAnswer(
  question: Question,
  attempt: QuizAttempt
): { isCorrect: boolean } | null {
  const answer = getUserAnswer(attempt, question.id);
  
  if (!answer) {
    return null;
  }

  const result = checkAnswer(question, answer);
  return { isCorrect: result.isCorrect };
}

/**
 * Get explanation for a question (if available)
 */
export function getQuestionExplanation(question: Question): string | undefined {
  return question.explanation;
}
