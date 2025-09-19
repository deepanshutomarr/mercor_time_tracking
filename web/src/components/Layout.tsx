import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Clock, User, LogOut, Download } from 'lucide-react'

const Layout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">
                  Mercor Time Tracking
                </span>
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Home
              </Link>
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === '/dashboard'
                        ? 'text-primary-600'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/download"
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === '/download'
                        ? 'text-primary-600'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Download App
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="btn btn-ghost btn-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary btn-sm"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 Mercor Time Tracking. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
