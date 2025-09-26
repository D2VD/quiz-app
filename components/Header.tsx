
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../constants';
import { LogOut, UserCircle } from './icons';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              QuizPlatform
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            {user?.role === UserRole.TEACHER && (
              <Link to="/teacher" className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Dashboard Giáo viên
              </Link>
            )}
             {user?.role === UserRole.STUDENT && (
              <Link to="/" className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Dashboard Học sinh
              </Link>
            )}
          </nav>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                 <span className="flex items-center text-gray-700 dark:text-gray-200">
                    <UserCircle className="w-5 h-5 mr-2"/>
                    {user.fullName}
                 </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
