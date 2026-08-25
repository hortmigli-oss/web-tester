/**
 * Question form component for creating/editing questions
 */

import { useState, useCallback } from 'react';
import type { Question, AnswerOption } from '../../domain/quiz/types';
import { generateId, generateOptionId } from '../../domain/quiz/validation';
import { validateQuestion } from '../../domain/quiz/validation';

// ============================================================================
// PROPS
// ============================================================================

export interface QuestionFormProps {
  initialQuestion?: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

// ============================================================================
// QUESTION FORM COMPONENT
// ============================================================================

export function QuestionForm({ initialQuestion, onSave, onCancel }: QuestionFormProps) {
  // Determine if we're editing or creating
  const isEditing = !!initialQuestion;
  
  // Form state
  const [questionType, setQuestionType] = useState<Question['type']>(
    initialQuestion?.type ?? 'single'
  );
  const [text, setText] = useState(initialQuestion?.text ?? '');
  const [explanation, setExplanation] = useState(initialQuestion?.explanation ?? '');
  
  // Type-specific state
  const [options, setOptions] = useState<AnswerOption[]>(
    initialQuestion?.type === 'single' || initialQuestion?.type === 'multiple'
      ? initialQuestion.options
      : []
  );
  const [correctAnswerSingle, setCorrectAnswerSingle] = useState<string>(
    initialQuestion?.type === 'single' ? initialQuestion.correctAnswer[0] ?? '' : ''
  );
  const [correctAnswersMultiple, setCorrectAnswersMultiple] = useState<string[]>(
    initialQuestion?.type === 'multiple' ? initialQuestion.correctAnswer : []
  );
  const [correctAnswersText, setCorrectAnswersText] = useState<string[]>(
    initialQuestion?.type === 'text' ? initialQuestion.correctAnswers : ['']
  );
  const [orderItems, setOrderItems] = useState<AnswerOption[]>(
    initialQuestion?.type === 'order' ? initialQuestion.items : []
  );
  
  // Validation errors
  const [errors, setErrors] = useState<string[]>([]);

  // Handle type change
  const handleTypeChange = (newType: Question['type']) => {
    setQuestionType(newType);
    setErrors([]);
  };

  // Option management for single/multiple
  const addOption = useCallback(() => {
    setOptions(prev => [...prev, { id: generateOptionId(), text: '' }]);
  }, []);

  const updateOption = useCallback((id: string, newText: string) => {
    setOptions(prev => prev.map(opt => opt.id === id ? { ...opt, text: newText } : opt));
  }, []);

  const removeOption = useCallback((id: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== id));
    // Also remove from correct answers if needed
    setCorrectAnswerSingle(prev => prev === id ? '' : prev);
    setCorrectAnswersMultiple(prev => prev.filter(cid => cid !== id));
  }, []);

  // Text answer management
  const addTextAnswer = useCallback(() => {
    setCorrectAnswersText(prev => [...prev, '']);
  }, []);

  const updateTextAnswer = useCallback((index: number, value: string) => {
    setCorrectAnswersText(prev => prev.map((ans, i) => i === index ? value : ans));
  }, []);

  const removeTextAnswer = useCallback((index: number) => {
    setCorrectAnswersText(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Order item management
  const addOrderItem = useCallback(() => {
    setOrderItems(prev => [...prev, { id: generateOptionId(), text: '' }]);
  }, []);

  const updateOrderItem = useCallback((id: string, newText: string) => {
    setOrderItems(prev => prev.map(item => item.id === id ? { ...item, text: newText } : item));
  }, []);

  const removeOrderItem = useCallback((id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const moveOrderItem = useCallback((index: number, direction: 'up' | 'down') => {
    setOrderItems(prev => {
      const newItems = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newItems.length) return prev;
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
      return newItems;
    });
  }, []);

  // Save handler
  const handleSave = () => {
    const validationErrors: string[] = [];
    
    if (!text.trim()) {
      validationErrors.push('Текст вопроса обязателен');
    }
    
    let question: Question | null = null;
    
    switch (questionType) {
      case 'single': {
        const validOptions = options.filter(o => o.text.trim());
        if (validOptions.length < 2) {
          validationErrors.push('Минимум 2 варианта ответа с заполненным текстом required');
        }
        if (!correctAnswerSingle) {
          validationErrors.push('Выберите правильный ответ');
        }
        // Check if correct answer is in valid options
        if (correctAnswerSingle && !validOptions.some(o => o.id === correctAnswerSingle)) {
          validationErrors.push('Правильный ответ должен быть среди заполненных вариантов');
        }
        if (!validationErrors.length) {
          question = {
            id: initialQuestion?.id ?? generateId(),
            type: 'single',
            text: text.trim(),
            options: validOptions,
            correctAnswer: [correctAnswerSingle],
            explanation: explanation.trim() || undefined,
          };
        }
        break;
      }
      
      case 'multiple': {
        const validOptions = options.filter(o => o.text.trim());
        if (validOptions.length < 2) {
          validationErrors.push('Минимум 2 варианта ответа с заполненным текстом required');
        }
        if (correctAnswersMultiple.length < 1) {
          validationErrors.push('Выберите хотя бы один правильный ответ');
        }
        // Check if all correct answers are in valid options
        const hasInvalidCorrectAnswers = correctAnswersMultiple.some(id => !validOptions.some(o => o.id === id));
        if (hasInvalidCorrectAnswers) {
          validationErrors.push('Правильные ответы должны быть среди заполненных вариантов');
        }
        if (!validationErrors.length) {
          question = {
            id: initialQuestion?.id ?? generateId(),
            type: 'multiple',
            text: text.trim(),
            options: validOptions,
            correctAnswer: correctAnswersMultiple,
            explanation: explanation.trim() || undefined,
          };
        }
        break;
      }
      
      case 'text': {
        const filteredAnswers = correctAnswersText.filter(a => a.trim());
        if (filteredAnswers.length < 1) {
          validationErrors.push('Добавьте хотя бы один правильный вариант ответа');
        }
        if (!validationErrors.length) {
          question = {
            id: initialQuestion?.id ?? generateId(),
            type: 'text',
            text: text.trim(),
            correctAnswers: filteredAnswers,
            explanation: explanation.trim() || undefined,
          };
        }
        break;
      }
      
      case 'order': {
        if (orderItems.length < 2) {
          validationErrors.push('Минимум 2 элемента для упорядочивания');
        }
        if (!validationErrors.length) {
          const filteredItems = orderItems.filter(i => i.text.trim());
          question = {
            id: initialQuestion?.id ?? generateId(),
            type: 'order',
            text: text.trim(),
            items: filteredItems,
            correctOrder: filteredItems.map(i => i.id),
            explanation: explanation.trim() || undefined,
          };
        }
        break;
      }
    }
    
    if (question) {
      const domainErrors = validateQuestion(question);
      if (domainErrors.length > 0) {
        setErrors(domainErrors);
        return;
      }
      onSave(question);
    } else {
      setErrors(validationErrors);
    }
  };

  const toggleMultipleCorrectAnswer = (optionId: string) => {
    setCorrectAnswersMultiple(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  return (
    <div className="question-form">
      <h2>{isEditing ? 'Редактировать вопрос' : 'Новый вопрос'}</h2>
      
      {/* Error display */}
      {errors.length > 0 && (
        <div className="form-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">{error}</div>
          ))}
        </div>
      )}
      
      {/* Question type selector */}
      <div className="form-group">
        <label htmlFor="question-type">Тип вопроса:</label>
        <select
          id="question-type"
          value={questionType}
          onChange={(e) => handleTypeChange(e.target.value as Question['type'])}
          disabled={isEditing}
        >
          <option value="single">Одиночный ответ</option>
          <option value="multiple">Множественный ответ</option>
          <option value="text">Ручной ввод</option>
          <option value="order">Порядок</option>
        </select>
      </div>
      
      {/* Question text */}
      <div className="form-group">
        <label htmlFor="question-text">Текст вопроса:</label>
        <textarea
          id="question-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Введите текст вопроса..."
        />
      </div>
      
      {/* Explanation */}
      <div className="form-group">
        <label htmlFor="question-explanation">Пояснение (опционально):</label>
        <textarea
          id="question-explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          placeholder="Объясните правильный ответ..."
        />
      </div>
      
      {/* Single/Multiple Choice Options */}
      {(questionType === 'single' || questionType === 'multiple') && (
        <div className="form-section">
          <h3>Варианты ответов:</h3>
          
          {options.map((option, index) => (
            <div key={option.id} className="option-row">
              {questionType === 'single' && (
                <input
                  type="radio"
                  name="correct-answer-single"
                  checked={correctAnswerSingle === option.id}
                  onChange={() => setCorrectAnswerSingle(option.id)}
                  aria-label={`Выбрать как правильный ответ: ${option.text || `вариант ${index + 1}`}`}
                />
              )}
              
              {questionType === 'multiple' && (
                <input
                  type="checkbox"
                  checked={correctAnswersMultiple.includes(option.id)}
                  onChange={() => toggleMultipleCorrectAnswer(option.id)}
                  aria-label={`Отметить как правильный: ${option.text || `вариант ${index + 1}`}`}
                />
              )}
              
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(option.id, e.target.value)}
                placeholder={`Вариант ${index + 1}`}
                className="option-input"
              />
              
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                className="btn-remove"
                aria-label="Удалить вариант"
                disabled={options.length <= 2}
              >
                ✕
              </button>
            </div>
          ))}
          
          <button type="button" onClick={addOption} className="btn-add">
            + Добавить вариант
          </button>
        </div>
      )}
      
      {/* Text Question Correct Answers */}
      {questionType === 'text' && (
        <div className="form-section">
          <h3>Правильные варианты ответа:</h3>
          <p className="help-text">
            Укажите все допустимые варианты. Ответ будет считаться правильным, если он совпадёт с любым из них.
          </p>
          
          {correctAnswersText.map((answer, index) => (
            <div key={index} className="text-answer-row">
              <input
                type="text"
                value={answer}
                onChange={(e) => updateTextAnswer(index, e.target.value)}
                placeholder={`Вариант ${index + 1}`}
                className="text-answer-input"
              />
              <button
                type="button"
                onClick={() => removeTextAnswer(index)}
                className="btn-remove"
                aria-label="Удалить вариант ответа"
                disabled={correctAnswersText.length <= 1}
              >
                ✕
              </button>
            </div>
          ))}
          
          <button type="button" onClick={addTextAnswer} className="btn-add">
            + Добавить вариант
          </button>
        </div>
      )}
      
      {/* Order Question Items */}
      {questionType === 'order' && (
        <div className="form-section">
          <h3>Элементы для упорядочивания:</h3>
          <p className="help-text">
            Элементы будут показаны в указанном здесь порядке. Это и есть правильный порядок.
          </p>
          
          {orderItems.map((item, index) => (
            <div key={item.id} className="order-item-row">
              <span className="order-index">{index + 1}.</span>
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateOrderItem(item.id, e.target.value)}
                placeholder={`Элемент ${index + 1}`}
                className="order-item-input"
              />
              <div className="order-actions">
                <button
                  type="button"
                  onClick={() => moveOrderItem(index, 'up')}
                  className="btn-move"
                  aria-label="Переместить вверх"
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveOrderItem(index, 'down')}
                  className="btn-move"
                  aria-label="Переместить вниз"
                  disabled={index === orderItems.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeOrderItem(item.id)}
                  className="btn-remove"
                  aria-label="Удалить элемент"
                  disabled={orderItems.length <= 2}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          
          <button type="button" onClick={addOrderItem} className="btn-add">
            + Добавить элемент
          </button>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Отмена
        </button>
        <button type="button" onClick={handleSave} className="btn-save">
          {isEditing ? 'Сохранить изменения' : 'Создать вопрос'}
        </button>
      </div>
    </div>
  );
}
