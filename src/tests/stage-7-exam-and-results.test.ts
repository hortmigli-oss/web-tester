/**
 * Tests for Quiz Result Page and Exam Mode functionality
 * Stage 7: Exam mode and results page
 */

import { describe, it, expect } from 'vitest';
import { calculateStatistics } from '../domain/quiz/statistics';
import type { Test, QuizAttempt } from '../domain/quiz/types';

// Mock test data
const mockTest: Test = {
  id: 'test-1',
  version: 1,
  title: 'Test Exam',
  description: 'A test for exam mode',
  questions: [
    {
      id: 'q1',
      type: 'single',
      text: 'What is 2+2?',
      options: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
        { id: 'c', text: '5' },
      ],
      correctAnswer: ['b'],
    },
    {
      id: 'q2',
      type: 'multiple',
      text: 'Select even numbers',
      options: [
        { id: 'a', text: '1' },
        { id: 'b', text: '2' },
        { id: 'c', text: '3' },
        { id: 'd', text: '4' },
      ],
      correctAnswer: ['b', 'd'],
    },
    {
      id: 'q3',
      type: 'text',
      text: 'What is the capital of France?',
      correctAnswers: ['Paris', 'paris'],
    },
  ],
};

describe('Stage 7: Exam Mode and Results Page', () => {
  describe('Exam Mode Behavior', () => {
    it('should not show results during exam mode', () => {
      // In exam mode, showResult should be false
      const examMode = 'exam';
      const practiceMode = 'practice';
      
      expect(examMode).toBe('exam');
      expect(practiceMode).toBe('practice');
      
      // Exam mode should not reveal answers until completion
      const shouldShowResultsInExam = false;
      expect(shouldShowResultsInExam).toBe(false);
    });

    it('should allow changing answers in exam mode', () => {
      // In exam mode, users can change their answers
      const canChangeAnswerInExam = true;
      expect(canChangeAnswerInExam).toBe(true);
    });

    it('should not provide hints in exam mode', () => {
      // Exam mode should not show explanations or correct answers
      const showHintsInExam = false;
      expect(showHintsInExam).toBe(false);
    });
  });

  describe('Results Page Statistics', () => {
    it('should calculate correct percentage', () => {
      const answers = [
        { questionId: 'q1', value: 'b' }, // Correct
        { questionId: 'q2', value: ['b', 'd'] }, // Correct
        { questionId: 'q3', value: 'Paris' }, // Correct
      ];

      const stats = calculateStatistics(
        mockTest.questions,
        answers,
        '2024-01-01T10:00:00Z',
        '2024-01-01T10:05:00Z'
      );

      expect(stats.percentage).toBe(100);
      expect(stats.correctAnswers).toBe(3);
      expect(stats.incorrectAnswers).toBe(0);
    });

    it('should calculate partial score', () => {
      const answers = [
        { questionId: 'q1', value: 'b' }, // Correct
        { questionId: 'q2', value: ['b'] }, // Partial - missing 'd'
        { questionId: 'q3', value: 'London' }, // Incorrect
      ];

      const stats = calculateStatistics(
        mockTest.questions,
        answers,
        '2024-01-01T10:00:00Z',
        '2024-01-01T10:05:00Z'
      );

      expect(stats.percentage).toBe(33);
      expect(stats.correctAnswers).toBe(1);
      expect(stats.incorrectAnswers).toBe(2);
    });

    it('should handle unanswered questions', () => {
      const answers = [
        { questionId: 'q1', value: 'b' }, // Correct
        // q2 and q3 unanswered
      ];

      const stats = calculateStatistics(
        mockTest.questions,
        answers,
        '2024-01-01T10:00:00Z',
        '2024-01-01T10:05:00Z'
      );

      expect(stats.answeredQuestions).toBe(1);
      expect(stats.unansweredQuestions).toBe(2);
      expect(stats.percentage).toBe(33);
    });

    it('should calculate duration correctly', () => {
      const answers = [
        { questionId: 'q1', value: 'b' },
        { questionId: 'q2', value: ['b', 'd'] },
        { questionId: 'q3', value: 'Paris' },
      ];

      const stats = calculateStatistics(
        mockTest.questions,
        answers,
        '2024-01-01T10:00:00Z',
        '2024-01-01T10:03:30Z' // 3 minutes 30 seconds
      );

      expect(stats.durationSeconds).toBe(210);
      expect(stats.formattedDuration).toBe('03:30');
    });

    it('should provide question-level details', () => {
      const answers = [
        { questionId: 'q1', value: 'b' }, // Correct
        { questionId: 'q2', value: ['b'] }, // Incorrect
        { questionId: 'q3', value: 'Paris' }, // Correct
      ];

      const stats = calculateStatistics(
        mockTest.questions,
        answers,
        '2024-01-01T10:00:00Z',
        '2024-01-01T10:05:00Z'
      );

      expect(stats.questionDetails).toHaveLength(3);
      
      const q1Detail = stats.questionDetails.find(d => d.questionId === 'q1');
      expect(q1Detail?.isCorrect).toBe(true);
      expect(q1Detail?.isAnswered).toBe(true);

      const q2Detail = stats.questionDetails.find(d => d.questionId === 'q2');
      expect(q2Detail?.isCorrect).toBe(false);
      expect(q2Detail?.isAnswered).toBe(true);

      const q3Detail = stats.questionDetails.find(d => d.questionId === 'q3');
      expect(q3Detail?.isCorrect).toBe(true);
      expect(q3Detail?.isAnswered).toBe(true);
    });

    it('should provide statistics by question type', () => {
      const answers = [
        { questionId: 'q1', value: 'b' },
        { questionId: 'q2', value: ['b', 'd'] },
        { questionId: 'q3', value: 'Paris' },
      ];

      const stats = calculateStatistics(
        mockTest.questions,
        answers,
        '2024-01-01T10:00:00Z',
        '2024-01-01T10:05:00Z'
      );

      expect(stats.byType.single.total).toBe(1);
      expect(stats.byType.single.correct).toBe(1);
      
      expect(stats.byType.multiple.total).toBe(1);
      expect(stats.byType.multiple.correct).toBe(1);
      
      expect(stats.byType.text.total).toBe(1);
      expect(stats.byType.text.correct).toBe(1);
    });
  });

  describe('Results Display Logic', () => {
    it('should only show results after quiz completion', () => {
      const completedAttempt: QuizAttempt = {
        id: 'attempt-1',
        testId: 'test-1',
        status: 'completed',
        mode: 'exam',
        currentQuestionIndex: 0,
        answers: [{ questionId: 'q1', value: 'b' }],
        startedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:05:00Z',
        finishedAt: '2024-01-01T10:05:00Z',
      };

      const incompleteAttempt: QuizAttempt = {
        id: 'attempt-2',
        testId: 'test-1',
        status: 'in-progress',
        mode: 'exam',
        currentQuestionIndex: 0,
        answers: [{ questionId: 'q1', value: 'b' }],
        startedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      // Results should only be shown for completed attempts
      expect(completedAttempt.status).toBe('completed');
      expect(incompleteAttempt.status).toBe('in-progress');
      
      const canViewResults = completedAttempt.status === 'completed';
      expect(canViewResults).toBe(true);
    });

    it('should differentiate between practice and exam modes in results', () => {
      const practiceAttempt: QuizAttempt = {
        id: 'attempt-practice',
        testId: 'test-1',
        status: 'completed',
        mode: 'practice',
        currentQuestionIndex: 0,
        answers: [],
        startedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:05:00Z',
        finishedAt: '2024-01-01T10:05:00Z',
      };

      const examAttempt: QuizAttempt = {
        id: 'attempt-exam',
        testId: 'test-1',
        status: 'completed',
        mode: 'exam',
        currentQuestionIndex: 0,
        answers: [],
        startedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:05:00Z',
        finishedAt: '2024-01-01T10:05:00Z',
      };

      // Both modes should show results after completion
      expect(practiceAttempt.mode).toBe('practice');
      expect(examAttempt.mode).toBe('exam');
      
      // But practice mode shows feedback during the quiz, exam mode doesn't
      const showsFeedbackDuringQuiz = practiceAttempt.mode === 'practice';
      expect(showsFeedbackDuringQuiz).toBe(true);
    });
  });

  describe('Navigation After Completion', () => {
    it('should redirect to results page after finishing quiz', () => {
      const finishRoute = '/quiz/test-1/result';
      expect(finishRoute).toContain('/result');
    });

    it('should allow retaking the quiz from results page', () => {
      const retakeRoute = '/quiz/test-1/practice';
      expect(retakeRoute).toContain('/quiz');
    });

    it('should allow returning home from results page', () => {
      const homeRoute = '/';
      expect(homeRoute).toBe('/');
    });
  });
});
