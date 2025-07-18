import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NavBar({ isLoggedIn, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Complaint System</Link>
      <ul className="navbar-nav">
        {!isLoggedIn ? (
          <>
            <li className="nav-item">
              <Link to="/login" className="nav-link">Login</Link>
            </li>
            <li className="nav-item">
              <Link to="/register" className="nav-link">Register</Link>
            </li>
          </>
        ) : (
          <>
            <li className="nav-item">
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link to="/submit-complaint" className="nav-link">Submit Complaint</Link>
            </li>
            <li className="nav-item">
              <button onClick={handleLogoutClick} className="nav-link logout-button">Logout</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default NavBar;