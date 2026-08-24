/**
 * Question list item component
 */

import type { Question } from '../../domain/quiz/types';

export interface QuestionListItemProps {
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function QuestionListItem({
  question,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: QuestionListItemProps) {
  const getTypeLabel = (type: Question['type']) => {
    switch (type) {
      case 'single': return 'Одиночный';
      case 'multiple': return 'Множественный';
      case 'text': return 'Текст';
      case 'order': return 'Порядок';
    }
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  };

  return (
    <div 
      className={`question-list-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-selected={isSelected}
    >
      <div className="question-index">{index + 1}</div>
      
      <div className="question-content">
        <div className="question-header">
          <span className="question-type">{getTypeLabel(question.type)}</span>
          <span className="question-text-preview">
            {truncateText(question.text)}
          </span>
        </div>
        
        <div className="question-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="Переместить вверх"
            aria-label="Переместить вопрос вверх"
            className="btn-icon"
          >
            ↑
          </button>
          
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="Переместить вниз"
            aria-label="Переместить вопрос вниз"
            className="btn-icon"
          >
            ↓
          </button>
          
          <button
            type="button"
            onClick={onDuplicate}
            title="Дублировать"
            aria-label="Дублировать вопрос"
            className="btn-icon"
          >
            ⧉
          </button>
          
          <button
            type="button"
            onClick={onEdit}
            title="Редактировать"
            aria-label="Редактировать вопрос"
            className="btn-icon"
          >
            ✎
          </button>
          
          <button
            type="button"
            onClick={onDelete}
            title="Удалить"
            aria-label="Удалить вопрос"
            className="btn-icon btn-danger"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
