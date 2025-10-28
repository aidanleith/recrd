import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from '../components/ui/Navbar';

interface ProtectedLayoutProps {
  isAuthenticated: boolean;
}

export const ProtectedLayout = ({ isAuthenticated }: ProtectedLayoutProps) => {
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center">
      <Navbar />
      <main className="flex-1 mx-auto max-w-6xl mt-12">
        <Outlet />
      </main>
    </div>
  );
};