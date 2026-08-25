import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { OrderQuestion, UserAnswer } from '@/domain/quiz/types';
import { checkAnswer } from '@/domain/quiz/answer-checker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, ArrowUp, ArrowDown } from 'lucide-react';

interface OrderQuestionViewProps {
  question: OrderQuestion;
  userAnswer: UserAnswer | undefined;
  onAnswerChange: (answer: UserAnswer) => void;
  mode: 'practice' | 'exam';
  showResult?: boolean;
}

export function OrderQuestionView({
  question,
  userAnswer,
  onAnswerChange,
  mode,
  showResult = false,
}: OrderQuestionViewProps) {
  const [currentOrder, setCurrentOrder] = useState<string[]>(
    (userAnswer?.value as string[]) || question.items.map(item => item.id)
  );

  useEffect(() => {
    if (!userAnswer) {
      setCurrentOrder(question.items.map(item => item.id));
    } else {
      setCurrentOrder(userAnswer.value as string[]);
    }
  }, [userAnswer, question.items]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentOrder.length) return;

    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    
    setCurrentOrder(newOrder);
    onAnswerChange({
      questionId: question.id,
      value: newOrder,
    });
  };

  const result = showResult && currentOrder.length > 0
    ? checkAnswer(question, { questionId: question.id, value: currentOrder })
    : null;

  const isDisabled = mode === 'practice' && showResult && currentOrder.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {currentOrder.map((itemId, index) => {
          const item = question.items.find(i => i.id === itemId);
          if (!item) return null;

          return (
            <div
              key={itemId}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card"
            >
              <span className="w-6 text-center font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <span className="flex-1">{item.text}</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0 || isDisabled}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === currentOrder.length - 1 || isDisabled}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
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
          <h4 className="font-semibold mb-2">Правильный порядок:</h4>
          <ol className="text-sm list-decimal list-inside space-y-1">
            {question.correctOrder.map((itemId) => {
              const item = question.items.find(i => i.id === itemId);
              return item ? (
                <li key={itemId}>{item.text}</li>
              ) : null;
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
