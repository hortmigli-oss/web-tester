/**
 * Persistence service for localStorage
 * This module provides an abstraction over localStorage
 * allowing future replacement with IndexedDB or backend API
 */

import type { Test, QuizAttempt } from '../../domain/quiz/types';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const TESTS_STORAGE_KEY = 'quiz-app-tests';
const ATTEMPTS_STORAGE_KEY = 'quiz-app-attempts';
const SETTINGS_STORAGE_KEY = 'quiz-app-settings';

// ============================================================================
// TEST PERSISTENCE
// ============================================================================

/**
 * Save a test to localStorage
 */
export function saveTest(test: Test): void {
  try {
    const tests = getAllTests();
    const existingIndex = tests.findIndex(t => t.id === test.id);
    
    if (existingIndex >= 0) {
      tests[existingIndex] = test;
    } else {
      tests.push(test);
    }
    
    localStorage.setItem(TESTS_STORAGE_KEY, JSON.stringify(tests));
  } catch (error) {
    console.error('Failed to save test:', error);
    throw new Error('Не удалось сохранить тест');
  }
}

/**
 * Get all tests from localStorage
 */
export function getAllTests(): Test[] {
  try {
    const data = localStorage.getItem(TESTS_STORAGE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as Test[];
  } catch (error) {
    console.error('Failed to load tests:', error);
    return [];
  }
}

/**
 * Get a specific test by ID
 */
export function getTestById(id: string): Test | undefined {
  const tests = getAllTests();
  return tests.find(t => t.id === id);
}

/**
 * Delete a test by ID
 */
export function deleteTest(id: string): void {
  try {
    const tests = getAllTests();
    const filtered = tests.filter(t => t.id !== id);
    localStorage.setItem(TESTS_STORAGE_KEY, JSON.stringify(filtered));
    
    // Also delete associated attempts
    const attempts = getAllAttempts();
    const filteredAttempts = attempts.filter(a => a.testId !== id);
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(filteredAttempts));
  } catch (error) {
    console.error('Failed to delete test:', error);
    throw new Error('Не удалось удалить тест');
  }
}

/**
 * Clear all tests
 */
export function clearAllTests(): void {
  localStorage.removeItem(TESTS_STORAGE_KEY);
}

// ============================================================================
// ATTEMPT PERSISTENCE
// ============================================================================

/**
 * Save a quiz attempt to localStorage
 */
export function saveAttempt(attempt: QuizAttempt): void {
  try {
    const attempts = getAllAttempts();
    const existingIndex = attempts.findIndex(a => a.id === attempt.id);
    
    if (existingIndex >= 0) {
      attempts[existingIndex] = attempt;
    } else {
      attempts.push(attempt);
    }
    
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error('Failed to save attempt:', error);
    throw new Error('Не удалось сохранить прогресс');
  }
}

/**
 * Get all attempts from localStorage
 */
export function getAllAttempts(): QuizAttempt[] {
  try {
    const data = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as QuizAttempt[];
  } catch (error) {
    console.error('Failed to load attempts:', error);
    return [];
  }
}

/**
 * Get attempts for a specific test
 */
export function getAttemptsForTest(testId: string): QuizAttempt[] {
  const attempts = getAllAttempts();
  return attempts.filter(a => a.testId === testId);
}

/**
 * Get a specific attempt by ID
 */
export function getAttemptById(id: string): QuizAttempt | undefined {
  const attempts = getAllAttempts();
  return attempts.find(a => a.id === id);
}

/**
 * Get in-progress attempts
 */
export function getInProgressAttempts(): QuizAttempt[] {
  const attempts = getAllAttempts();
  return attempts.filter(a => a.status === 'in-progress');
}

/**
 * Delete an attempt by ID
 */
export function deleteAttempt(id: string): void {
  try {
    const attempts = getAllAttempts();
    const filtered = attempts.filter(a => a.id !== id);
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete attempt:', error);
    throw new Error('Не удалось удалить попытку');
  }
}

/**
 * Clear all attempts
 */
export function clearAllAttempts(): void {
  localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
};

/**
 * Get app settings from localStorage
 */
export function getSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!data) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save app settings to localStorage
 */
export function saveSettings(settings: Partial<AppSettings>): void {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all app data
 */
export function clearAllData(): void {
  localStorage.removeItem(TESTS_STORAGE_KEY);
  localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
  localStorage.removeItem(SETTINGS_STORAGE_KEY);
}
