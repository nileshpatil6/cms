import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import UserComplaintForm from './pages/UserComplaintForm';
import AgentDashboard from './pages/AgentDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NavBar from './components/NavBar';

function PrivateRoute({ children }) {
  const isAuthenticated = localStorage.getItem('accessToken');
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if access token exists in localStorage on component mount
    if (localStorage.getItem('accessToken')) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="App">
        <NavBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <AgentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/submit-complaint"
            element={
              <PrivateRoute>
                <UserComplaintForm />
              </PrivateRoute>
            }
          />
          {/* Redirect root to login if not logged in, or dashboard if logged in */}
          <Route
            path="/"
            element={isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
