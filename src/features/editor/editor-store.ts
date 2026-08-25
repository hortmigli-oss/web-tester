/**
 * Editor store for managing test creation and editing
 */

import { create } from 'zustand';
import type { Test, Question } from '../../domain/quiz/types';
import { generateId } from '../../domain/quiz/validation';
import { validateQuestion } from '../../domain/quiz/validation';
import { saveTest, getTestById, deleteTest, getAllTests } from '../persistence/storage';

// ============================================================================
// STORE STATE
// ============================================================================

interface EditorState {
  // Current test being edited
  currentTest: Test | null;
  
  // List of all tests
  allTests: Test[];
  
  // Loading state
  isLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  loadTests: () => void;
  createTest: (title: string, description?: string) => void;
  loadTest: (testId: string) => void;
  saveTest: () => void;
  deleteTest: (testId: string) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (question: Question) => void;
  deleteQuestion: (questionId: string) => void;
  duplicateQuestion: (questionId: string) => void;
  moveQuestion: (questionId: string, direction: 'up' | 'down') => void;
  reorderQuestions: (questionIds: string[]) => void;
  clearError: () => void;
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const useEditorStore = create<EditorState>((set, get) => ({
  currentTest: null,
  allTests: [],
  isLoading: false,
  error: null,
  
  loadTests: () => {
    set({ isLoading: true, error: null });
    try {
      const tests = getAllTests();
      set({ allTests: tests, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load tests',
        isLoading: false 
      });
    }
  },
  
  createTest: (title: string, description?: string) => {
    const newTest: Test = {
      id: generateId(),
      version: 1,
      title,
      description: description?.trim() || undefined,
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    saveTest(newTest);
    
    set(state => ({
      currentTest: newTest,
      allTests: [...state.allTests, newTest],
      error: null,
    }));
  },
  
  loadTest: (testId: string) => {
    const test = getTestById(testId);
    if (test) {
      set({ currentTest: test, error: null });
    } else {
      set({ error: 'Тест не найден' });
    }
  },
  
  saveTest: () => {
    const { currentTest } = get();
    if (!currentTest) return;
    
    try {
      const updatedTest = {
        ...currentTest,
        updatedAt: new Date().toISOString(),
      };
      saveTest(updatedTest);
      set({ currentTest: updatedTest, error: null });
      
      // Update in allTests list
      set(state => ({
        allTests: state.allTests.map(t => t.id === updatedTest.id ? updatedTest : t),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save test' });
    }
  },
  
  deleteTest: (testId: string) => {
    try {
      deleteTest(testId);
      set(state => ({
        currentTest: state.currentTest?.id === testId ? null : state.currentTest,
        allTests: state.allTests.filter(t => t.id !== testId),
        error: null,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete test' });
    }
  },
  
  addQuestion: (question: Question) => {
    set(state => {
      if (!state.currentTest) return state;
      
      const validationErrors = validateQuestion(question);
      if (validationErrors.length > 0) {
        return {
          ...state,
          error: `Ошибка валидации: ${validationErrors.join(', ')}`,
        };
      }
      
      const updatedTest = {
        ...state.currentTest,
        questions: [...state.currentTest.questions, question],
        updatedAt: new Date().toISOString(),
      };
      
      return {
        currentTest: updatedTest,
        error: null,
      };
    });
  },
  
  updateQuestion: (question: Question) => {
    set(state => {
      if (!state.currentTest) return state;
      
      const validationErrors = validateQuestion(question);
      if (validationErrors.length > 0) {
        return {
          ...state,
          error: `Ошибка валидации: ${validationErrors.join(', ')}`,
        };
      }
      
      const updatedTest = {
        ...state.currentTest,
        questions: state.currentTest.questions.map(q => 
          q.id === question.id ? question : q
        ),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        currentTest: updatedTest,
        error: null,
      };
    });
  },
  
  deleteQuestion: (questionId: string) => {
    set(state => {
      if (!state.currentTest) return state;
      
      const updatedTest = {
        ...state.currentTest,
        questions: state.currentTest.questions.filter(q => q.id !== questionId),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        currentTest: updatedTest,
        error: null,
      };
    });
  },
  
  duplicateQuestion: (questionId: string) => {
    set(state => {
      if (!state.currentTest) return state;
      
      const questionToDuplicate = state.currentTest.questions.find(q => q.id === questionId);
      if (!questionToDuplicate) return state;
      
      // Create a copy with new ID
      const duplicatedQuestion: Question = {
        ...questionToDuplicate,
        id: generateId(),
        text: `${questionToDuplicate.text} (копия)`,
      } as Question;
      
      const questionIndex = state.currentTest.questions.findIndex(q => q.id === questionId);
      const newQuestions = [...state.currentTest.questions];
      newQuestions.splice(questionIndex + 1, 0, duplicatedQuestion);
      
      const updatedTest = {
        ...state.currentTest,
        questions: newQuestions,
        updatedAt: new Date().toISOString(),
      };
      
      return {
        currentTest: updatedTest,
        error: null,
      };
    });
  },
  
  moveQuestion: (questionId: string, direction: 'up' | 'down') => {
    set(state => {
      if (!state.currentTest) return state;
      
      const questions = [...state.currentTest.questions];
      const index = questions.findIndex(q => q.id === questionId);
      
      if (index === -1) return state;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex < 0 || newIndex >= questions.length) return state;
      
      // Swap questions
      [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
      
      const updatedTest = {
        ...state.currentTest,
        questions,
        updatedAt: new Date().toISOString(),
      };
      
      return {
        currentTest: updatedTest,
        error: null,
      };
    });
  },
  
  reorderQuestions: (questionIds: string[]) => {
    set(state => {
      if (!state.currentTest) return state;
      
      const questionsMap = new Map(state.currentTest.questions.map(q => [q.id, q]));
      const reorderedQuestions: Question[] = [];
      
      for (const id of questionIds) {
        const question = questionsMap.get(id);
        if (question) {
          reorderedQuestions.push(question);
        }
      }
      
      const updatedTest = {
        ...state.currentTest,
        questions: reorderedQuestions,
        updatedAt: new Date().toISOString(),
      };
      
      return {
        currentTest: updatedTest,
        error: null,
      };
    });
  },
  
  clearError: () => {
    set({ error: null });
  },
}));

// ============================================================================
// COMPUTED SELECTORS
// ============================================================================

export const useEditorQuestions = () => {
  const currentTest = useEditorStore(state => state.currentTest);
  return currentTest?.questions ?? [];
};

export const useEditorCanSave = () => {
  const currentTest = useEditorStore(state => state.currentTest);
  if (!currentTest) return false;
  if (!currentTest.title.trim()) return false;
  if (currentTest.questions.length === 0) return false;
  return true;
};
