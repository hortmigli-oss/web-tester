/**
 * Validation utilities for questions and tests
 */

import type { Question, Test, AnswerOption, SingleChoiceQuestion, MultipleChoiceQuestion, TextQuestion, OrderQuestion } from './types';

// ============================================================================
// ID GENERATION
// ============================================================================

/** Generate a unique ID */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Generate an ID for answer options */
export function generateOptionId(): string {
  return `opt_${generateId().slice(0, 8)}`;
}

// ============================================================================
// QUESTION VALIDATION
// ============================================================================

/** Validate that an array of options has unique IDs */
export function validateUniqueOptionIds(options: AnswerOption[]): boolean {
  const ids = options.map(o => o.id);
  const uniqueIds = new Set(ids);
  return ids.length === uniqueIds.size;
}

/** Validate a single choice question */
export function validateSingleQuestion(question: SingleChoiceQuestion): string[] {
  const errors: string[] = [];

  if (!question.text || question.text.trim() === '') {
    errors.push('Текст вопроса обязателен');
  }

  if (question.options.length < 2) {
    errors.push('Минимум 2 варианта ответа required');
  }

  if (!validateUniqueOptionIds(question.options)) {
    errors.push('ID вариантов должны быть уникальными');
  }

  if (question.correctAnswer.length !== 1) {
    errors.push('Должен быть выбран ровно один правильный ответ');
  }

  const correctId = question.correctAnswer[0];
  if (correctId && !question.options.some(o => o.id === correctId)) {
    errors.push('Правильный ответ должен существовать среди вариантов');
  }

  return errors;
}

/** Validate a multiple choice question */
export function validateMultipleQuestion(question: MultipleChoiceQuestion): string[] {
  const errors: string[] = [];

  if (!question.text || question.text.trim() === '') {
    errors.push('Текст вопроса обязателен');
  }

  if (question.options.length < 2) {
    errors.push('Минимум 2 варианта ответа required');
  }

  if (!validateUniqueOptionIds(question.options)) {
    errors.push('ID вариантов должны быть уникальными');
  }

  if (question.correctAnswer.length < 1) {
    errors.push('Должен быть выбран хотя бы один правильный ответ');
  }

  // Check all correct answers exist in options
  for (const correctId of question.correctAnswer) {
    if (!question.options.some(o => o.id === correctId)) {
      errors.push('Все правильные ответы должны существовать среди вариантов');
      break;
    }
  }

  return errors;
}

/** Validate a text question */
export function validateTextQuestion(question: TextQuestion): string[] {
  const errors: string[] = [];

  if (!question.text || question.text.trim() === '') {
    errors.push('Текст вопроса обязателен');
  }

  if (question.correctAnswers.length < 1) {
    errors.push('Должен быть указан хотя бы один правильный вариант ответа');
  }

  if (question.correctAnswers.some(a => a.trim() === '')) {
    errors.push('Правильные ответы не могут быть пустыми');
  }

  return errors;
}

/** Validate an order question */
export function validateOrderQuestion(question: OrderQuestion): string[] {
  const errors: string[] = [];

  if (!question.text || question.text.trim() === '') {
    errors.push('Текст вопроса обязателен');
  }

  if (question.items.length < 2) {
    errors.push('Минимум 2 элемента для упорядочивания');
  }

  if (!validateUniqueOptionIds(question.items)) {
    errors.push('ID элементов должны быть уникальными');
  }

  if (question.correctOrder.length !== question.items.length) {
    errors.push('Правильный порядок должен содержать все элементы');
  }

  // Check all items in correctOrder exist
  for (const itemId of question.correctOrder) {
    if (!question.items.some(i => i.id === itemId)) {
      errors.push('Правильный порядок содержит несуществующие элементы');
      break;
    }
  }

  return errors;
}

/** Validate any question based on its type */
export function validateQuestion(question: Question): string[] {
  switch (question.type) {
    case 'single':
      return validateSingleQuestion(question);
    case 'multiple':
      return validateMultipleQuestion(question);
    case 'text':
      return validateTextQuestion(question);
    case 'order':
      return validateOrderQuestion(question);
    default:
      return ['Неизвестный тип вопроса'];
  }
}

/** Check if a question is valid */
export function isQuestionValid(question: Question): boolean {
  return validateQuestion(question).length === 0;
}

// ============================================================================
// TEST VALIDATION
// ============================================================================

/** Validate a test */
export function validateTest(test: Test): string[] {
  const errors: string[] = [];

  if (!test.title || test.title.trim() === '') {
    errors.push('Название теста обязательно');
  }

  if (!test.id) {
    errors.push('ID теста обязателен');
  }

  if (test.questions.length === 0) {
    errors.push('Тест должен содержать хотя бы один вопрос');
  }

  // Validate unique question IDs
  const questionIds = test.questions.map(q => q.id);
  const uniqueQuestionIds = new Set(questionIds);
  if (questionIds.length !== uniqueQuestionIds.size) {
    errors.push('ID вопросов должны быть уникальными');
  }

  // Validate each question
  for (const question of test.questions) {
    const questionErrors = validateQuestion(question);
    if (questionErrors.length > 0) {
      errors.push(`Вопрос "${question.id}": ${questionErrors.join(', ')}`);
    }
  }

  return errors;
}

/** Check if a test is valid */
export function isTestValid(test: Test): boolean {
  return validateTest(test).length === 0;
}
