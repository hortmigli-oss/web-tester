import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuizResultPage } from '../QuizResultPage';
import { useQuizStore } from '@/features/quiz/quiz-store';
import type { Test, Question, QuizAttempt, UserAnswer } from '@/domain/quiz/types';

// Mock the quiz store
vi.mock('@/features/quiz/quiz-store', () => ({
  useQuizStore: vi.fn(),
}));

const mockUseQuizStore = vi.mocked(useQuizStore);

// Helper functions to create test data
function createSingleQuestion(id: string, correctOptionId: string): Question {
  return {
    id,
    type: 'single',
    text: `Вопрос ${id}`,
    options: [
      { id: correctOptionId, text: 'Правильный ответ' },
      { id: 'wrong-opt', text: 'Неправильный ответ' },
    ],
    correctAnswer: [correctOptionId],
  };
}

function createMultipleQuestion(id: string, correctIds: string[]): Question {
  return {
    id,
    type: 'multiple',
    text: `Вопрос ${id} с множественным выбором`,
    options: [
      { id: 'opt-a', text: 'Вариант A' },
      { id: 'opt-b', text: 'Вариант B' },
      { id: 'opt-c', text: 'Вариант C' },
    ],
    correctAnswer: correctIds,
  };
}

function createTextQuestion(id: string, correctAnswers: string[]): Question {
  return {
    id,
    type: 'text',
    text: `Вопрос ${id} с текстовым ответом`,
    correctAnswers,
  };
}

function createOrderQuestion(id: string, correctOrder: string[]): Question {
  return {
    id,
    type: 'order',
    text: `Вопрос ${id} на упорядочивание`,
    items: [
      { id: 'item-1', text: 'Первый' },
      { id: 'item-2', text: 'Второй' },
      { id: 'item-3', text: 'Третий' },
    ],
    correctOrder,
  };
}

