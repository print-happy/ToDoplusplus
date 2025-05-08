import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Login from './components/Login';
import Register from './components/Register';
import TodoList from './components/TodoList';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import TodoViews from './components/TodoViews';
import CountdownPage from './components/CountdownPage';
import './App.css';

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout className="layout">
          <Navbar />
          <Content style={{ padding: '0 50px', marginTop: 64 }}>
            <div className="site-layout-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/todos"
                  element={
                    <PrivateRoute>
                      <TodoList />
                    </PrivateRoute>
                  }
                />
                <Route path="/views" element={<PrivateRoute><TodoViews /></PrivateRoute>} />
                <Route path="/countdown" element={<PrivateRoute><CountdownPage /></PrivateRoute>} />
                <Route path="/" element={<Navigate to="/todos" replace />} />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;
