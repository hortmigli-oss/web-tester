import { Routes, Route, Link } from 'react-router-dom'
import { EditorPage } from './pages/EditorPage'
import { QuizPage } from './pages/QuizPage'
import { QuizResultPage } from './pages/QuizResultPage'
import './index.css'

function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Web Tester</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/web-tester/editor"
          className="p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Конструктор тестов</h2>
          <p className="text-muted-foreground">
            Создавайте и редактируйте тесты с различными типами вопросов
          </p>
        </Link>
        <Link
          to="/web-tester/quiz"
          className="p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Пройти тест</h2>
          <p className="text-muted-foreground">
            Выберите тест для прохождения в режиме практики или экзамена
          </p>
        </Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/web-tester/" element={<HomePage />} />
      <Route path="/web-tester/editor/:testId?" element={<EditorPage />} />
      <Route path="/web-tester/quiz/:testId/:mode?" element={<QuizPage />} />
      <Route path="/web-tester/result/:attemptId" element={<QuizResultPage />} />
    </Routes>
  )
}

export default App
