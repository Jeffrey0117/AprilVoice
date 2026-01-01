import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TutorialPage from './pages/TutorialPage';
import AboutPage from './pages/AboutPage';
import VoiceApp from './pages/VoiceApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app" element={<VoiceApp />} />
        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
