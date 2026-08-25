import { Card, CardContent } from '@/components/ui/card';
import type { Question, UserAnswer } from '@/domain/quiz/types';
import { SingleQuestionView } from './questions/SingleQuestionView';
import { MultipleQuestionView } from './questions/MultipleQuestionView';
import { TextQuestionView } from './questions/TextQuestionView';
import { OrderQuestionView } from './questions/OrderQuestionView';

interface QuestionRendererProps {
  question: Question;
  userAnswer: UserAnswer | undefined;
  onAnswerChange: (answer: UserAnswer) => void;
  mode: 'practice' | 'exam';
  showResult?: boolean;
}

export function QuestionRenderer({
  question,
  userAnswer,
  onAnswerChange,
  mode,
  showResult = false,
}: QuestionRendererProps) {
  const renderQuestion = () => {
    switch (question.type) {
      case 'single':
        return (
          <SingleQuestionView
            question={question}
            userAnswer={userAnswer}
            onAnswerChange={onAnswerChange}
            mode={mode}
            showResult={showResult}
          />
        );
      case 'multiple':
        return (
          <MultipleQuestionView
            question={question}
            userAnswer={userAnswer}
            onAnswerChange={onAnswerChange}
            mode={mode}
            showResult={showResult}
          />
        );
      case 'text':
        return (
          <TextQuestionView
            question={question}
            userAnswer={userAnswer}
            onAnswerChange={onAnswerChange}
            mode={mode}
            showResult={showResult}
          />
        );
      case 'order':
        return (
          <OrderQuestionView
            question={question}
            userAnswer={userAnswer}
            onAnswerChange={onAnswerChange}
            mode={mode}
            showResult={showResult}
          />
        );
      default:
        return <div>Неизвестный тип вопроса</div>;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4">{question.text}</h2>
        {renderQuestion()}
      </CardContent>
    </Card>
  );
}
