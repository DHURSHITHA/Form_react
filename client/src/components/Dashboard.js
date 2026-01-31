// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserDetailsForm from './UserDetailsForm';
const API_URL=process.env.REACT_APP_URL ||"http://localhost:5000";
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hasDetails, setHasDetails] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Check if user has details
      checkUserDetails();
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const checkUserDetails = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found");
      return;
    }

    try {
      console.log("Checking user details...");
      const response = await fetch(`${API_URL}/api/user/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("User details response:", data);
        
        if (data.success && data.exists) {
          setHasDetails(true);
        } else {
          setHasDetails(false);
        }
      } else {
        console.error("Failed to check user details:", response.status);
        setHasDetails(false);
      }
    } catch (error) {
      console.error("Error checking user details:", error);
      setHasDetails(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate('/');
  };

  const handleFormToggle = () => {
    setShowForm(!showForm);
    if (!showForm) {
      checkUserDetails(); // Refresh details when showing form
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="simple-dashboard">
      <div className="dashboard-header">
        <h1>FinanceTrack Pro</h1>
        <div className="header-actions">
          <button
            className="profile-btn"
            onClick={handleFormToggle}
          >
            {showForm ? 'Hide Form' : hasDetails ? 'Update Profile' : 'Complete Profile'}
          </button>
          <button className="logout-btn" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="dashboard-container">
        {showForm ? (
          <UserDetailsForm 
            user={user} 
            onSuccess={() => {
              setHasDetails(true);
              setShowForm(false);
            }} 
          />
        ) : (
          <div className="welcome-container">
            <div className="welcome-card">
              <div className="success-icon-large">✓</div>
              <h2>Welcome back, {user?.name}!</h2>
              <p className="user-email">{user?.email}</p>

              <div className="user-stats">
                <div className="stat-card">
                  <h3>Profile Status</h3>
                  <p className={`status ${hasDetails ? 'complete' : 'incomplete'}`}>
                    {hasDetails ? 'Complete' : 'Incomplete'}
                  </p>
                  <button
                    className="action-btn"
                    onClick={handleFormToggle}
                  >
                    {hasDetails ? 'Update Profile' : 'Complete Now'}
                  </button>
                </div>

                <div className="stat-card">
                  <h3>Member Since</h3>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {hasDetails && (
                <div className="profile-complete-message">
                  <p className="success-text">✅ Your profile is complete!</p>
                  <p className="sub-text">You can update your information anytime.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;