/**
 * Serialization and deserialization for JSON import/export
 * This module handles converting between internal types and JSON format
 */

import type {
  Test,
  Question,
  TestJsonV1,
  QuestionJsonV1,
  AnswerOption,
  QuizAttempt,
  AttemptSaveJsonV1,
} from './types';
import { generateId } from './validation';

// ============================================================================
// CONSTANTS
// ============================================================================

const CURRENT_TEST_VERSION = 1;
const CURRENT_ATTEMPT_VERSION = 1;

// ============================================================================
// TEST SERIALIZATION (EXPORT)
// ============================================================================

/**
 * Convert a Test to JSON format for export
 */
export function serializeTestToJson(test: Test): TestJsonV1 {
  return {
    version: CURRENT_TEST_VERSION,
    id: test.id,
    title: test.title,
    description: test.description,
    questions: test.questions.map(serializeQuestionToJson),
  };
}

/**
 * Convert a Question to JSON format for export
 */
function serializeQuestionToJson(question: Question): QuestionJsonV1 {
  const base: Omit<QuestionJsonV1, 'options' | 'correctAnswer' | 'correctAnswers' | 'items' | 'correctOrder'> = {
    id: question.id,
    type: question.type,
    text: question.text,
    explanation: question.explanation,
  };

  switch (question.type) {
    case 'single':
    case 'multiple':
      return {
        ...base,
        options: question.options,
        correctAnswer: question.correctAnswer,
      };
    case 'text':
      return {
        ...base,
        correctAnswers: question.correctAnswers,
      };
    case 'order':
      return {
        ...base,
        items: question.items,
        correctOrder: question.correctOrder,
      };
    default:
      throw new Error(`Unknown question type: ${(question as Question).type}`);
  }
}

/**
 * Convert a Test to JSON string for download
 */
export function testToJsonString(test: Test): string {
  const json = serializeTestToJson(test);
  return JSON.stringify(json, null, 2);
}

// ============================================================================
// TEST DESERIALIZATION (IMPORT)
// ============================================================================

/**
 * Parse and validate imported test JSON
 * Returns errors array if validation fails
 */
export interface ImportResult {
  success: boolean;
  test?: Test;
  errors?: string[];
}

/**
 * Parse JSON string and convert to Test
 */
