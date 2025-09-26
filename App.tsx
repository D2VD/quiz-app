import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { UserRole } from './constants';
import CreateClass from './pages/teacher/CreateClass';
import CreateTest from './pages/teacher/CreateTest';
import TestContainer from './pages/student/TestContainer';
import TestEditor from './pages/teacher/TestEditor';
import TestReview from './pages/student/TestReview';

const App: React.FC = () => {
  return (
    <Router>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
        <Header />
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher"
              element={
                <ProtectedRoute roles={[UserRole.TEACHER]}>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/create-class"
              element={
                <ProtectedRoute roles={[UserRole.TEACHER]}>
                  <CreateClass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/create-test/:classId"
              element={
                <ProtectedRoute roles={[UserRole.TEACHER]}>
                  <CreateTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/edit-test/:testId"
              element={
                <ProtectedRoute roles={[UserRole.TEACHER]}>
                  <TestEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/:testId"
              element={
                <ProtectedRoute>
                  <TestContainer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/review/:testId"
              element={
                <ProtectedRoute>
                  <TestReview />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
