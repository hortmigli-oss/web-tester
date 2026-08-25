/**
 * Tests for persistence storage module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveTest,
  getAllTests,
  getTestById,
  deleteTest,
  clearAllTests,
  saveAttempt,
  getAllAttempts,
  getAttemptsForTest,
  getAttemptById,
  getInProgressAttempts,
  deleteAttempt,
  clearAllAttempts,
  getSettings,
  saveSettings,
  isStorageAvailable,
  clearAllData,
} from '../storage';
import type { Test, QuizAttempt, UserAnswer } from '../../../domain/quiz/types';

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    __resetStore__: () => {
      store = {};
    },
  };
};

let localStorageMock = createLocalStorageMock();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Persistence Storage', () => {
  beforeEach(() => {
    // Recreate mock to ensure clean state
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    vi.clearAllMocks();
  });

  // ============================================================================
  // TEST PERSISTENCE TESTS
  // ============================================================================

  describe('Test Persistence', () => {
    const mockTest: Test = {
      id: 'test-1',
      version: 1,
      title: 'Test Quiz',
      description: 'A test quiz',
      questions: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    describe('saveTest', () => {
      it('should save a new test to localStorage', () => {
        saveTest(mockTest);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'quiz-app-tests',
          JSON.stringify([mockTest])
        );
      });

      it('should update an existing test', () => {
        // First save
        saveTest(mockTest);
        localStorageMock.setItem.mockClear();

        // Update test
        const updatedTest: Test = {
          ...mockTest,
          title: 'Updated Title',
          updatedAt: '2024-01-02T00:00:00.000Z',
        };
        saveTest(updatedTest);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'quiz-app-tests',
          JSON.stringify([updatedTest])
        );
      });

      it('should throw error when localStorage fails', () => {
        localStorageMock.setItem.mockImplementationOnce(() => {
          throw new Error('Storage full');
        });

        expect(() => saveTest(mockTest)).toThrow('Не удалось сохранить тест');
      });
    });

    describe('getAllTests', () => {
      it('should return empty array when no tests exist', () => {
        const tests = getAllTests();
        expect(tests).toEqual([]);
      });

      it('should return all saved tests', () => {
        const test1: Test = { ...mockTest, id: 'test-1' };
        const test2: Test = { ...mockTest, id: 'test-2' };

        localStorageMock.getItem.mockReturnValue(
          JSON.stringify([test1, test2])
        );

        const tests = getAllTests();
        expect(tests).toHaveLength(2);
        expect(tests[0].id).toBe('test-1');
        expect(tests[1].id).toBe('test-2');
      });

      it('should return empty array on parse error', () => {
        localStorageMock.getItem.mockReturnValue('invalid json');

        const tests = getAllTests();
        expect(tests).toEqual([]);
      });
    });

    describe('getTestById', () => {
      it('should return test by ID', () => {
        localStorageMock.getItem.mockReturnValue(
          JSON.stringify([mockTest])
        );

        const result = getTestById('test-1');
        expect(result).toEqual(mockTest);
      });

      it('should return undefined if test not found', () => {
        localStorageMock.getItem.mockReturnValue(
          JSON.stringify([mockTest])
        );

        const result = getTestById('non-existent');
        expect(result).toBeUndefined();
      });
    });

    describe('deleteTest', () => {
      it('should delete test and associated attempts', () => {
        localStorageMock.getItem.mockImplementation((key: string) => {
          if (key === 'quiz-app-tests') {
            return JSON.stringify([mockTest]);
          }
          if (key === 'quiz-app-attempts') {
            return JSON.stringify([
              { id: 'attempt-1', testId: 'test-1', status: 'completed' },
              { id: 'attempt-2', testId: 'other-test', status: 'completed' },
            ]);
          }
          return null;
        });

        deleteTest('test-1');

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'quiz-app-tests',
          JSON.stringify([])
        );

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'quiz-app-attempts',
          JSON.stringify([
            { id: 'attempt-2', testId: 'other-test', status: 'completed' },
          ])
        );
      });

      it('should throw error when deletion fails', () => {
        localStorageMock.setItem.mockImplementationOnce(() => {
          throw new Error('Cannot write');
        });

        expect(() => deleteTest('test-1')).toThrow('Не удалось удалить тест');
      });
    });

    describe('clearAllTests', () => {
      it('should remove all tests from localStorage', () => {
        clearAllTests();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('quiz-app-tests');
      });
    });
  });

  // ============================================================================
  // ATTEMPT PERSISTENCE TESTS
  // ============================================================================

  describe('Attempt Persistence', () => {
    const mockAnswers: UserAnswer[] = [
      { questionId: 'q1', value: 'option-a' },
    ];

    const mockAttempt: QuizAttempt = {
      id: 'attempt-1',
      testId: 'test-1',
      mode: 'practice',
      currentQuestionIndex: 0,
      answers: mockAnswers,
      startedAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      status: 'in-progress',
    };

    describe('saveAttempt', () => {
      it('should save a new attempt to localStorage', () => {
        saveAttempt(mockAttempt);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'quiz-app-attempts',
          JSON.stringify([mockAttempt])
        );
      });

      it('should update an existing attempt', () => {
        // First save
        saveAttempt(mockAttempt);
        localStorageMock.setItem.mockClear();

        // Update attempt
        const updatedAttempt: QuizAttempt = {
          ...mockAttempt,
          status: 'completed',
          finishedAt: '2024-01-01T01:00:00.000Z',
        };
        saveAttempt(updatedAttempt);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'quiz-app-attempts',
          JSON.stringify([updatedAttempt])
        );
      });

      it('should throw error when localStorage fails', () => {
        localStorageMock.setItem.mockImplementationOnce(() => {
          throw new Error('Storage full');
        });

        expect(() => saveAttempt(mockAttempt)).toThrow('Не удалось сохранить прогресс');
      });
    });

    describe('getAllAttempts', () => {
      it('should return empty array when no attempts exist', () => {
        const attempts = getAllAttempts();
        expect(attempts).toEqual([]);
      });

      it('should return all saved attempts', () => {
        const attempt1: QuizAttempt = { ...mockAttempt, id: 'attempt-1' };
        const attempt2: QuizAttempt = { ...mockAttempt, id: 'attempt-2' };

        localStorageMock.getItem.mockReturnValue(
          JSON.stringify([attempt1, attempt2])
        );

        const attempts = getAllAttempts();
        expect(attempts).toHaveLength(2);
        expect(attempts[0].id).toBe('attempt-1');
        expect(attempts[1].id).toBe('attempt-2');
      });

      it('should return empty array on parse error', () => {
        localStorageMock.getItem.mockReturnValue('invalid json');

        const attempts = getAllAttempts();
        expect(attempts).toEqual([]);
      });
    });

    describe('getAttemptsForTest', () => {
      it('should return attempts for specific test', () => {
        const attempts: QuizAttempt[] = [
          { ...mockAttempt, id: 'attempt-1', testId: 'test-1' },
          { ...mockAttempt, id: 'attempt-2', testId: 'test-2' },
          { ...mockAttempt, id: 'attempt-3', testId: 'test-1' },
        ];

        localStorageMock.getItem.mockReturnValue(JSON.stringify(attempts));

        const result = getAttemptsForTest('test-1');
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('attempt-1');
        expect(result[1].id).toBe('attempt-3');
      });

      it('should return empty array if no attempts for test', () => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

        const result = getAttemptsForTest('test-1');
        expect(result).toEqual([]);
      });
    });

    describe('getAttemptById', () => {
      it('should return attempt by ID', () => {
        localStorageMock.getItem.mockReturnValue(
          JSON.stringify([mockAttempt])
        );

        const result = getAttemptById('attempt-1');
        expect(result).toEqual(mockAttempt);
      });

      it('should return undefined if attempt not found', () => {
        localStorageMock.getItem.mockReturnValue(
          JSON.stringify([mockAttempt])
        );

        const result = getAttemptById('non-existent');
        expect(result).toBeUndefined();
      });
    });

    describe('getInProgressAttempts', () => {
      it('should return only in-progress attempts', () => {
        const attempts: QuizAttempt[] = [
          { ...mockAttempt, id: 'attempt-1', status: 'in-progress' },
          { ...mockAttempt, id: 'attempt-2', status: 'completed' },
          { ...mockAttempt, id: 'attempt-3', status: 'in-progress' },
        ];

        localStorageMock.getItem.mockReturnValue(JSON.stringify(attempts));

        const result = getInProgressAttempts();
        expect(result).toHaveLength(2);
        expect(result.every(a => a.status === 'in-progress')).toBe(true);
      });

      it('should return empty array if no in-progress attempts', () => {
        const attempts: QuizAttempt[] = [
          { ...mockAttempt, id: 'attempt-1', status: 'completed' },
        ];

        localStorageMock.getItem.mockReturnValue(JSON.stringify(attempts));

        const result = getInProgressAttempts();
        expect(result).toEqual([]);
      });
    });

    describe('deleteAttempt', () => {
      it('should delete attempt by ID', () => {
        const attempts: QuizAttempt[] = [
          mockAttempt,
          { ...mockAttempt, id: 'attempt-2' },
        ];

        localStorageMock.getItem.mockReturnValue(JSON.stringify(attempts));

        deleteAttempt('attempt-1');

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'quiz-app-attempts',
          JSON.stringify([{ ...mockAttempt, id: 'attempt-2' }])
        );
      });

      it('should throw error when deletion fails', () => {
        localStorageMock.setItem.mockImplementationOnce(() => {
          throw new Error('Cannot write');
        });

        expect(() => deleteAttempt('attempt-1')).toThrow('Не удалось удалить попытку');
      });
    });

    describe('clearAllAttempts', () => {
      it('should remove all attempts from localStorage', () => {
        clearAllAttempts();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('quiz-app-attempts');
      });
    });
  });

  // ============================================================================
  // SETTINGS PERSISTENCE TESTS
  // ============================================================================

  describe('Settings Persistence', () => {
    describe('getSettings', () => {
      it('should return default settings when no settings exist', () => {
        const settings = getSettings();
        expect(settings).toEqual({ theme: 'system' });
      });

      it('should return saved settings', () => {
        localStorageMock.getItem.mockReturnValue(
          JSON.stringify({ theme: 'dark' })
        );

        const settings = getSettings();
        expect(settings).toEqual({ theme: 'dark' });
      });

      it('should merge saved settings with defaults', () => {
        localStorageMock.getItem.mockReturnValue(
          JSON.stringify({ theme: 'dark' })
        );

        const settings = getSettings();
        expect(settings.theme).toBe('dark');
      });

      it('should return default settings on parse error', () => {
        localStorageMock.getItem.mockReturnValue('invalid json');

        const settings = getSettings();
        expect(settings).toEqual({ theme: 'system' });
      });
    });

    describe('saveSettings', () => {
      it('should save settings to localStorage', () => {
        saveSettings({ theme: 'dark' });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'quiz-app-settings',
          JSON.stringify({ theme: 'dark' })
        );
      });

      it('should merge with existing settings', () => {
        localStorageMock.getItem.mockReturnValue(
          JSON.stringify({ theme: 'light' })
        );

        saveSettings({ theme: 'dark' });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'quiz-app-settings',
          JSON.stringify({ theme: 'dark' })
        );
      });

      it('should not throw error when saving fails', () => {
        localStorageMock.setItem.mockImplementationOnce(() => {
          throw new Error('Cannot write');
        });

        // Should not throw
        expect(() => saveSettings({ theme: 'dark' })).not.toThrow();
      });
    });
  });

  // ============================================================================
  // UTILITY FUNCTIONS TESTS
  // ============================================================================

  describe('Utility Functions', () => {
    describe('isStorageAvailable', () => {
      it('should return true when localStorage is available', () => {
        const result = isStorageAvailable();
        expect(result).toBe(true);
      });

      it('should return false when localStorage throws', () => {
        const originalSetItem = localStorageMock.setItem;
        localStorageMock.setItem.mockImplementationOnce(() => {
          throw new Error('Storage unavailable');
        });

        const result = isStorageAvailable();
        expect(result).toBe(false);

        localStorageMock.setItem = originalSetItem;
      });
    });

    describe('clearAllData', () => {
      it('should clear all app data from localStorage', () => {
        clearAllData();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('quiz-app-tests');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('quiz-app-attempts');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('quiz-app-settings');
      });
    });
  });
});
