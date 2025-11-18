import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Navigate, Routes } from 'react-router-dom';
import './App.css';
import { ProtectedLayout } from './layouts/ProtectedLayout';

// Lazy load all page components for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const AlbumPage = lazy(() => import('./pages/AlbumPage'));
const RankAlbumPage = lazy(() => import('./pages/RankAlbumPage'));
const FollowersListPage = lazy(() => import('./pages/FollowersListPage'));
const FollowingListPage = lazy(() => import('./pages/FollowingListPage'));
const UserRankingsPage = lazy(() => import('./pages/UserRankingsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="text-white">Loading...</div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/verify' element={<VerifyPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path='/reset-password/:token' element={<ResetPasswordPage />} />
          {/* Protected routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path='/home' element={<HomePage />} />
            <Route path='/profile/followers' element={<FollowersListPage />} />
            <Route path='/profile/following' element={<FollowingListPage />} />
            <Route path='/profile/:username/followers' element={<FollowersListPage />} />
            <Route path='/profile/:username/following' element={<FollowingListPage />} />
            <Route path='/profile/:username/rankings' element={<UserRankingsPage />} />
            <Route path='/profile/rankings' element={<UserRankingsPage />} />
            <Route path='/profile' element={<ProfilePage />} />
            <Route path='/profile/:username' element={<ProfilePage />} />
            <Route path='/search' element={<SearchPage />} />
            <Route path='/leaderboard' element={<LeaderboardPage />} />
            <Route path='/album/:id' element={<AlbumPage />} />
            <Route path='/album/:id/rank' element={<RankAlbumPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;