import { describe, it, expect } from 'vitest';
import {
  startQuiz,
  goToNextQuestion,
  goToPreviousQuestion,
  goToQuestion,
  saveAnswer,
  completeQuiz,
  canCompleteQuiz,
} from './quiz-engine';
import type { Test, Question, QuizMode } from './types';

// Helper: Create a mock test with different question types
function createMockTest(questions: Question[]): Test {
  return {
    id: 'test-1',
    version: 1,
    title: 'Mock Test',
    questions,
  };
}

function createSingleQuestion(id: string): Question {
  return {
    id,
    type: 'single',
    text: `Question ${id}`,
    options: [
      { id: 'opt-1', text: 'Option 1' },
      { id: 'opt-2', text: 'Option 2' },
    ],
    correctAnswer: ['opt-1'],
  };
}

function createMultipleQuestion(id: string): Question {
  return {
    id,
    type: 'multiple',
    text: `Question ${id}`,
    options: [
      { id: 'opt-a', text: 'A' },
      { id: 'opt-b', text: 'B' },
      { id: 'opt-c', text: 'C' },
    ],
    correctAnswer: ['opt-a', 'opt-c'],
  };
}

function createTextQuestion(id: string): Question {
  return {
    id,
    type: 'text',
    text: `Question ${id}`,
    correctAnswers: ['answer', 'correct'],
  };
}

function createOrderQuestion(id: string): Question {
  return {
    id,
    type: 'order',
    text: `Question ${id}`,
    items: [
      { id: 'item-1', text: 'First' },
      { id: 'item-2', text: 'Second' },
      { id: 'item-3', text: 'Third' },
    ],
    correctOrder: ['item-1', 'item-2', 'item-3'],
  };
}

