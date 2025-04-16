// Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { token, user, logout } = useAuth();
  const location = useLocation();

  // Don't render navigation if not authenticated
  if (!token || !user) return null;

  // Determine if link is active
  const isActive = (path) => {
    return location.pathname === path ? "border-b-2 border-blue-400" : "";
  };

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">⏱️</span>
              <span className="font-bold text-xl tracking-tight">EmployeeTracker Pro</span>
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link to="/dashboard" className={`py-2 px-1 hover:text-blue-300 transition-colors ${isActive('/dashboard')}`}>
                Dashboard
              </Link>
              {user?.role === 'Admin' && (
                <Link to="/reports" className={`py-2 px-1 hover:text-blue-300 transition-colors ${isActive('/reports')}`}>
                  Reports
                </Link>
              )}
              {user?.role === 'Admin' && (
                <Link to="/users" className={`py-2 px-1 hover:text-blue-300 transition-colors ${isActive('/users')}`}>
                  Users
                </Link>
              )}
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <Link to="/assign-task" className={`py-2 px-1 hover:text-blue-300 transition-colors ${isActive('/assign-task')}`}>
                  Assign Task
                </Link>
              )}
              {user?.role === 'Employee' && (
                <Link to="/my-tasks" className={`py-2 px-1 hover:text-blue-300 transition-colors ${isActive('/my-tasks')}`}>
                  My Tasks
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-blue-800 rounded-full px-3 py-1">
              <span className="mr-2">👤</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <button 
              onClick={logout} 
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;