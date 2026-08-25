import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { MultipleChoiceQuestion, UserAnswer } from '@/domain/quiz/types';
import { checkAnswer } from '@/domain/quiz/answer-checker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

interface MultipleQuestionViewProps {
  question: MultipleChoiceQuestion;
  userAnswer: UserAnswer | undefined;
  onAnswerChange: (answer: UserAnswer) => void;
  mode: 'practice' | 'exam';
  showResult?: boolean;
}

export function MultipleQuestionView({
  question,
  userAnswer,
  onAnswerChange,
  mode,
  showResult = false,
}: MultipleQuestionViewProps) {
  const selectedValues = (userAnswer?.value as string[]) || [];

  const handleValueChange = (optionId: string, checked: boolean) => {
    let newValues: string[];
    if (checked) {
      newValues = [...selectedValues, optionId];
    } else {
      newValues = selectedValues.filter((id) => id !== optionId);
    }
    
    onAnswerChange({
      questionId: question.id,
      value: newValues,
    });
  };

  const result = showResult && selectedValues.length > 0
    ? checkAnswer(question, { questionId: question.id, value: selectedValues })
    : null;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {question.options.map((option) => (
          <div key={option.id} className="flex items-center space-x-3">
            <Checkbox
              id={`${question.id}-${option.id}`}
              checked={selectedValues.includes(option.id)}
              onCheckedChange={(checked) => handleValueChange(option.id, checked as boolean)}
              disabled={mode === 'practice' && showResult && selectedValues.length > 0}
            />
            <Label htmlFor={`${question.id}-${option.id}`} className="flex-1 cursor-pointer">
              {option.text}
            </Label>
          </div>
        ))}
      </div>

      {result && (
        <Alert variant={result.isCorrect ? 'default' : 'destructive'}>
          {result.isCorrect ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription className="ml-2">
            {result.isCorrect ? 'Правильно!' : 'Неправильно'}
          </AlertDescription>
        </Alert>
      )}

      {showResult && question.explanation && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Пояснение:</h4>
          <p className="text-sm text-muted-foreground">{question.explanation}</p>
        </div>
      )}

      {showResult && !result?.isCorrect && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Правильный ответ:</h4>
          <ul className="text-sm list-disc list-inside">
            {question.correctAnswer.map((id) => {
              const option = question.options.find(o => o.id === id);
              return option ? <li key={id}>{option.text}</li> : null;
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
