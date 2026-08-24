/**
 * Unit tests for answer checker logic
 */

import { describe, it, expect } from 'vitest';
import {
  checkAnswer,
  checkSingleAnswer,
  checkMultipleAnswer,
  checkTextAnswer,
  checkOrderAnswer,
  hasAnsweredQuestion,
} from '../domain/quiz/answer-checker';
import type { Question, UserAnswer } from '../domain/quiz/types';

// ============================================================================
// SINGLE CHOICE TESTS
// ============================================================================

describe('Single Choice Answer Checking', () => {
  const singleQuestion: Question = {
    id: 'q1',
    type: 'single',
    text: 'What is the capital of France?',
    options: [
      { id: 'a', text: 'London' },
      { id: 'b', text: 'Paris' },
      { id: 'c', text: 'Berlin' },
    ],
    correctAnswer: ['b'],
  };

  it('should return correct for right answer', () => {
    const result = checkSingleAnswer(singleQuestion as any, 'b');
    expect(result.isCorrect).toBe(true);
    expect(result.isAnswered).toBe(true);
  });

  it('should return incorrect for wrong answer', () => {
    const result = checkSingleAnswer(singleQuestion as any, 'a');
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(true);
  });

  it('should return incorrect for no answer', () => {
    const result = checkSingleAnswer(singleQuestion as any, null);
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(false);
  });

  it('should work with checkAnswer wrapper', () => {
    const userAnswer: UserAnswer = { questionId: 'q1', value: 'b' };
    const result = checkAnswer(singleQuestion, userAnswer);
    expect(result.isCorrect).toBe(true);
  });
});

// ============================================================================
// MULTIPLE CHOICE TESTS
// ============================================================================

describe('Multiple Choice Answer Checking', () => {
  const multipleQuestion: Question = {
    id: 'q2',
    type: 'multiple',
    text: 'Which are programming languages?',
    options: [
      { id: 'a', text: 'Python' },
      { id: 'b', text: 'HTML' },
      { id: 'c', text: 'JavaScript' },
      { id: 'd', text: 'CSS' },
    ],
    correctAnswer: ['a', 'c'],
  };

  it('should return correct for exact match', () => {
    const result = checkMultipleAnswer(multipleQuestion as any, ['a', 'c']);
    expect(result.isCorrect).toBe(true);
    expect(result.isAnswered).toBe(true);
  });

  it('should return correct for different order', () => {
    const result = checkMultipleAnswer(multipleQuestion as any, ['c', 'a']);
    expect(result.isCorrect).toBe(true);
    expect(result.isAnswered).toBe(true);
  });

  it('should return incorrect for incomplete answer', () => {
    const result = checkMultipleAnswer(multipleQuestion as any, ['a']);
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(true);
  });

  it('should return incorrect for extra answer', () => {
    const result = checkMultipleAnswer(multipleQuestion as any, ['a', 'c', 'b']);
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(true);
  });

  it('should return incorrect for empty answer', () => {
    const result = checkMultipleAnswer(multipleQuestion as any, []);
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(false);
  });

  it('should work with checkAnswer wrapper', () => {
    const userAnswer: UserAnswer = { questionId: 'q2', value: ['a', 'c'] };
    const result = checkAnswer(multipleQuestion, userAnswer);
    expect(result.isCorrect).toBe(true);
  });
});

// ============================================================================
// TEXT ANSWER TESTS
// ============================================================================

