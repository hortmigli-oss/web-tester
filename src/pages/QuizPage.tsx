import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuizStore } from '@/features/quiz/quiz-store';
import { QuizNavigation } from '@/components/quiz/QuizNavigation';
import { QuestionRenderer } from '@/components/quiz/QuestionRenderer';
import { ChevronLeft, ChevronRight, Save, CheckCircle } from 'lucide-react';

export function QuizPage() {
  const { testId, mode } = useParams<{ testId: string; mode: 'practice' | 'exam' }>();
  const navigate = useNavigate();
  
  const {
    currentAttempt: attempt,
    currentTest: test,
    answerQuestion: updateAnswer,
    jumpToQuestion: navigateToQuestion,
    finishQuiz: finishAttempt,
    persistProgress: saveAttempt,
  } = useQuizStore();

  if (!test || !attempt) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Тест не найден или попытка не создана
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = test.questions[attempt.currentQuestionIndex];
  const currentAnswer = attempt.answers.find(
    (a: { questionId: string }) => a.questionId === currentQuestion.id
  );

  const handleAnswerChange = (answer: typeof currentAnswer) => {
    if (answer) {
      updateAnswer(answer.questionId, answer.value);
      saveAttempt();
    }
  };

  const handleNavigate = (index: number) => {
    navigateToQuestion(index);
    saveAttempt();
  };

  const handlePrevious = () => {
    if (attempt.currentQuestionIndex > 0) {
      handleNavigate(attempt.currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (attempt.currentQuestionIndex < test.questions.length - 1) {
      handleNavigate(attempt.currentQuestionIndex + 1);
    }
  };

  const handleFinish = () => {
    finishAttempt();
    navigate(`/quiz/${testId}/result`);
  };

  const isLastQuestion = attempt.currentQuestionIndex === test.questions.length - 1;
  const quizMode = mode || 'practice';

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm text-muted-foreground">
                    Вопрос {attempt.currentQuestionIndex + 1} из {test.questions.length}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Режим: {quizMode === 'practice' ? 'Практика' : 'Экзамен'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={saveAttempt}>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить
                </Button>
              </div>
            </CardHeader>
          </Card>

          <QuestionRenderer
            question={currentQuestion}
            userAnswer={currentAnswer}
            onAnswerChange={handleAnswerChange}
            mode={quizMode}
            showResult={quizMode === 'practice'}
          />

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={attempt.currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>

            {isLastQuestion ? (
              <Button onClick={handleFinish}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Завершить тест
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Далее
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <QuizNavigation
            attempt={attempt}
            questions={test.questions}
            currentIndex={attempt.currentQuestionIndex}
            onNavigate={handleNavigate}
            mode={quizMode}
          />
        </div>
      </div>
    </div>
  );
}
