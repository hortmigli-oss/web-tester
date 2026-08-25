import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { QuizAttempt, Question } from '@/domain/quiz/types';

interface QuizNavigationProps {
  attempt: QuizAttempt;
  questions: Question[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  mode: 'practice' | 'exam';
}

export function QuizNavigation({
  attempt,
  questions,
  currentIndex,
  onNavigate,
  mode,
}: QuizNavigationProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Вопросы</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => {
              const hasAnswer = attempt.answers.some(
                (a: { questionId: string }) => a.questionId === questions[index].id
              );
              const isCurrent = index === currentIndex;
              
              let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
              if (mode === 'practice' && hasAnswer) {
                variant = 'secondary';
              } else if (hasAnswer) {
                variant = 'secondary';
              }
              
              return (
                <Button
                  key={questions[index].id}
                  variant={variant}
                  size="sm"
                  className={`w-10 h-10 p-0 ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => onNavigate(index)}
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
        
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="w-6 h-6 p-0" disabled />
            <span>Есть ответ</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="w-6 h-6 p-0" disabled />
            <span>Нет ответа</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary rounded-md" />
            <span>Текущий вопрос</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
