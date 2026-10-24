import { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { ToastProvider } from './components/Toast';
import { BottomNav } from './components/BottomNav';
import Home from './pages/Home';
import Pets from './pages/Pets';
import FoodDraw from './pages/FoodDraw';
import PlayDraw from './pages/PlayDraw';
import Records from './pages/Records';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <HashRouter>
          <ScrollToTop />
          <div className="app-shell">
            <main className="page-area">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pets" element={<Pets />} />
                <Route path="/food" element={<FoodDraw />} />
                <Route path="/play" element={<PlayDraw />} />
                <Route path="/records" element={<Records />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </HashRouter>
      </AppProvider>
    </ToastProvider>
  );
}
