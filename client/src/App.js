// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from "@react-oauth/google";
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard';
import './App.css';
const API=process.env.REACT_APP_UR||"https://backend-7h0q.onrender.com";
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "732537579525-3k1mbq9pkitmb8kldvdorbaro097sv4u.apps.googleusercontent.com";

// const GOOGLE_CLIENT_ID = "732537579525-0vh7jkpkhp5c8dt4k6fh1aelcu53hame.apps.googleusercontent.com";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;