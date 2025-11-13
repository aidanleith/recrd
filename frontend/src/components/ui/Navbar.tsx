// Removed "use client";
import { useState, useEffect } from 'react';
// 1. Swapped imports from next/link and next/navigation
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconUser } from "../../../public/icons/IconUser";
import { IconHome } from "../../../public/icons/IconHome";
import { IconAddCircle } from "../../../public/icons/IconAddCircle";
import { IconList } from "../../../public/icons/IconList";
import { IconSearch } from "../../../public/icons/IconSearch";
import { IconTrophy } from "../../../public/icons/IconTrophy";
import { buildPath } from '../Path';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  // 2. Swapped usePathname() for useLocation()
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user's username
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.id) {
          fetch(buildPath(`api/userById/${user.id}`))
            .then(res => res.json())
            .then(data => {
              if (data.username) {
                setCurrentUsername(data.username);
              }
            })
            .catch(err => console.error('Error fetching username:', err));
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentUsername) {
      navigate(`/profile/${currentUsername}`);
    } else {
      // Fallback: try to get username first
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.id) {
            fetch(buildPath(`api/userById/${user.id}`))
              .then(res => res.json())
              .then(data => {
                if (data.username) {
                  navigate(`/profile/${data.username}`);
                } else {
                  navigate('/profile');
                }
              })
              .catch(() => navigate('/profile'));
          }
        } catch {
          navigate('/profile');
        }
      } else {
        navigate('/profile');
      }
    }
  };

  const handleRankingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentUsername) {
      navigate(`/profile/${currentUsername}/rankings`);
    } else {
      // Fallback: try to get username first
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.id) {
            fetch(buildPath(`api/userById/${user.id}`))
              .then(res => res.json())
              .then(data => {
                if (data.username) {
                  navigate(`/profile/${data.username}/rankings`);
                } else {
                  navigate('/profile/rankings');
                }
              })
              .catch(() => navigate('/profile/rankings'));
          }
        } catch {
          navigate('/profile/rankings');
        }
      } else {
        navigate('/profile/rankings');
      }
    }
  };

  return (
    // 3. Fixed border-b-1 to border-b
    <nav className="shadow-sm bg-background border-b border-[var(--border)]/10">
      <div className="mx-auto max-w-5xl">
        <div className="flex h-16 justify-between w-full">
          <div className="flex justify-between w-full">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-3xl font-bold text-(--primary)">
                  recrd
                </span>
              </Link>
            </div>

            {/* Buttons */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* <Link
                to="/add" // 4. Changed href -> to
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive('/add')
                    ? 'border-primary text-(--primary)' // 5. Fixed Tailwind classes
                    : 'border-transparent text-gray-500 hover:border-primary hover:text-(--primary)' // 5. Fixed
                }`}
              >
                <IconAddCircle className="w-8 h-8" />
              </Link> */}
              <Link
                to="/home" // 4. Changed href -> to
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive('/home')
                    ? 'border-primary text-(--primary)' // 5. Fixed
                    : 'border-transparent text-gray-500 hover:border-primary hover:text-(--primary)' // 5. Fixed
                }`}
              >
                <IconHome className="w-7 h-7" />
              </Link>
              <button
                onClick={handleRankingsClick}
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  pathname.includes('/rankings')
                    ? 'border-primary text-(--primary)' // 5. Fixed
                    : 'border-transparent text-gray-500 hover:border-primary hover:text-(--primary)' // 5. Fixed
                }`}
              >
                <IconList className="w-7 h-7" />
              </button>
              <Link
                to="/search" // 4. Changed href -> to
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive('/search')
                    ? 'border-primary text-(--primary)' // 5. Fixed
                    : 'border-transparent text-gray-500 hover:border-primary hover:text-(--primary)' // 5. Fixed
                }`}
              >
                <IconSearch className="w-7 h-7" />
              </Link>
              <Link
                to="/leaderboard" // 4. Changed href -> to
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive('/leaderboard')
                    ? 'border-primary text-(--primary)' // 5. Fixed
                    : 'border-transparent text-gray-500 hover:border-primary hover:text-(--primary)' // 5. Fixed
                }`}
              >
                <IconTrophy className='w-7 h-7'/>
              </Link>
              <button
                onClick={handleProfileClick}
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  pathname.startsWith('/profile') && !pathname.includes('/rankings') && !pathname.includes('/followers') && !pathname.includes('/following')
                    ? 'border-primary text-(--primary)' // 5. Fixed
                    : 'border-transparent text-gray-500 hover:border-primary hover:text-(--primary)' // 5. Fixed
                }`}
              >
                <IconUser className="w-7 h-7" />
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            <Link
              to="/features" // 4. Changed href -> to
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            >
              Features
            </Link>
            <Link
              to="/pricing" // 4. Changed href -> to
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            >
              Pricing
            </Link>
            <Link
              to="/about" // 4. Changed href -> to
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            >
              About
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};