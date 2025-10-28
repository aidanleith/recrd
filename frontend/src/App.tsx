import { BrowserRouter as Router, Route, Navigate, Routes } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import CardPage from './pages/CardPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage'
import { ProtectedLayout } from './layouts/ProtectedLayout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to handle login success
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />

        {/* Protected routes */}
        <Route element={<ProtectedLayout isAuthenticated={isAuthenticated} />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/cards" element={<CardPage />} />
          <Route path='/home' element={<HomePage />} />
          <Route path='/profile' element={<ProfilePage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;