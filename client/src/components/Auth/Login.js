// src/components/Auth/Login.js
import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from "@react-oauth/google";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


   useEffect(() => {
    console.log("🔍 API_URL from environment:", API_URL);
    console.log("🔍 Full process.env:", process.env);
    console.log("🔍 REACT_APP_API_URL:", process.env.REACT_APP_API_URL);
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!form.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!form.password.trim()) {
      setError('Password is required');
      return false;
    }
    
    if (!isLogin && !form.name.trim()) {
      setError('Full name is required');
      return false;
    }
    
    return true;
  };

  const register = async () => {
    clearMessages();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        })
      });
      
      const data = await response.json();
      console.log("Register response:", data);
      
      if (data.success) {
        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        setSuccess('Registration successful!');
        
        // Navigate to dashboard after 1 second
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Register error:", err);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    clearMessages();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });
      
      const data = await response.json();
      console.log("Login response:", data);
      
      if (data.success) {
        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        navigate('/dashboard');
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credentialResponse) => {
    clearMessages();
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: credentialResponse.credential
        })
      });
      
      const data = await response.json();
      console.log("Google login response:", data);
      
      if (data.success) {
        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        navigate('/dashboard');
      } else {
        setError(data.message || "Google sign-in failed");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (isLogin) {
        login();
      } else {
        register();
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="card-header">
          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p className="card-subtitle">
            {isLogin ? "Sign in to continue" : "Join our community"}
          </p>
        </div>
        
        <p className="switch-mode">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => {
            setIsLogin(!isLogin);
            clearMessages();
            setForm({ name: "", email: "", password: "" });
          }}>
            {isLogin ? " Create one" : " Sign in"}
          </span>
        </p>

        {error && (
          <div className="error-message">
            <div className="error-icon">!</div>
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <span>{success}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <div className="google-login-wrapper">
          <GoogleLogin
            onSuccess={googleLogin}
            onError={() => setError("Google sign-in failed. Please try again.")}
            theme="filled_blue"
            size="large"
            text={isLogin ? "signin_with" : "signup_with"}
            shape="rectangular"
            width="300"
          />
        </div>
        
        <div className="divider">
          <span>or continue with email</span>
        </div>

        <div className="input-container">
          {!isLogin && (
            <>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="input"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  clearMessages();
                }}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </>
          )}
          
          <label className="input-label">Email Address</label>
          <input
            type="email"
            placeholder="hello@example.com"
            className="input"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              clearMessages();
            }}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          
          <label className="input-label">Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="input"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                clearMessages();
              }}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <span 
              className="show-toggle" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
        </div>

        <button 
          className={`btn primary ${loading ? 'loading' : ''}`} 
          onClick={isLogin ? login : register}
          disabled={loading}
        >
          {loading ? (
            <span className="btn-text">
              <span className="loading-spinner"></span>
              Processing...
            </span>
          ) : (
            isLogin ? "Sign In" : "Create Account"
          )}
        </button>

        <p className="terms">
          By continuing, you agree to our 
          <a href="/terms"> Terms</a> and 
          <a href="/privacy"> Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;