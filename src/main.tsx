import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EditorPage } from './pages/EditorPage';
import { QuizPage } from './pages/QuizPage';
import { QuizResultPage } from './pages/QuizResultPage';

// Получаем базовый путь (должен совпадать с vite.config.ts)
const basename = import.meta.env.VITE_BASE_PATH || '/web-tester/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/editor/:testId" element={<EditorPage />} />
        <Route path="/quiz/:testId/:mode?" element={<QuizPage />} />
        <Route path="/quiz/:testId/result" element={<QuizResultPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
