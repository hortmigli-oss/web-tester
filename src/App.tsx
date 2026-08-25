import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
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
          to="/editor"
          className="p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Конструктор тестов</h2>
          <p className="text-muted-foreground">
            Создавайте и редактируйте тесты с различными типами вопросов
          </p>
        </Link>
        <Link
          to="/quiz"
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
    <BrowserRouter basename="/web-tester">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/:attemptId/result" element={<QuizResultPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
