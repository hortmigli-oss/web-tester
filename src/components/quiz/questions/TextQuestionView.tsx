import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { TextQuestion, UserAnswer } from '@/domain/quiz/types';
import { checkAnswer } from '@/domain/quiz/answer-checker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TextQuestionViewProps {
  question: TextQuestion;
  userAnswer: UserAnswer | undefined;
  onAnswerChange: (answer: UserAnswer) => void;
  mode: 'practice' | 'exam';
  showResult?: boolean;
}

export function TextQuestionView({
  question,
  userAnswer,
  onAnswerChange,
  mode,
  showResult = false,
}: TextQuestionViewProps) {
  const [inputValue, setInputValue] = useState(userAnswer?.value as string || '');

  useEffect(() => {
    setInputValue(userAnswer?.value as string || '');
  }, [userAnswer]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    onAnswerChange({
      questionId: question.id,
      value,
    });
  };

  const result = showResult && inputValue.trim().length > 0
    ? checkAnswer(question, { questionId: question.id, value: inputValue })
    : null;

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Введите ваш ответ..."
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        disabled={mode === 'practice' && showResult && inputValue.trim().length > 0}
        className="min-h-[100px]"
      />

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
            {question.correctAnswers.map((answer, index) => (
              <li key={index}>{answer}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
