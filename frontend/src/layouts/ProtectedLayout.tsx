import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from '../components/ui/Navbar';
import { retrieveToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';

function isTokenValid() {
  const token = retrieveToken();
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && Date.now() >= decoded.exp * 1000) return false;
    return true;
  } catch (e) {
    return false;
  }
}

export const ProtectedLayout = () => {
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center">
      <Navbar />
      <main className="flex-1 mx-auto w-5xl my-6">
        <Outlet />
      </main>
    </div>
  );
};