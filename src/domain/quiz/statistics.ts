/**
 * Statistics calculation for quiz results
 * This module is framework-agnostic and contains no React dependencies
 */

import type {
  Question,
  UserAnswer,
  QuizStatistics,
  QuestionStatistics,
  StatisticsByType,
} from './types';
import { checkAnswer } from './answer-checker';

/**
 * Calculate statistics for a completed quiz attempt
 *
 * @param questions - Array of all questions in the test
 * @param answers - Array of user's answers
 * @param startedAt - When the quiz was started
 * @param finishedAt - When the quiz was finished
 * @returns Complete quiz statistics
 */
export function calculateStatistics(
  questions: Question[],
  answers: UserAnswer[],
  startedAt: string,
  finishedAt: string
): QuizStatistics {
  const questionDetails: QuestionStatistics[] = [];
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let answeredQuestions = 0;

  // Initialize by-type counters
  const byType: StatisticsByType = {
    single: { total: 0, correct: 0 },
    multiple: { total: 0, correct: 0 },
    text: { total: 0, correct: 0 },
    order: { total: 0, correct: 0 },
  };

  // Process each question
  for (const question of questions) {
    const answer = answers.find(a => a.questionId === question.id);

    // Update type counters
    byType[question.type].total++;

    if (answer) {
      answeredQuestions++;
      const result = checkAnswer(question, answer);

      const detail: QuestionStatistics = {
        questionId: question.id,
        questionType: question.type,
        isCorrect: result.isCorrect,
        isAnswered: result.isAnswered,
        userAnswer: answer.value,
        correctAnswer: getCorrectAnswerValue(question),
      };

      questionDetails.push(detail);

      if (result.isCorrect) {
        correctAnswers++;
        byType[question.type].correct++;
      } else if (result.isAnswered) {
        incorrectAnswers++;
      }
    } else {
      // No answer provided
      const detail: QuestionStatistics = {
        questionId: question.id,
        questionType: question.type,
        isCorrect: false,
        isAnswered: false,
        userAnswer: undefined,
        correctAnswer: getCorrectAnswerValue(question),
      };
      questionDetails.push(detail);
    }
  }

  const unansweredQuestions = questions.length - answeredQuestions;
  const percentage = questions.length > 0
    ? Math.round((correctAnswers / questions.length) * 100)
    : 0;

  const durationSeconds = Math.floor(
    (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const formattedDuration = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    totalQuestions: questions.length,
    answeredQuestions,
    unansweredQuestions,
    correctAnswers,
    incorrectAnswers,
    percentage,
    byType,
    durationSeconds,
    formattedDuration,
    questionDetails,
  };
}

/**
 * Extract the correct answer value from a question for display purposes
 */
function getCorrectAnswerValue(question: Question): unknown {
  switch (question.type) {
    case 'single':
    case 'multiple':
      return question.correctAnswer;
    case 'text':
      return question.correctAnswers;
    case 'order':
      return question.correctOrder;
    default:
      return null;
  }
}

/**
 * Get a summary of statistics by question type
 * Useful for displaying breakdown charts or summaries
 */
export function getStatisticsByTypeSummary(byType: StatisticsByType): string[] {
  const summaries: string[] = [];

  if (byType.single.total > 0) {
    summaries.push(
      `Одиночный выбор: ${byType.single.correct}/${byType.single.total}`
    );
  }

  if (byType.multiple.total > 0) {
    summaries.push(
      `Множественный выбор: ${byType.multiple.correct}/${byType.multiple.total}`
    );
  }

  if (byType.text.total > 0) {
    summaries.push(
      `Текстовый ответ: ${byType.text.correct}/${byType.text.total}`
    );
  }

  if (byType.order.total > 0) {
    summaries.push(
      `Упорядочивание: ${byType.order.correct}/${byType.order.total}`
    );
  }

  return summaries;
}