describe('Quiz Engine', () => {
  describe('startQuiz', () => {
    it('should create a new attempt with initial state', () => {
      const mode: QuizMode = 'practice';
      
      const attempt = startQuiz('test-1', mode);

      expect(attempt.testId).toBe('test-1');
      expect(attempt.mode).toBe(mode);
      expect(attempt.currentQuestionIndex).toBe(0);
      expect(attempt.answers).toEqual([]);
      expect(attempt.status).toBe('in-progress');
      expect(attempt.startedAt).toBeDefined();
      expect(attempt.finishedAt).toBeUndefined();
    });
  });

  describe('Navigation', () => {
    const questions: Question[] = [
      createSingleQuestion('q1'),
      createSingleQuestion('q2'),
      createSingleQuestion('q3'),
    ];
    const test = createMockTest(questions);
    
    it('should start at index 0', () => {
      const attempt = startQuiz(test.id, 'practice');
      expect(attempt.currentQuestionIndex).toBe(0);
    });

    it('should move to next question', () => {
      let attempt = startQuiz(test.id, 'practice');
      let result = goToNextQuestion(test, attempt);
      expect(result?.currentQuestionIndex).toBe(1);
      
      result = goToNextQuestion(test, result!);
      expect(result?.currentQuestionIndex).toBe(2);
    });

    it('should not go beyond the last question', () => {
      let attempt = startQuiz(test.id, 'practice');
      // Move to last
      let result = goToNextQuestion(test, attempt);
      result = goToNextQuestion(test, result!);
      expect(result?.currentQuestionIndex).toBe(2);
      
      // Try to go further
      const further = goToNextQuestion(test, result!);
      expect(further).toBe(null);
    });

    it('should move to previous question', () => {
      let attempt = startQuiz(test.id, 'practice');
      let result = goToNextQuestion(test, attempt);
      result = goToNextQuestion(test, result!);
      expect(result?.currentQuestionIndex).toBe(2);

      const prev = goToPreviousQuestion(result!);
      expect(prev?.currentQuestionIndex).toBe(1);
    });

    it('should not go below index 0', () => {
      const attempt = startQuiz(test.id, 'practice');
      const prev = goToPreviousQuestion(attempt);
      expect(prev).toBe(null);
    });

    it('should jump to specific question index', () => {
      let attempt = startQuiz(test.id, 'practice');
      let result = goToQuestion(test, attempt, 2);
      expect(result?.currentQuestionIndex).toBe(2);

      result = goToQuestion(test, result!, 0);
      expect(result?.currentQuestionIndex).toBe(0);
    });

    it('should ignore invalid indices when jumping', () => {
      let attempt = startQuiz(test.id, 'practice');
      let result = goToQuestion(test, attempt, -1);
      expect(result).toBe(null);

      result = goToQuestion(test, attempt, 100);
      expect(result).toBe(null);
    });
  });

  describe('Submit Answer', () => {
    const questions: Question[] = [
      createSingleQuestion('q1'),
      createMultipleQuestion('q2'),
      createTextQuestion('q3'),
      createOrderQuestion('q4'),
    ];
    const test = createMockTest(questions);

    it('should submit single choice answer', () => {
      let attempt = startQuiz(test.id, 'practice');
      attempt = saveAnswer(attempt, 'q1', ['opt-2']);
      
      expect(attempt.answers).toHaveLength(1);
      expect(attempt.answers[0]).toEqual({ questionId: 'q1', value: ['opt-2'] });
    });

    it('should update existing answer for the same question', () => {
      let attempt = startQuiz(test.id, 'practice');
      attempt = saveAnswer(attempt, 'q1', ['opt-1']);
      attempt = saveAnswer(attempt, 'q1', ['opt-2']);
      
      expect(attempt.answers).toHaveLength(1);
      expect(attempt.answers[0].value).toEqual(['opt-2']);
    });

    it('should submit multiple choice answer', () => {
      let attempt = startQuiz(test.id, 'practice');
      attempt = saveAnswer(attempt, 'q2', ['opt-a', 'opt-b']);
      
      expect(attempt.answers[0].value).toEqual(['opt-a', 'opt-b']);
    });

    it('should submit text answer', () => {
      let attempt = startQuiz(test.id, 'practice');
      attempt = saveAnswer(attempt, 'q3', 'My custom answer');
      
      expect(attempt.answers[0].value).toBe('My custom answer');
    });

    it('should submit order answer', () => {
      let attempt = startQuiz(test.id, 'practice');
      const shuffledOrder = ['item-3', 'item-1', 'item-2'];
      attempt = saveAnswer(attempt, 'q4', shuffledOrder);
      
      expect(attempt.answers[0].value).toEqual(shuffledOrder);
    });
  });

  describe('Finish Quiz', () => {
    const questions: Question[] = [
      createSingleQuestion('q1'),
      createSingleQuestion('q2'),
    ];
    const test = createMockTest(questions);

    it('should mark quiz as completed and set finishedAt', () => {
      let attempt = startQuiz(test.id, 'exam');
      expect(attempt.status).toBe('in-progress');
      expect(attempt.finishedAt).toBeUndefined();

      attempt = completeQuiz(attempt);

      expect(attempt.status).toBe('completed');
      expect(attempt.finishedAt).toBeDefined();
    });

    it('should not change status if already completed', () => {
      let attempt = startQuiz(test.id, 'practice');
      attempt = completeQuiz(attempt);
      const firstFinishTime = attempt.finishedAt;

      // Wait a tiny bit to ensure time would be different if updated
      // Complete again - should keep original finishedAt
      const secondAttempt = completeQuiz(attempt);
      
      expect(secondAttempt.status).toBe('completed');
      expect(secondAttempt.finishedAt).toBe(firstFinishTime); // Time shouldn't change
    });
  });

  describe('canCompleteQuiz Logic', () => {
    const questions: Question[] = [
      createSingleQuestion('q1'),
      createSingleQuestion('q2'),
      createSingleQuestion('q3'),
    ];
    const test = createMockTest(questions);

    it('should allow finishing if quiz is in progress', () => {
      let attempt = startQuiz(test.id, 'exam');
      attempt = saveAnswer(attempt, 'q1', ['opt-1']);
      attempt = saveAnswer(attempt, 'q2', ['opt-1']);
      attempt = saveAnswer(attempt, 'q3', ['opt-1']);
      
      expect(canCompleteQuiz(test, attempt)).toBe(true);
    });

    it('should not allow finishing if already completed', () => {
      let attempt = startQuiz(test.id, 'exam');
      attempt = completeQuiz(attempt);
      
      expect(canCompleteQuiz(test, attempt)).toBe(false);
    });
    
    it('should allow finishing early (not all answered)', () => {
       let attempt = startQuiz(test.id, 'exam');
       // No answers submitted
       expect(canCompleteQuiz(test, attempt)).toBe(true); // Can always force finish
    });
  });
});
