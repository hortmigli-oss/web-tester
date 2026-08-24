/**
 * Import/Export utilities for tests and attempts
 */

import type { Test, QuizAttempt } from '../../domain/quiz/types';
import {
  testToJsonString,
  attemptToJsonString,
  deserializeTestFromJson,
  deserializeAttemptFromJson,
} from '../../domain/quiz/serializers';

// ============================================================================
// TEST IMPORT/EXPORT
// ============================================================================

/**
 * Export a test to JSON file (triggers browser download)
 */
export function exportTestToFile(test: Test, filename?: string): void {
  const json = testToJsonString(test);
  downloadFile(json, `${filename || sanitizeFilename(test.title) || 'test'}.json`, 'application/json');
}

/**
 * Import test from file input
 */
export async function importTestFromFile(file: File): Promise<{
  success: boolean;
  test?: Test;
  errors?: string[];
}> {
  try {
    const content = await readFileAsText(file);
    return deserializeTestFromJson(content);
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to import file'],
    };
  }
}

// ============================================================================
// ATTEMPT IMPORT/EXPORT
// ============================================================================

/**
 * Export an attempt to JSON file
 */
export function exportAttemptToFile(attempt: QuizAttempt, filename?: string): void {
  const json = attemptToJsonString(attempt);
  downloadFile(json, `${filename || attempt.id}.json`, 'application/json');
}

/**
 * Import attempt from file
 */
export async function importAttemptFromFile(file: File): Promise<{
  success: boolean;
  attempt?: QuizAttempt;
  errors?: string[];
}> {
  try {
    const content = await readFileAsText(file);
    return deserializeAttemptFromJson(content);
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to import file'],
    };
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read file as text for import
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]/gi, '_');
}

/**
 * Create a file input element for importing
 */
export function triggerFileInput(accept: string = '.json'): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        resolve(file);
      } else {
        reject(new Error('No file selected'));
      }
    };
    
    input.click();
  });
}
