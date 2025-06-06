import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import NewTodoPage from './components/NewTodoPage';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import TodoViews from './components/TodoViews';
import CountdownPage from './components/CountdownPage';
import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/todos"
            element={
              <PrivateRoute>
                <NewTodoPage />
              </PrivateRoute>
            }
          />
          <Route path="/views" element={<PrivateRoute><TodoViews /></PrivateRoute>} />
          <Route path="/countdown" element={<PrivateRoute><CountdownPage /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/todos" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
