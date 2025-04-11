// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/layout/Navbar';

import AssignTask from './pages/AssignTask';
import MyTasks from './pages/MyTasks';
import AdminReports from './pages/AdminReports';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<div>Unauthorized</div>} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['Admin', 'Manager', 'Employee']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/assign-task" element={
            <ProtectedRoute roles={['Admin', 'Manager']}>
              <AssignTask />
            </ProtectedRoute>
          } />

          <Route path="/my-tasks" element={
            <ProtectedRoute roles={['Employee']}>
              <MyTasks />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute roles={['Admin']}>
              <AdminReports />
            </ProtectedRoute>
          } />

          {/* 404 Fallback */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;