export function deserializeTestFromJson(jsonString: string): ImportResult {
  try {
    const data = JSON.parse(jsonString);
    return validateAndConvertTestJson(data);
  } catch (error) {
    return {
      success: false,
      errors: [`Не удалось распарсить JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Validate and convert parsed JSON to Test
 */
function validateAndConvertTestJson(data: unknown): ImportResult {
  const errors: string[] = [];

  // Basic type check
  if (!data || typeof data !== 'object') {
    return { success: false, errors: ['JSON должен быть объектом'] };
  }

  const obj = data as Record<string, unknown>;

  // Check version
  if (obj.version !== 1) {
    return {
      success: false,
      errors: [`Неподдерживаемая версия: ${obj.version}. Поддерживается версия 1.`],
    };
  }

  // Check required fields
  if (typeof obj.id !== 'string') {
    errors.push('Поле "id" должно быть строкой');
  }

  if (typeof obj.title !== 'string' || obj.title.trim() === '') {
    errors.push('Поле "title" должно быть непустой строкой');
  }

  if (!Array.isArray(obj.questions)) {
    errors.push('Поле "questions" должно быть массивом');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Convert questions
  const questions: Question[] = [];
  const questionErrors: string[] = [];

  for (let i = 0; i < (obj.questions as unknown[]).length; i++) {
    const questionJson = (obj.questions as unknown[])[i];
    const result = validateAndConvertQuestionJson(questionJson, i);

    if (!result.success) {
      questionErrors.push(...(result.errors || []));
    } else if (result.question) {
      questions.push(result.question);
    }
  }

  if (questionErrors.length > 0) {
    return { success: false, errors: questionErrors };
  }

  // Build the test
  const test: Test = {
    id: obj.id as string,
    version: CURRENT_TEST_VERSION,
    title: obj.title as string,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    questions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { success: true, test };
}

/**
 * Validate and convert a single question JSON
 */
function validateAndConvertQuestionJson(
  data: unknown,
  index: number
): { success: boolean; question?: Question; errors?: string[] } {
  const errors: string[] = [];
  const prefix = `Вопрос #${index + 1}: `;

  if (!data || typeof data !== 'object') {
    return { success: false, errors: [`${prefix}должен быть объектом`] };
  }

  const obj = data as Record<string, unknown>;

  // Check type
  const validTypes = ['single', 'multiple', 'text', 'order'];
  if (typeof obj.type !== 'string' || !validTypes.includes(obj.type)) {
    return {
      success: false,
      errors: [`${prefix}неверный тип "${obj.type}". Допустимые: ${validTypes.join(', ')}`],
    };
  }

  const type = obj.type as 'single' | 'multiple' | 'text' | 'order';

  // Check id
  if (typeof obj.id !== 'string') {
    errors.push(`${prefix}поле "id" должно быть строкой`);
  }

  // Check text
  if (typeof obj.text !== 'string' || obj.text.trim() === '') {
    errors.push(`${prefix}поле "text" должно быть непустой строкой`);
  }

  // Type-specific validation
  if (type === 'single' || type === 'multiple') {
    return validateChoiceQuestion(obj, type, index);
  }

  if (type === 'text') {
    return validateTextQuestion(obj, index);
  }

  if (type === 'order') {
    return validateOrderQuestion(obj, index);
  }

  return { success: false, errors: [`${prefix}неизвестный тип вопроса`] };
}

/**
 * Validate single/multiple choice question JSON
 */
function validateChoiceQuestion(
  obj: Record<string, unknown>,
  type: 'single' | 'multiple',
  index: number
): { success: boolean; question?: Question; errors?: string[] } {
  const errors: string[] = [];
  const prefix = `Вопрос #${index + 1}: `;

  // Check options
  if (!Array.isArray(obj.options)) {
    return { success: false, errors: [`${prefix}поле "options" должно быть массивом`] };
  }

  const options: AnswerOption[] = [];
  const optionIds = new Set<string>();

  for (let i = 0; i < obj.options.length; i++) {
    const opt = obj.options[i];
    if (!opt || typeof opt !== 'object') {
      errors.push(`${prefix}вариант #${i + 1} должен быть объектом`);
      continue;
    }

    const optionObj = opt as Record<string, unknown>;

    if (typeof optionObj.id !== 'string') {
      errors.push(`${prefix}вариант #${i + 1}: поле "id" должно быть строкой`);
    } else {
      if (optionIds.has(optionObj.id)) {
        errors.push(`${prefix}дублирующийся ID варианта: ${optionObj.id}`);
      }
      optionIds.add(optionObj.id);
    }

    if (typeof optionObj.text !== 'string') {
      errors.push(`${prefix}вариант #${i + 1}: поле "text" должно быть строкой`);
    }

    options.push({
      id: optionObj.id as string,
      text: optionObj.text as string,
    });
  }

  // Check correctAnswer
  if (!Array.isArray(obj.correctAnswer)) {
    return { success: false, errors: [`${prefix}поле "correctAnswer" должно быть массивом`] };
  }

  const correctAnswer = obj.correctAnswer as string[];

  if (type === 'single' && correctAnswer.length !== 1) {
    errors.push(`${prefix}для одиночного выбора должен быть ровно один правильный ответ`);
  }

  if (type === 'multiple' && correctAnswer.length < 1) {
    errors.push(`${prefix}для множественного выбора должен быть хотя бы один правильный ответ`);
  }

  // Verify correct answers exist in options
  for (const correctId of correctAnswer) {
    if (!options.some(o => o.id === correctId)) {
      errors.push(`${prefix}правильный ответ "${correctId}" не существует в вариантах`);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const question: Question = {
    id: obj.id as string,
    type,
    text: obj.text as string,
    options,
    correctAnswer,
    explanation: typeof obj.explanation === 'string' ? obj.explanation : undefined,
  };

  return { success: true, question };
}

/**
 * Validate text question JSON
 */
function validateTextQuestion(
  obj: Record<string, unknown>,
  index: number
): { success: boolean; question?: Question; errors?: string[] } {
  const errors: string[] = [];
  const prefix = `Вопрос #${index + 1}: `;

  // Check correctAnswers
  if (!Array.isArray(obj.correctAnswers)) {
    return { success: false, errors: [`${prefix}поле "correctAnswers" должно быть массивом`] };
  }

  const correctAnswers = obj.correctAnswers as string[];

  if (correctAnswers.length < 1) {
    errors.push(`${prefix}должен быть хотя бы один правильный вариант ответа`);
  }

  for (const answer of correctAnswers) {
    if (typeof answer !== 'string' || answer.trim() === '') {
      errors.push(`${prefix}правильные ответы должны быть непустыми строками`);
      break;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const question: Question = {
    id: obj.id as string,
    type: 'text',
    text: obj.text as string,
    correctAnswers,
    explanation: typeof obj.explanation === 'string' ? obj.explanation : undefined,
  };

  return { success: true, question };
}

/**
 * Validate order question JSON
 */
function validateOrderQuestion(
  obj: Record<string, unknown>,
  index: number
): { success: boolean; question?: Question; errors?: string[] } {
  const errors: string[] = [];
  const prefix = `Вопрос #${index + 1}: `;

  // Check items
  if (!Array.isArray(obj.items)) {
    return { success: false, errors: [`${prefix}поле "items" должно быть массивом`] };
  }

  const items: AnswerOption[] = [];
  const itemIds = new Set<string>();

  for (let i = 0; i < obj.items.length; i++) {
    const item = obj.items[i];
    if (!item || typeof item !== 'object') {
      errors.push(`${prefix}элемент #${i + 1} должен быть объектом`);
      continue;
    }

    const itemObj = item as Record<string, unknown>;

    if (typeof itemObj.id !== 'string') {
      errors.push(`${prefix}элемент #${i + 1}: поле "id" должно быть строкой`);
    } else {
      if (itemIds.has(itemObj.id)) {
        errors.push(`${prefix}дублирующийся ID элемента: ${itemObj.id}`);
      }
      itemIds.add(itemObj.id);
    }

    if (typeof itemObj.text !== 'string') {
      errors.push(`${prefix}элемент #${i + 1}: поле "text" должно быть строкой`);
    }

    items.push({
      id: itemObj.id as string,
      text: itemObj.text as string,
    });
  }

  // Check correctOrder
  if (!Array.isArray(obj.correctOrder)) {
    return { success: false, errors: [`${prefix}поле "correctOrder" должно быть массивом`] };
  }

  const correctOrder = obj.correctOrder as string[];

  if (correctOrder.length !== items.length) {
    errors.push(`${prefix}правильный порядок должен содержать все элементы`);
  }

  // Verify all items in correctOrder exist
  for (const itemId of correctOrder) {
    if (!items.some(i => i.id === itemId)) {
      errors.push(`${prefix}элемент "${itemId}" в правильном порядке не существует`);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const question: Question = {
    id: obj.id as string,
    type: 'order',
    text: obj.text as string,
    items,
    correctOrder,
    explanation: typeof obj.explanation === 'string' ? obj.explanation : undefined,
  };

  return { success: true, question };
}

// ============================================================================
// ATTEMPT SERIALIZATION (SAVE/LOAD)
// ============================================================================

/**
 * Convert a QuizAttempt to JSON format for saving
 */
export function serializeAttemptToJson(attempt: QuizAttempt): AttemptSaveJsonV1 {
  return {
    version: CURRENT_ATTEMPT_VERSION,
    attemptId: attempt.id,
    testId: attempt.testId,
    mode: attempt.mode,
    currentQuestionIndex: attempt.currentQuestionIndex,
    answers: attempt.answers,
    startedAt: attempt.startedAt,
    updatedAt: attempt.updatedAt,
    status: attempt.status,
  };
}

/**
 * Convert a QuizAttempt to JSON string
 */
export function attemptToJsonString(attempt: QuizAttempt): string {
  const json = serializeAttemptToJson(attempt);
  return JSON.stringify(json, null, 2);
}

/**
 * Parse and validate saved attempt JSON
 */
export function deserializeAttemptFromJson(jsonString: string): { success: boolean; attempt?: QuizAttempt; errors?: string[] } {
  try {
    const data = JSON.parse(jsonString);
    return validateAndConvertAttemptJson(data);
  } catch (error) {
    return {
      success: false,
      errors: [`Не удалось распарсить JSON сохранения: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Validate and convert parsed attempt JSON
 */
function validateAndConvertAttemptJson(data: unknown): { success: boolean; attempt?: QuizAttempt; errors?: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { success: false, errors: ['JSON должен быть объектом'] };
  }

  const obj = data as Record<string, unknown>;

  // Check version
  if (obj.version !== 1) {
    return {
      success: false,
      errors: [`Неподдерживаемая версия сохранения: ${obj.version}`],
    };
  }

  // Validate required fields
  if (typeof obj.attemptId !== 'string') errors.push('Поле "attemptId" должно быть строкой');
  if (typeof obj.testId !== 'string') errors.push('Поле "testId" должно быть строкой');
  if (obj.mode !== 'practice' && obj.mode !== 'exam') errors.push('Поле "mode" должно быть "practice" или "exam"');
  if (typeof obj.currentQuestionIndex !== 'number') errors.push('Поле "currentQuestionIndex" должно быть числом');
  if (!Array.isArray(obj.answers)) errors.push('Поле "answers" должно быть массивом');
  if (typeof obj.startedAt !== 'string') errors.push('Поле "startedAt" должно быть строкой');
  if (typeof obj.updatedAt !== 'string') errors.push('Поле "updatedAt" должно быть строкой');
  if (obj.status !== 'in-progress' && obj.status !== 'completed') errors.push('Поле "status" должно быть "in-progress" или "completed"');

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const attempt: QuizAttempt = {
    id: obj.attemptId as string,
    testId: obj.testId as string,
    mode: obj.mode as 'practice' | 'exam',
    currentQuestionIndex: obj.currentQuestionIndex as number,
    answers: obj.answers as { questionId: string; value: unknown }[],
    startedAt: obj.startedAt as string,
    updatedAt: obj.updatedAt as string,
    status: obj.status as 'in-progress' | 'completed',
    finishedAt: typeof obj.finishedAt === 'string' ? obj.finishedAt as string : undefined,
  };

  return { success: true, attempt };
}

/**
 * Create a new quiz attempt for a test
 */
export function createQuizAttempt(testId: string, mode: 'practice' | 'exam'): QuizAttempt {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    testId,
    mode,
    currentQuestionIndex: 0,
    answers: [],
    startedAt: now,
    updatedAt: now,
    status: 'in-progress',
  };
}
