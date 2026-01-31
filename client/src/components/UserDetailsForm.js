// src/components/UserDetailsForm.js
import React, { useState, useEffect } from 'react';
import './UserDetailsForm.css';
const API=process.env.REACT_APP_URL || "http://localhost:5000";
const UserDetailsForm = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    dob: '',
    gender: '',
    maritalStatus: '',
    occupation: '',
    company: '',
    annualIncome: '',
    investmentExperience: '',
    riskTolerance: '',
    goals: [],
    preferredCommunication: [],
    acceptTerms: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingData, setExistingData] = useState(null);
  const [missingFields, setMissingFields] = useState([]);

  // Predefined options
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
  const occupationOptions = [
    'Student',
    'Employed (Private)',
    'Employed (Government)',
    'Self-Employed',
    'Business Owner',
    'Retired',
    'Unemployed',
    'Other'
  ];
  const incomeOptions = [
    'Below ₹2,50,000',
    '₹2,50,000 - ₹5,00,000',
    '₹5,00,001 - ₹10,00,000',
    '₹10,00,001 - ₹20,00,000',
    'Above ₹20,00,000'
  ];
  const experienceOptions = [
    'Beginner (0-2 years)',
    'Intermediate (2-5 years)',
    'Advanced (5+ years)',
    'Professional'
  ];
  const riskOptions = [
    'Conservative (Low Risk)',
    'Moderate',
    'Aggressive (High Risk)',
    'Very Aggressive'
  ];
  const goalOptions = [
    'Wealth Creation',
    'Retirement Planning',
    'Children\'s Education',
    'Home Purchase',
    'Tax Saving',
    'Emergency Fund',
    'Travel',
    'Other'
  ];
  const communicationOptions = ['Email', 'SMS', 'WhatsApp', 'Phone Call'];

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      console.log("Fetching user details...");
      const response = await fetch(`${API}/api/user/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Fetch response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched data:", data);
        
        if (data.success && data.exists && data.details) {
          setExistingData(data.details);
          setFormData(prev => ({
            ...prev,
            ...data.details,
            goals: data.details.goals || [],
            preferredCommunication: data.details.preferredCommunication || []
          }));
        }
      } else {
        const errorData = await response.json();
        console.error("Fetch error:", errorData);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'acceptTerms') {
        setFormData(prev => ({ ...prev, [name]: checked }));
      } else if (name.includes('goals')) {
        const optionValue = e.target.value;
        setFormData(prev => ({
          ...prev,
          goals: checked
            ? [...prev.goals, optionValue]
            : prev.goals.filter(item => item !== optionValue)
        }));
      } else if (name.includes('communication')) {
        const optionValue = e.target.value;
        setFormData(prev => ({
          ...prev,
          preferredCommunication: checked
            ? [...prev.preferredCommunication, optionValue]
            : prev.preferredCommunication.filter(item => item !== optionValue)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
    
    // Remove field from missing fields if it's being filled
    setMissingFields(prev => prev.filter(field => field !== name));
  };

  const validateForm = () => {
    const requiredFields = [
      'fullName',
      'phone',
      'dob',
      'gender',
      'maritalStatus',
      'occupation',
      'annualIncome',
      'investmentExperience',
      'riskTolerance'
    ];
    
    const missing = [];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        missing.push(field);
      }
    });
    
    // Check arrays
    if (formData.goals.length === 0) missing.push('goals');
    if (formData.preferredCommunication.length === 0) missing.push('preferredCommunication');
    if (!formData.acceptTerms) missing.push('acceptTerms');
    
    setMissingFields(missing);
    
    if (missing.length > 0) {
      setError(`Please fill in all required fields. Missing: ${missing.length} field(s)`);
      return false;
    }
    
    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!phoneRegex.test(phoneDigits)) {
      setError('Please enter a valid 10-digit Indian phone number');
      setMissingFields(prev => [...prev, 'phone']);
      return false;
    }
    
    // Date of birth validation
    const dob = new Date(formData.dob);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    
    if (age < 18) {
      setError('You must be at least 18 years old');
      setMissingFields(prev => [...prev, 'dob']);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Form submission started...");
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        setSaving(false);
        return;
      }
      
      const method = existingData ? 'PUT' : 'POST';
      const endpoint = `${API}/api/user/details`;
      
      console.log("Submitting to:", endpoint);
      console.log("Method:", method);
      console.log("Form data:", formData);
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (response.ok && data.success) {
        setSuccess(data.message || 'Details saved successfully!');
        setExistingData(formData);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500);
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || `Failed to save details. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="form-loading">
        <div className="loading-spinner"></div>
        <p>Loading your details...</p>
      </div>
    );
  }

  return (
    <div className="user-details-container">
      <div className="details-header">
        <h2>
          <span className="header-icon"></span>
          {existingData ? 'Update Your Profile' : 'Complete Your Profile'}
        </h2>
        <p className="header-subtitle">
          {existingData 
            ? 'Update your information below. All fields are required unless marked optional.'
            : 'Please fill in all required details to get personalized financial insights.'
          }
        </p>
        
        {error && (
          <div className="error-message">
            <div className="error-icon"></div>
            <div>
              <strong>Error:</strong> {error}
              {missingFields.length > 0 && (
                <div className="missing-fields">
                  <p>Missing fields:</p>
                  <div className="missing-fields-list">
                    {missingFields.map(field => (
                      <span key={field} className="missing-field-tag">{field}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <span>{success}</span>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="details-form" noValidate>
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon"></span>
            Personal Information
          </h3>
          
          <div className="form-grid">
            <div className={`form-group ${missingFields.includes('fullName') ? 'missing' : ''}`}>
              <label className="form-label">
                Full Name *
                {missingFields.includes('fullName') && <span className="required-star"> *</span>}
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="form-input"
                disabled={saving}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="form-input disabled"
              />
              <small className="input-note">Cannot be changed</small>
            </div>
            
            <div className={`form-group ${missingFields.includes('phone') ? 'missing' : ''}`}>
              <label className="form-label">
                Phone Number *
                {missingFields.includes('phone') && <span className="required-star"> *</span>}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="10-digit mobile number"
                className="form-input"
                disabled={saving}
                maxLength="10"
              />
            </div>
            
            <div className={`form-group ${missingFields.includes('dob') ? 'missing' : ''}`}>
              <label className="form-label">
                Date of Birth *
                {missingFields.includes('dob') && <span className="required-star"> *</span>}
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="form-input"
                disabled={saving}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className={`form-group ${missingFields.includes('gender') ? 'missing' : ''}`}>
              <label className="form-label">
                Gender *
                {missingFields.includes('gender') && <span className="required-star"> *</span>}
              </label>
              <div className="radio-group">
                {genderOptions.map(option => (
                  <label key={option} className="radio-label">
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={formData.gender === option}
                      onChange={handleInputChange}
                      disabled={saving}
                      className="radio-input"
                    />
                    <span className="radio-custom"></span>
                    {option}
                  </label>
                ))}
              </div>
            </div>
            
            <div className={`form-group ${missingFields.includes('maritalStatus') ? 'missing' : ''}`}>
              <label className="form-label">
                Marital Status *
                {missingFields.includes('maritalStatus') && <span className="required-star"> *</span>}
              </label>
              <div className="radio-group">
                {maritalStatusOptions.map(option => (
                  <label key={option} className="radio-label">
                    <input
                      type="radio"
                      name="maritalStatus"
                      value={option}
                      checked={formData.maritalStatus === option}
                      onChange={handleInputChange}
                      disabled={saving}
                      className="radio-input"
                    />
                    <span className="radio-custom"></span>
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon"></span>
            Professional Information
          </h3>
          
          <div className="form-grid">
            <div className={`form-group ${missingFields.includes('occupation') ? 'missing' : ''}`}>
              <label className="form-label">
                Occupation *
                {missingFields.includes('occupation') && <span className="required-star"> *</span>}
              </label>
              <select
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                className="form-select"
                disabled={saving}
                style={{ color: '#f8fff8' ,background:'#120202'}}
              >
                <option value="">Select Occupation</option>
                {occupationOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Company / Organization (Optional)</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Where do you work?"
                className="form-input"
                disabled={saving}
              />
            </div>
            
            <div className={`form-group ${missingFields.includes('annualIncome') ? 'missing' : ''}`}>
              <label className="form-label">
                Annual Income *
                {missingFields.includes('annualIncome') && <span className="required-star"> *</span>}
              </label>
              <select
                name="annualIncome"
                value={formData.annualIncome}
                onChange={handleInputChange}
                className="form-select"
                disabled={saving}
                style={{ color: '#f8fff8' ,background:'#120202'}}
              >
                <option value="">Select Income Range</option>
                {incomeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">📈</span>
            Financial Preferences
          </h3>
          
          <div className="form-grid">
            <div className={`form-group ${missingFields.includes('investmentExperience') ? 'missing' : ''}`}>
              <label className="form-label">
                Investment Experience *
                {missingFields.includes('investmentExperience') && <span className="required-star"> *</span>}
              </label>
              <div className="radio-group vertical">
                {experienceOptions.map(option => (
                  <label key={option} className="radio-label">
                    <input
                      type="radio"
                      name="investmentExperience"
                      value={option}
                      checked={formData.investmentExperience === option}
                      onChange={handleInputChange}
                      disabled={saving}
                      className="radio-input"
                    />
                    <span className="radio-custom"></span>
                    {option}
                  </label>
                ))}
              </div>
            </div>
            
            <div className={`form-group ${missingFields.includes('riskTolerance') ? 'missing' : ''}`}>
              <label className="form-label">
                Risk Tolerance *
                {missingFields.includes('riskTolerance') && <span className="required-star"> *</span>}
              </label>
              <div className="radio-group vertical">
                {riskOptions.map(option => (
                  <label key={option} className="radio-label">
                    <input
                      type="radio"
                      name="riskTolerance"
                      value={option}
                      checked={formData.riskTolerance === option}
                      onChange={handleInputChange}
                      disabled={saving}
                      className="radio-input"
                    />
                    <span className="radio-custom"></span>
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Financial Goals * (Select at least one)
              {missingFields.includes('goals') && <span className="required-star"> *</span>}
            </label>
            <div className="checkbox-group">
              {goalOptions.map(option => (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    name={`goals-${option}`}
                    value={option}
                    checked={formData.goals.includes(option)}
                    onChange={handleInputChange}
                    disabled={saving}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  {option}
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">📱</span>
            Communication Preferences
          </h3>
          
          <div className="form-group">
            <label className="form-label">
              Preferred Communication Channels * (Select at least one)
              {missingFields.includes('preferredCommunication') && <span className="required-star"> *</span>}
            </label>
            <div className="checkbox-group">
              {communicationOptions.map(option => (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    name={`communication-${option}`}
                    value={option}
                    checked={formData.preferredCommunication.includes(option)}
                    onChange={handleInputChange}
                    disabled={saving}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  {option}
                </label>
              ))}
            </div>
          </div>
          
          <div className={`form-group terms-group ${missingFields.includes('acceptTerms') ? 'missing' : ''}`}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                disabled={saving}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="terms-text">
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and 
                <a href="/privacy" target="_blank" rel="noopener noreferrer"> Privacy Policy</a> *
              </span>
            </label>
            {missingFields.includes('acceptTerms') && (
              <span className="error-text">You must accept the terms and conditions</span>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={() => window.history.back()}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`btn primary ${saving ? 'loading' : ''}`}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="loading-spinner"></span>
                Saving...
              </>
            ) : (
              existingData ? 'Update Profile' : 'Save & Continue'
            )}
          </button>
        </div>
        
        <div className="form-footer">
          <p className="form-note">
            <span className="note-icon">ℹ️</span>
            Fields marked with * are required. Your information is secure and encrypted.
          </p>
        </div>
      </form>
    </div>
  );
};

export default UserDetailsForm;