/**
 * Editor page component for creating and managing tests
 */

import { useState, useEffect } from 'react';
import { useEditorStore } from '../features/editor/index.js';
import { QuestionForm } from '../components/editor/QuestionForm.js';
import { QuestionList } from '../components/editor/QuestionList.js';
import type { Question } from '../domain/quiz/types.js';
import { exportTestToFile, triggerFileInput, importTestFromFile } from '../features/import-export/import-export.js';
import { useQuizStore } from '../features/quiz/quiz-store.js';

export function EditorPage() {
  const {
    currentTest,
    allTests,
    questions,
    error,
    loadTests,
    createTest,
    loadTest,
    saveTest,
    deleteTest,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    moveQuestion,
    clearError,
  } = useEditorStore();

  const { startTest } = useQuizStore();

  // UI state
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDescription, setNewTestDescription] = useState('');
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');

  // Load tests on mount
  useEffect(() => {
    loadTests();
  }, [loadTests]);

  // Sync test title/description when loading a test
  if (currentTest && testTitle !== currentTest.title) {
    setTestTitle(currentTest.title);
    setTestDescription(currentTest.description ?? '');
  }

  // Handle creating a new test
  const handleCreateTest = () => {
    if (!newTestTitle.trim()) return;
    createTest(newTestTitle.trim(), newTestDescription.trim());
    setNewTestTitle('');
    setNewTestDescription('');
    setIsCreatingTest(false);
  };

  // Handle selecting a test
  const handleSelectTest = (testId: string) => {
    loadTest(testId);
    setSelectedQuestionId(null);
    setIsEditingQuestion(false);
  };

  // Handle saving test
  const handleSaveTest = () => {
    saveTest();
  };

  // Handle deleting test
  const handleDeleteTest = () => {
    if (currentTest && window.confirm(`Вы уверены, что хотите удалить тест "${currentTest.title}"?`)) {
      deleteTest(currentTest.id);
    }
  };

  // Handle adding a new question
  const handleAddQuestion = () => {
    setSelectedQuestionId(null);
    setIsEditingQuestion(true);
  };

  // Handle editing existing question
  const handleEditQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setIsEditingQuestion(true);
  };

  // Handle saving question
  const handleSaveQuestion = (question: Question) => {
    if (selectedQuestionId) {
      updateQuestion(question);
    } else {
      addQuestion(question);
    }
    setIsEditingQuestion(false);
    setSelectedQuestionId(null);
  };

  // Handle canceling question edit
  const handleCancelQuestion = () => {
    setIsEditingQuestion(false);
    setSelectedQuestionId(null);
  };

  // Handle deleting question
  const handleDeleteQuestion = (questionId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      deleteQuestion(questionId);
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(null);
        setIsEditingQuestion(false);
      }
    }
  };

  // Handle duplicating question
  const handleDuplicateQuestion = (questionId: string) => {
    duplicateQuestion(questionId);
  };

  // Handle moving question
  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    moveQuestion(questionId, direction);
  };

  // Handle exporting test
  const handleExportTest = () => {
    if (currentTest) {
      exportTestToFile(currentTest);
    }
  };

  // Handle importing test
  const handleImportTest = async () => {
    try {
      const file = await triggerFileInput('.json');
      const result = await importTestFromFile(file);
      
      if (result.success && result.test) {
        // Reload tests to include the imported one
        loadTests();
        alert('Тест успешно импортирован!');
      } else {
        alert(`Ошибка импорта: ${result.errors?.join(', ') || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      alert(`Ошибка импорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  // Handle starting quiz in practice mode
  const handleStartPractice = () => {
    if (currentTest) {
      startTest(currentTest, 'practice');
    }
  };

  // Handle starting quiz in exam mode
  const handleStartExam = () => {
    if (currentTest) {
      startTest(currentTest, 'exam');
    }
  };

  // Get selected question for editing
  const selectedQuestion = selectedQuestionId
    ? questions.find(q => q.id === selectedQuestionId)
    : undefined;

  return (
    <div className="editor-page">
      <header className="editor-header">
        <h1>Конструктор тестов</h1>
      </header>

      {/* Error display */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={clearError} aria-label="Закрыть">✕</button>
        </div>
      )}

      <div className="editor-layout">
        {/* Sidebar - Test list */}
        <aside className="editor-sidebar">
          <div className="sidebar-section">
            <h2>Ваши тесты</h2>
            
            {!isCreatingTest ? (
              <>
                <button 
                  className="btn-primary btn-full" 
                  onClick={() => setIsCreatingTest(true)}
                >
                  + Новый тест
                </button>
                
                <button 
                  className="btn-secondary btn-full" 
                  onClick={handleImportTest}
                >
                  📥 Импортировать
                </button>
                
                {allTests.length > 0 ? (
                  <ul className="test-list">
                    {allTests.map(test => (
                      <li
                        key={test.id}
                        className={`test-list-item ${currentTest?.id === test.id ? 'active' : ''}`}
                        onClick={() => handleSelectTest(test.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectTest(test.id);
                          }
                        }}
                      >
                        <span className="test-title">{test.title}</span>
                        <span className="test-count">{test.questions.length} вопр.</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-message">Нет созданных тестов</p>
                )}
              </>
            ) : (
              <div className="create-test-form">
                <input
                  type="text"
                  placeholder="Название теста"
                  value={newTestTitle}
                  onChange={(e) => setNewTestTitle(e.target.value)}
                  autoFocus
                  className="input-field"
                />
                <textarea
                  placeholder="Описание (опционально)"
                  value={newTestDescription}
                  onChange={(e) => setNewTestDescription(e.target.value)}
                  rows={2}
                  className="input-field"
                />
                <div className="form-actions">
                  <button onClick={handleCreateTest} className="btn-save">
                    Создать
                  </button>
                  <button onClick={() => setIsCreatingTest(false)} className="btn-cancel">
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="editor-main">
          {!currentTest ? (
            <div className="no-test-selected">
              <h2>Выберите тест или создайте новый</h2>
              <p>Для начала работы выберите существующий тест из списка слева или создайте новый</p>
            </div>
          ) : (
            <>
              {/* Test header */}
              <div className="test-header">
                <div className="test-info">
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="test-title-input"
                    placeholder="Название теста"
                  />
                  <textarea
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                    className="test-description-input"
                    placeholder="Описание теста (опционально)"
                    rows={2}
                  />
                </div>
                
                <div className="test-actions">
                  <button onClick={handleSaveTest} className="btn-save" disabled={!questions.length}>
                    💾 Сохранить
                  </button>
                  <button onClick={handleExportTest} className="btn-secondary">
                    📤 Экспорт
                  </button>
                  <button onClick={handleDeleteTest} className="btn-danger">
                    🗑 Удалить
                  </button>
                </div>
              </div>

              {/* Quiz mode buttons */}
              {questions.length > 0 && (
                <div className="quiz-mode-buttons">
                  <button onClick={handleStartPractice} className="btn-practice">
                    ▶ Практика
                  </button>
                  <button onClick={handleStartExam} className="btn-exam">
                    🎓 Экзамен
                  </button>
                </div>
              )}

              {/* Question form or list */}
              {isEditingQuestion ? (
                <QuestionForm
                  initialQuestion={selectedQuestion}
                  onSave={handleSaveQuestion}
                  onCancel={handleCancelQuestion}
                />
              ) : (
                <>
                  <div className="question-list-header">
                    <h3>Вопросы ({questions.length})</h3>
                    <button onClick={handleAddQuestion} className="btn-add">
                      + Добавить вопрос
                    </button>
                  </div>
                  
                  <QuestionList
                    questions={questions}
                    selectedQuestionId={selectedQuestionId}
                    onSelectQuestion={setSelectedQuestionId}
                    onEditQuestion={handleEditQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onDuplicateQuestion={handleDuplicateQuestion}
                    onMoveQuestion={handleMoveQuestion}
                  />
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
