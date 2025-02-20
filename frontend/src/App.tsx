import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Navigation, ClosetView, GoalsView, DiaryView } from './components';

function App() {
  return (
    <Router>
      <Layout>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/closet" replace />} />
          <Route path="/closet" element={<ClosetView />} />
          <Route path="/goals" element={<GoalsView />} />
          <Route path="/diary" element={<DiaryView />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;