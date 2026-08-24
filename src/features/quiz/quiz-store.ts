/**
 * Quiz store using Zustand
 * Manages quiz state, navigation, and persistence
 */

import { create } from 'zustand';
import type { Test, QuizAttempt, Question } from '../../domain/quiz/types';
import {
  startQuiz,
  completeQuiz,
  saveAnswer,
  goToNextQuestion,
  goToPreviousQuestion,
  goToQuestion,
  getCurrentQuestion,
  hasNextQuestion,
  hasPreviousQuestion,
  getUserAnswer,
  isQuestionAnswered,
  getAnsweredCount,
  getUnansweredCount,
} from '../../domain/quiz/quiz-engine';
import type { QuizMode } from '../../domain/quiz/types';
import { saveAttempt, deleteAttempt } from '../persistence/storage';

// ============================================================================
// STORE STATE
// ============================================================================

interface QuizState {
  // Current test being taken
  currentTest: Test | null;
  
  // Current attempt
  currentAttempt: QuizAttempt | null;
  
  // Actions
  startTest: (test: Test, mode: QuizMode) => void;
  answerQuestion: (questionId: string, value: unknown) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  finishQuiz: () => void;
  resetQuiz: () => void;
  persistProgress: () => void;
  loadAttempt: (attempt: QuizAttempt, test: Test) => void;
  
  // Computed helpers (read-only, derived from state)
  currentQuestion: Question | undefined;
  canGoNext: boolean;
  canGoPrevious: boolean;
  answeredCount: number;
  unansweredCount: number;
  isFinished: boolean;
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const useQuizStore = create<QuizState>((set, get) => ({
  currentTest: null,
  currentAttempt: null,
  
  startTest: (test: Test, mode: QuizMode) => {
    const attempt = startQuiz(test.id, mode);
    set({
      currentTest: test,
      currentAttempt: attempt,
    });
    // Auto-save initial state
    saveAttempt(attempt);
  },
  
  answerQuestion: (questionId: string, value: unknown) => {
    const { currentAttempt } = get();
    if (!currentAttempt) return;
    
    const updated = saveAnswer(currentAttempt, questionId, value);
    set({ currentAttempt: updated });
    
    // Auto-save after answering
    saveAttempt(updated);
  },
  
  nextQuestion: () => {
    const { currentAttempt, currentTest } = get();
    if (!currentAttempt || !currentTest) return;
    
    const updated = goToNextQuestion(currentTest, currentAttempt);
    if (updated) {
      set({ currentAttempt: updated });
      saveAttempt(updated);
    }
  },
  
  previousQuestion: () => {
    const { currentAttempt } = get();
    if (!currentAttempt) return;
    
    const updated = goToPreviousQuestion(currentAttempt);
    if (updated) {
      set({ currentAttempt: updated });
      saveAttempt(updated);
    }
  },
  
  jumpToQuestion: (index: number) => {
    const { currentAttempt, currentTest } = get();
    if (!currentAttempt || !currentTest) return;
    
    const updated = goToQuestion(currentTest, currentAttempt, index);
    if (updated) {
      set({ currentAttempt: updated });
      saveAttempt(updated);
    }
  },
  
  finishQuiz: () => {
    const { currentAttempt } = get();
    if (!currentAttempt) return;
    
    const completed = completeQuiz(currentAttempt);
    set({ currentAttempt: completed });
    
    // Save completed state
    saveAttempt(completed);
  },
  
  resetQuiz: () => {
    const { currentAttempt } = get();
    if (currentAttempt) {
      deleteAttempt(currentAttempt.id);
    }
    set({
      currentTest: null,
      currentAttempt: null,
    });
  },
  
  persistProgress: () => {
    const { currentAttempt } = get();
    if (currentAttempt) {
      saveAttempt(currentAttempt);
    }
  },
  
  loadAttempt: (attempt: QuizAttempt, test: Test) => {
    set({
      currentTest: test,
      currentAttempt: attempt,
    });
  },
  
  // Computed values
  get currentQuestion() {
    const { currentTest, currentAttempt } = get();
    if (!currentTest || !currentAttempt) return undefined;
    return getCurrentQuestion(currentTest, currentAttempt);
  },
  
  get canGoNext() {
    const { currentTest, currentAttempt } = get();
    if (!currentTest || !currentAttempt) return false;
    return hasNextQuestion(currentTest, currentAttempt);
  },
  
  get canGoPrevious() {
    const { currentAttempt } = get();
    if (!currentAttempt) return false;
    return hasPreviousQuestion(currentAttempt);
  },
  
  get answeredCount() {
    const { currentTest, currentAttempt } = get();
    if (!currentTest || !currentAttempt) return 0;
    return getAnsweredCount(currentTest, currentAttempt);
  },
  
  get unansweredCount() {
    const { currentTest, currentAttempt } = get();
    if (!currentTest || !currentAttempt) return 0;
    return getUnansweredCount(currentTest, currentAttempt);
  },
  
  get isFinished() {
    const { currentAttempt } = get();
    return currentAttempt?.status === 'completed';
  },
}));

// ============================================================================
// SELECTORS (for performance optimization)
// ============================================================================

export const selectCurrentQuestion = (state: QuizState) => {
  if (!state.currentTest || !state.currentAttempt) return undefined;
  return getCurrentQuestion(state.currentTest, state.currentAttempt);
};

export const selectCurrentQuestionIndex = (state: QuizState) => {
  return state.currentAttempt?.currentQuestionIndex ?? -1;
};

export const selectTotalQuestions = (state: QuizState) => {
  return state.currentTest?.questions.length ?? 0;
};

export const selectUserAnswerForQuestion = (questionId: string) => {
  return (state: QuizState) => {
    if (!state.currentAttempt) return undefined;
    return getUserAnswer(state.currentAttempt, questionId);
  };
};

export const selectIsQuestionAnswered = (questionId: string) => {
  return (state: QuizState) => {
    if (!state.currentAttempt) return false;
    return isQuestionAnswered(state.currentAttempt, questionId);
  };
};