describe('Text Answer Checking', () => {
  const textQuestion: Question = {
    id: 'q3',
    type: 'text',
    text: 'What is the capital of Russia?',
    correctAnswers: ['Москва', 'москва', 'Moscow', 'г. Москва'],
  };

  it('should return correct for exact match', () => {
    const result = checkTextAnswer(textQuestion as any, 'Москва');
    expect(result.isCorrect).toBe(true);
    expect(result.isAnswered).toBe(true);
  });

  it('should return correct for lowercase match', () => {
    const result = checkTextAnswer(textQuestion as any, 'москва');
    expect(result.isCorrect).toBe(true);
    expect(result.isAnswered).toBe(true);
  });

  it('should return correct for alternative answer', () => {
    const result = checkTextAnswer(textQuestion as any, 'Moscow');
    expect(result.isCorrect).toBe(true);
    expect(result.isAnswered).toBe(true);
  });

  it('should return correct with whitespace trimming', () => {
    const result = checkTextAnswer(textQuestion as any, '  Москва  ');
    expect(result.isCorrect).toBe(true);
    expect(result.isAnswered).toBe(true);
  });

  it('should return incorrect for wrong answer', () => {
    const result = checkTextAnswer(textQuestion as any, 'Санкт-Петербург');
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(true);
  });

  it('should return incorrect for empty answer', () => {
    const result = checkTextAnswer(textQuestion as any, '');
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(false);
  });

  it('should return incorrect for whitespace-only answer', () => {
    const result = checkTextAnswer(textQuestion as any, '   ');
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(false);
  });

  it('should work with checkAnswer wrapper', () => {
    const userAnswer: UserAnswer = { questionId: 'q3', value: 'Москва' };
    const result = checkAnswer(textQuestion, userAnswer);
    expect(result.isCorrect).toBe(true);
  });
});

// ============================================================================
// ORDER ANSWER TESTS
// ============================================================================

describe('Order Answer Checking', () => {
  const orderQuestion: Question = {
    id: 'q4',
    type: 'order',
    text: 'Arrange the steps in correct order',
    items: [
      { id: 'step1', text: 'Create' },
      { id: 'step2', text: 'Test' },
      { id: 'step3', text: 'Review' },
      { id: 'step4', text: 'Publish' },
    ],
    correctOrder: ['step1', 'step2', 'step3', 'step4'],
  };

  it('should return correct for exact order', () => {
    const result = checkOrderAnswer(orderQuestion as any, ['step1', 'step2', 'step3', 'step4']);
    expect(result.isCorrect).toBe(true);
    expect(result.isAnswered).toBe(true);
  });

  it('should return incorrect for wrong order', () => {
    const result = checkOrderAnswer(orderQuestion as any, ['step2', 'step1', 'step3', 'step4']);
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(true);
  });

  it('should return incorrect for partial order', () => {
    const result = checkOrderAnswer(orderQuestion as any, ['step1', 'step2']);
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(true);
  });

  it('should return incorrect for empty answer', () => {
    const result = checkOrderAnswer(orderQuestion as any, []);
    expect(result.isCorrect).toBe(false);
    expect(result.isAnswered).toBe(false);
  });

  it('should work with checkAnswer wrapper', () => {
    const userAnswer: UserAnswer = { questionId: 'q4', value: ['step1', 'step2', 'step3', 'step4'] };
    const result = checkAnswer(orderQuestion, userAnswer);
    expect(result.isCorrect).toBe(true);
  });
});

// ============================================================================
// HAS ANSWERED QUESTION TESTS
// ============================================================================

describe('hasAnsweredQuestion', () => {
  it('should return true for answered single choice', () => {
    const answers: UserAnswer[] = [{ questionId: 'q1', value: 'a' }];
    expect(hasAnsweredQuestion(answers, 'q1')).toBe(true);
  });

  it('should return false for unanswered question', () => {
    const answers: UserAnswer[] = [{ questionId: 'q1', value: 'a' }];
    expect(hasAnsweredQuestion(answers, 'q2')).toBe(false);
  });

  it('should return false for null value', () => {
    const answers: UserAnswer[] = [{ questionId: 'q1', value: null }];
    expect(hasAnsweredQuestion(answers, 'q1')).toBe(false);
  });

  it('should return false for empty array', () => {
    const answers: UserAnswer[] = [{ questionId: 'q1', value: [] }];
    expect(hasAnsweredQuestion(answers, 'q1')).toBe(false);
  });

  it('should return false for empty string', () => {
    const answers: UserAnswer[] = [{ questionId: 'q1', value: '' }];
    expect(hasAnsweredQuestion(answers, 'q1')).toBe(false);
  });

  it('should return true for non-empty array', () => {
    const answers: UserAnswer[] = [{ questionId: 'q1', value: ['a', 'b'] }];
    expect(hasAnsweredQuestion(answers, 'q1')).toBe(true);
  });

  it('should return true for non-empty string', () => {
    const answers: UserAnswer[] = [{ questionId: 'q1', value: 'answer' }];
    expect(hasAnsweredQuestion(answers, 'q1')).toBe(true);
  });
});
