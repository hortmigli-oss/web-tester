/**
 * Question list component for the editor
 */

import type { Question } from '../../domain/quiz/types';
import { QuestionListItem } from './QuestionListItem';

export interface QuestionListProps {
  questions: Question[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
  onEditQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onDuplicateQuestion: (questionId: string) => void;
  onMoveQuestion: (questionId: string, direction: 'up' | 'down') => void;
}

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onMoveQuestion,
}: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className="question-list-empty">
        <h3>Вопросов пока нет</h3>
        <p>Создайте первый вопрос, чтобы начать тест</p>
      </div>
    );
  }

  return (
    <div className="question-list" role="list" aria-label="Список вопросов">
      {questions.map((question, index) => (
        <QuestionListItem
          key={question.id}
          question={question}
          index={index}
          isSelected={selectedQuestionId === question.id}
          onSelect={() => onSelectQuestion(question.id)}
          onEdit={() => onEditQuestion(question.id)}
          onDelete={() => onDeleteQuestion(question.id)}
          onDuplicate={() => onDuplicateQuestion(question.id)}
          onMoveUp={() => onMoveQuestion(question.id, 'up')}
          onMoveDown={() => onMoveQuestion(question.id, 'down')}
          canMoveUp={index > 0}
          canMoveDown={index < questions.length - 1}
        />
      ))}
    </div>
  );
}
