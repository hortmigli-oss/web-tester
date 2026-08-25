import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { SingleChoiceQuestion, UserAnswer } from '@/domain/quiz/types';
import { checkAnswer } from '@/domain/quiz/answer-checker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SingleQuestionViewProps {
  question: SingleChoiceQuestion;
  userAnswer: UserAnswer | undefined;
  onAnswerChange: (answer: UserAnswer) => void;
  mode: 'practice' | 'exam';
  showResult?: boolean;
}

export function SingleQuestionView({
  question,
  userAnswer,
  onAnswerChange,
  mode,
  showResult = false,
}: SingleQuestionViewProps) {
  const selectedValue = userAnswer?.value as string | undefined;

  const handleValueChange = (value: string) => {
    onAnswerChange({
      questionId: question.id,
      value,
    });
  };

  const result = showResult && selectedValue !== undefined
    ? checkAnswer(question, { questionId: question.id, value: selectedValue })
    : null;

  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedValue}
        onValueChange={handleValueChange}
        disabled={mode === 'practice' && showResult && selectedValue !== undefined}
      >
        {question.options.map((option) => (
          <div key={option.id} className="flex items-center space-x-3">
            <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
            <Label htmlFor={`${question.id}-${option.id}`} className="flex-1 cursor-pointer">
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>

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
          <p className="text-sm">
            {question.options.find(o => o.id === question.correctAnswer)?.text}
          </p>
        </div>
      )}
    </div>
  );
}
