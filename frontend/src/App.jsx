import React, { useState, useEffect } from 'react';
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Main from "./pages/Main.jsx";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ProtectedRoute from './pages/ProtectedRoute.jsx';
import "./App.css"; 

const App = () => {
  // Check if user is logged in initially
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("user"));

  // Listen for changes in localStorage to keep state in sync
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!localStorage.getItem("user"));
    };

    // Triggered if custom events occur or when routing changes state
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    window.location.href = "/login"; // Redirect and reset state fully
  };

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        {/* Modern Blurry Header */}
        <header className="navbar">
          <div className="nav-container">
            <div className="logo-section">
              <div className="logo-icon"></div>
              <span className="logo-text">Velo<span>Chat</span></span>

            </div>
            
            <nav className="nav-links">
              {isLoggedIn ? (
                /* Show ONLY logout button when logged in */
                <button onClick={handleLogout} className="nav-btn logout-btn">
                  Logout
                </button>
              ) : (
                /* Show authentication options when logged out */
                <>
                  <NavLink to="/login" className={({ isActive }) => isActive ? "nav-btn active-login" : "nav-btn"}>
                    Sign In
                  </NavLink>
                  <NavLink to="/register" className={({ isActive }) => isActive ? "nav-btn active-register" : "nav-btn register-cta"}>
                    Get Started
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Dynamic Viewport Surface */}
        <main className="main-content">
          <div className="glow-ambient"></div>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/Home" element={
              <ProtectedRoute>
                <Main />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;