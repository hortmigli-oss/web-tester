import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuizStore } from '@/features/quiz/quiz-store';
import { calculateStatistics, getStatisticsByTypeSummary } from '@/domain/quiz/statistics';
import { CheckCircle2, XCircle, Clock, RotateCcw, Home } from 'lucide-react';
import type { Question } from '@/domain/quiz/types';

export function QuizResultPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  
  const { currentTest: test, currentAttempt: attempt, resetQuiz } = useQuizStore();

  if (!test || !attempt || attempt.status !== 'completed') {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Тест не найден или попытка не завершена
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            На главную
          </Button>
        </div>
      </div>
    );
  }

  const statistics = calculateStatistics(
    test.questions,
    attempt.answers,
    attempt.startedAt,
    attempt.finishedAt || new Date().toISOString()
  );

  const typeSummaries = getStatisticsByTypeSummary(statistics.byType);

  const getQuestionStatus = (questionId: string) => {
    const detail = statistics.questionDetails.find(d => d.questionId === questionId);
    if (!detail) return 'unanswered';
    if (detail.isCorrect) return 'correct';
    if (detail.isAnswered) return 'incorrect';
    return 'unanswered';
  };

  const handleRetake = () => {
    resetQuiz();
    navigate(`/quiz/${testId}/practice`);
  };

  const handleGoHome = () => {
    resetQuiz();
    navigate('/');
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header with score */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Результаты теста</CardTitle>
                <p className="text-muted-foreground mt-1">{test.title}</p>
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(statistics.percentage)}`}>
                {statistics.percentage}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{statistics.totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Всего вопросов</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{statistics.correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Правильных</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{statistics.incorrectAnswers}</div>
                <div className="text-sm text-muted-foreground">Неправильных</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">{statistics.formattedDuration}</span>
                </div>
                <div className="text-sm text-muted-foreground">Время</div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Прогресс</span>
                <span>{statistics.answeredQuestions}/{statistics.totalQuestions}</span>
              </div>
              <Progress value={(statistics.answeredQuestions / statistics.totalQuestions) * 100} />
            </div>

            {typeSummaries.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {typeSummaries.map((summary, index) => (
                  <Badge key={index} variant="secondary">
                    {summary}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed results by question */}
        <Card>
          <CardHeader>
            <CardTitle>Детальные результаты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {test.questions.map((question, index) => {
                const status = getQuestionStatus(question.id);
                const detail = statistics.questionDetails.find(d => d.questionId === question.id);
                
                return (
                  <div
                    key={question.id}
                    className={`p-4 border rounded-lg flex items-center gap-4 ${
                      status === 'correct' ? 'bg-green-50 border-green-200' :
                      status === 'incorrect' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {status === 'correct' && (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      )}
                      {status === 'incorrect' && (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      {status === 'unanswered' && (
                        <div className="h-6 w-6 rounded-full bg-gray-300" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Вопрос {index + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {getQuestionTypeLabel(question.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {question.text}
                      </p>
                      
                      {detail && detail.isAnswered && !detail.isCorrect && (
                        <div className="mt-2 text-sm">
                          <div className="text-red-600">
                            Ваш ответ: {formatUserAnswer(detail.userAnswer, question)}
                          </div>
                          <div className="text-green-600">
                            Правильный ответ: {formatCorrectAnswer(detail.correctAnswer, question)}
                          </div>
                        </div>
                      )}
                      
                      {detail && !detail.isAnswered && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Ответ не предоставлен
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div className="mt-2 p-2 bg-white rounded text-sm text-muted-foreground">
                          <strong>Пояснение:</strong> {question.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleGoHome}>
            <Home className="h-4 w-4 mr-2" />
            На главную
          </Button>
          <Button onClick={handleRetake}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Пройти заново
          </Button>
        </div>
      </div>
    </div>
  );
}

function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'single':
      return 'Одиночный выбор';
    case 'multiple':
      return 'Множественный выбор';
    case 'text':
      return 'Текстовый';
    case 'order':
      return 'Упорядочивание';
    default:
      return type;
  }
}

function formatUserAnswer(value: unknown, question: Question): string {
  if (value === undefined || value === null) return 'Нет ответа';
  
  switch (question.type) {
    case 'single': {
      const option = question.options.find(o => o.id === value);
      return option?.text || String(value);
    }
    case 'multiple': {
      const ids = value as string[];
      return ids
        .map(id => question.options.find(o => o.id === id)?.text)
        .filter(Boolean)
        .join(', ');
    }
    case 'text':
      return String(value);
    case 'order': {
      const ids = value as string[];
      return ids
        .map(id => question.items.find(i => i.id === id)?.text)
        .filter(Boolean)
        .join(' → ');
    }
    default:
      return String(value);
  }
}

function formatCorrectAnswer(value: unknown, question: Question): string {
  switch (question.type) {
    case 'single': {
      const ids = value as string[];
      const option = question.options.find(o => o.id === ids[0]);
      return option?.text || String(value);
    }
    case 'multiple': {
      const ids = value as string[];
      return ids
        .map(id => question.options.find(o => o.id === id)?.text)
        .filter(Boolean)
        .join(', ');
    }
    case 'text': {
      const answers = value as string[];
      return answers.join(' или ');
    }
    case 'order': {
      const ids = value as string[];
      return ids
        .map(id => question.items.find(i => i.id === id)?.text)
        .filter(Boolean)
        .join(' → ');
    }
    default:
      return String(value);
  }
}