function createMockTest(): Test {
  return {
    id: 'test-1',
    version: 1,
    title: 'Тест для проверки результатов',
    description: 'Описание теста',
    questions: [
      createSingleQuestion('q1', 'correct-opt'),
      createMultipleQuestion('q2', ['opt-a', 'opt-b']),
      createTextQuestion('q3', ['москва', 'paris']),
      createOrderQuestion('q4', ['item-1', 'item-2', 'item-3']),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createMockAttempt(answers: UserAnswer[]): QuizAttempt {
  const now = new Date();
  const finished = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes later
  
  return {
    id: 'attempt-1',
    testId: 'test-1',
    mode: 'exam',
    currentQuestionIndex: 0,
    answers,
    startedAt: now.toISOString(),
    updatedAt: finished.toISOString(),
    status: 'completed',
    finishedAt: finished.toISOString(),
  };
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('QuizResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show alert when test is not found', () => {
    mockUseQuizStore.mockReturnValue({
      currentTest: null,
      currentAttempt: null,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    expect(screen.getByText(/Тест не найден или попытка не завершена/i)).toBeInTheDocument();
    expect(screen.getByText(/На главную/i)).toBeInTheDocument();
  });

  it('should show alert when attempt is not completed', () => {
    const mockTest = createMockTest();
    const inProgressAttempt: QuizAttempt = {
      id: 'attempt-1',
      testId: 'test-1',
      mode: 'practice',
      currentQuestionIndex: 0,
      answers: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'in-progress',
    };

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: inProgressAttempt,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    expect(screen.getByText(/Тест не найден или попытка не завершена/i)).toBeInTheDocument();
  });

  it('should display quiz results with statistics', () => {
    const mockTest = createMockTest();
    const answers: UserAnswer[] = [
      { questionId: 'q1', value: 'correct-opt' }, // Correct
      { questionId: 'q2', value: ['opt-a', 'opt-b'] }, // Correct
      { questionId: 'q3', value: 'москва' }, // Correct
      { questionId: 'q4', value: ['item-1', 'item-2', 'item-3'] }, // Correct
    ];
    const mockAttempt = createMockAttempt(answers);

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: mockAttempt,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    // Check header
    expect(screen.getByText('Результаты теста')).toBeInTheDocument();
    expect(screen.getByText(mockTest.title)).toBeInTheDocument();
    
    // Check score (100% since all correct)
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    // Check statistics - use getAllByText since "4" appears multiple times
    expect(screen.getAllByText('4')).toHaveLength(2); // Total questions and correct answers
    expect(screen.getByText('Всего вопросов')).toBeInTheDocument();
    expect(screen.getByText('Правильных')).toBeInTheDocument();
    expect(screen.getByText('Неправильных')).toBeInTheDocument();
    expect(screen.getByText('Время')).toBeInTheDocument();
  });

  it('should display correct and incorrect answers with different styles', () => {
    const mockTest = createMockTest();
    const answers: UserAnswer[] = [
      { questionId: 'q1', value: 'correct-opt' }, // Correct
      { questionId: 'q2', value: ['opt-a'] }, // Incorrect (partial)
      { questionId: 'q3', value: 'wrong answer' }, // Incorrect
      // q4 unanswered
    ];
    const mockAttempt = createMockAttempt(answers);

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: mockAttempt,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    // Should show detailed results section
    expect(screen.getByText('Детальные результаты')).toBeInTheDocument();
    
    // Check for question labels
    expect(screen.getByText('Вопрос 1')).toBeInTheDocument();
    expect(screen.getByText('Вопрос 2')).toBeInTheDocument();
    expect(screen.getByText('Вопрос 3')).toBeInTheDocument();
    expect(screen.getByText('Вопрос 4')).toBeInTheDocument();
  });

  it('should show user answer and correct answer for incorrect responses', () => {
    const mockTest = createMockTest();
    const answers: UserAnswer[] = [
      { questionId: 'q1', value: 'wrong-opt' }, // Incorrect
    ];
    const mockAttempt = createMockAttempt(answers);

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: mockAttempt,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    // Should show user's wrong answer
    expect(screen.getByText(/Ваш ответ:/i)).toBeInTheDocument();
    // Should show correct answer
    expect(screen.getByText(/Правильный ответ:/i)).toBeInTheDocument();
  });

  it('should show "Ответ не предоставлен" for unanswered questions', () => {
    const mockTest = createMockTest();
    const answers: UserAnswer[] = []; // No answers
    const mockAttempt = createMockAttempt(answers);

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: mockAttempt,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    expect(screen.getAllByText(/Ответ не предоставлен/i)).toHaveLength(4);
  });

  it('should display question type badges', () => {
    const mockTest = createMockTest();
    const answers: UserAnswer[] = [
      { questionId: 'q1', value: 'correct-opt' },
      { questionId: 'q2', value: ['opt-a', 'opt-b'] },
      { questionId: 'q3', value: 'москва' },
      { questionId: 'q4', value: ['item-1', 'item-2', 'item-3'] },
    ];
    const mockAttempt = createMockAttempt(answers);

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: mockAttempt,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    // Check for question type labels
    expect(screen.getByText('Одиночный выбор')).toBeInTheDocument();
    expect(screen.getByText('Множественный выбор')).toBeInTheDocument();
    expect(screen.getByText('Текстовый')).toBeInTheDocument();
    expect(screen.getByText('Упорядочивание')).toBeInTheDocument();
  });

  it('should show type summary badges', () => {
    const mockTest = createMockTest();
    const answers: UserAnswer[] = [
      { questionId: 'q1', value: 'correct-opt' },
      { questionId: 'q2', value: ['opt-a', 'opt-b'] },
      { questionId: 'q3', value: 'москва' },
      { questionId: 'q4', value: ['item-1', 'item-2', 'item-3'] },
    ];
    const mockAttempt = createMockAttempt(answers);

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: mockAttempt,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    // Type summaries should be displayed (note: text questions show "Текстовый ответ")
    expect(screen.getByText(/Одиночный выбор: \d+\/\d+/)).toBeInTheDocument();
    expect(screen.getByText(/Множественный выбор: \d+\/\d+/)).toBeInTheDocument();
    expect(screen.getByText(/Текстовый ответ: \d+\/\d+/)).toBeInTheDocument();
    expect(screen.getByText(/Упорядочивание: \d+\/\d+/)).toBeInTheDocument();
  });

  it('should display action buttons (На главную and Пройти заново)', () => {
    const mockTest = createMockTest();
    const answers: UserAnswer[] = [
      { questionId: 'q1', value: 'correct-opt' },
    ];
    const mockAttempt = createMockAttempt(answers);
    const resetQuizMock = vi.fn();

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: mockAttempt,
      resetQuiz: resetQuizMock,
    } as any);

    renderWithRouter(<QuizResultPage />);

    const homeButton = screen.getByText('На главную');
    const retakeButton = screen.getByText('Пройти заново');

    expect(homeButton).toBeInTheDocument();
    expect(retakeButton).toBeInTheDocument();
  });

  it('should show explanation if question has one', () => {
    const mockTest: Test = {
      id: 'test-1',
      version: 1,
      title: 'Тест с пояснениями',
      questions: [
        {
          id: 'q1',
          type: 'single',
          text: 'Вопрос с пояснением',
          options: [
            { id: 'opt1', text: 'Ответ 1' },
            { id: 'opt2', text: 'Ответ 2' },
          ],
          correctAnswer: ['opt1'],
          explanation: 'Это правильное объяснение ответа',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const answers: UserAnswer[] = [
      { questionId: 'q1', value: 'opt1' },
    ];
    const mockAttempt = createMockAttempt(answers);

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: mockAttempt,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    expect(screen.getByText(/Пояснение:/i)).toBeInTheDocument();
    expect(screen.getByText('Это правильное объяснение ответа')).toBeInTheDocument();
  });

  it('should calculate and display correct percentage for mixed results', () => {
    const mockTest = createMockTest();
    const answers: UserAnswer[] = [
      { questionId: 'q1', value: 'correct-opt' }, // Correct
      { questionId: 'q2', value: ['opt-a'] }, // Incorrect
      // q3, q4 unanswered
    ];
    const mockAttempt = createMockAttempt(answers);

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: mockAttempt,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    // 1 correct out of 4 = 25%
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('should display formatted duration correctly', () => {
    const mockTest = createMockTest();
    const startTime = new Date('2024-01-01T10:00:00Z');
    const finishTime = new Date('2024-01-01T10:07:45Z'); // 7 min 45 sec
    
    const answers: UserAnswer[] = [
      { questionId: 'q1', value: 'correct-opt' },
    ];
    
    const mockAttempt: QuizAttempt = {
      id: 'attempt-1',
      testId: 'test-1',
      mode: 'exam',
      currentQuestionIndex: 0,
      answers,
      startedAt: startTime.toISOString(),
      updatedAt: finishTime.toISOString(),
      status: 'completed',
      finishedAt: finishTime.toISOString(),
    };

    mockUseQuizStore.mockReturnValue({
      currentTest: mockTest,
      currentAttempt: mockAttempt,
      resetQuiz: vi.fn(),
    } as any);

    renderWithRouter(<QuizResultPage />);

    // Duration should be displayed as 07:45
    expect(screen.getByText('07:45')).toBeInTheDocument();
  });
});
