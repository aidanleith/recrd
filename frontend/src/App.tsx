import { BrowserRouter as Router, Route, Navigate, Routes } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CardPage from './pages/CardPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage'
import { ProtectedLayout } from './layouts/ProtectedLayout';
import VerifyPage from './pages/VerifyPage';
import SearchPage from './pages/SearchPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/verify' element={<VerifyPage />} />
        <Route path='/reset-password/:token' element={<ResetPasswordPage />} />
        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/cards" element={<CardPage />} />
          <Route path='/home' element={<HomePage />} />
          <Route path='/profile' element={<ProfilePage />} />
          <Route path='/search' element={<SearchPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;