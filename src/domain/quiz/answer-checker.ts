/**
 * Answer checker - core business logic for validating user answers
 * This module is framework-agnostic and contains no React dependencies
 */

import type {
  Question,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  TextQuestion,
  OrderQuestion,
  UserAnswer,
  AnswerResult,
} from './types';

// ============================================================================
// TEXT NORMALIZATION
// ============================================================================

/**
 * Normalize text answer for comparison
 * Current implementation: trim whitespace and convert to lowercase
 * Extensible for future features (punctuation normalization, etc.)
 */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

// ============================================================================
// ANSWER CHECKING BY QUESTION TYPE
// ============================================================================

/**
 * Check a single choice answer
 * @param question - The single choice question
 * @param userAnswer - User's selected option ID or null
 * @returns Answer result
 */
export function checkSingleAnswer(
  question: SingleChoiceQuestion,
  userAnswer: string | null
): AnswerResult {
  const isAnswered = userAnswer !== null && userAnswer !== undefined;

  if (!isAnswered) {
    return { isCorrect: false, isAnswered: false };
  }

  // Single choice has exactly one correct answer
  const correctAnswer = question.correctAnswer[0];
  const isCorrect = userAnswer === correctAnswer;

  return { isCorrect, isAnswered: true };
}

/**
 * Check a multiple choice answer
 * @param question - The multiple choice question
 * @param userAnswer - Array of selected option IDs
 * @returns Answer result
 */
export function checkMultipleAnswer(
  question: MultipleChoiceQuestion,
  userAnswer: string[]
): AnswerResult {
  const isAnswered = userAnswer !== null && userAnswer !== undefined && userAnswer.length > 0;

  if (!isAnswered) {
    return { isCorrect: false, isAnswered: false };
  }

  // For multiple choice, all correct options must be selected and no extras
  const correctSet = new Set(question.correctAnswer);
  const userSet = new Set(userAnswer);

  // Check if sets are equal (same elements, order doesn't matter)
  if (correctSet.size !== userSet.size) {
    return { isCorrect: false, isAnswered: true };
  }

  const isCorrect = question.correctAnswer.every(id => userSet.has(id));

  return { isCorrect, isAnswered: true };
}

/**
 * Check a text answer
 * @param question - The text question
 * @param userAnswer - User's text input
 * @returns Answer result
 */
export function checkTextAnswer(
  question: TextQuestion,
  userAnswer: string
): AnswerResult {
  const isAnswered = userAnswer !== null && userAnswer !== undefined && userAnswer.trim() !== '';

  if (!isAnswered) {
    return { isCorrect: false, isAnswered: false };
  }

  const normalizedUserAnswer = normalizeText(userAnswer);

  // Check if user answer matches any of the acceptable answers
  const isCorrect = question.correctAnswers.some(correctAnswer =>
    normalizeText(correctAnswer) === normalizedUserAnswer
  );

  return { isCorrect, isAnswered: true };
}

/**
 * Check an order answer
 * @param question - The order question
 * @param userAnswer - Array of item IDs in user's order
 * @returns Answer result
 */
export function checkOrderAnswer(
  question: OrderQuestion,
  userAnswer: string[]
): AnswerResult {
  const isAnswered = userAnswer !== null && userAnswer !== undefined && userAnswer.length > 0;

  if (!isAnswered) {
    return { isCorrect: false, isAnswered: false };
  }

  // Check if arrays are equal (same order)
  if (userAnswer.length !== question.correctOrder.length) {
    return { isCorrect: false, isAnswered: true };
  }

  const isCorrect = question.correctOrder.every((id, index) => userAnswer[index] === id);

  return { isCorrect, isAnswered: true };
}

// ============================================================================
// MAIN ANSWER CHECKING FUNCTION
// ============================================================================

/**
 * Check a user's answer against a question
 * This is the main entry point for answer validation
 *
 * @param question - The question to check against
 * @param userAnswer - The user's answer
 * @returns AnswerResult with isCorrect and isAnswered flags
 */
export function checkAnswer(question: Question, userAnswer: UserAnswer): AnswerResult {
  // Extract the value from the user answer
  const value = userAnswer.value;

  switch (question.type) {
    case 'single': {
      const answerValue = value as string | null;
      return checkSingleAnswer(question, answerValue);
    }

    case 'multiple': {
      const answerValue = value as string[];
      return checkMultipleAnswer(question, answerValue);
    }

    case 'text': {
      const answerValue = value as string;
      return checkTextAnswer(question, answerValue);
    }

    case 'order': {
      const answerValue = value as string[];
      return checkOrderAnswer(question, answerValue);
    }

    default:
      // This should never happen with proper typing
      return { isCorrect: false, isAnswered: false };
  }
}

/**
 * Check if a question has been answered by the user
 *
 * @param answers - Array of user answers
 * @param questionId - The ID of the question to check
 * @returns true if the question has an answer
 */
export function hasAnsweredQuestion(answers: UserAnswer[], questionId: string): boolean {
  const answer = answers.find(a => a.questionId === questionId);

  if (!answer) {
    return false;
  }

  const value = answer.value;

  // Check based on value type
  if (value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  return false;
}

/**
 * Get the user's answer for a specific question
 *
 * @param answers - Array of user answers
 * @param questionId - The ID of the question
 * @returns The user's answer value or undefined if not answered
 */
export function getUserAnswerForQuestion<T>(
  answers: UserAnswer[],
  questionId: string
): T | undefined {
  const answer = answers.find(a => a.questionId === questionId);
  return answer ? (answer.value as T) : undefined;
}
