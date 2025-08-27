import React, { useState } from 'react';
import axios from 'axios';
import '../styles/comfort.css';
import { API_BASE_URL } from '../config';

function Login({ setUser }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    userType: 'customer'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let signupData = { ...formData };
      
      if (isSignUp && formData.userType === 'driver') {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000
            });
          });
          
          signupData.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          };
        } catch (gpsError) {
          signupData.location = {
            latitude: 33.5731,
            longitude: -7.5898,
            address: "Casablanca, Morocco"
          };
        }
      }
      
      const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, signupData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('loginTime', Date.now().toString());
      
      setUser(response.data.user);
    } catch (error) {
      alert(error.response?.data?.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="comfort-container">
      {/* Header */}
      <div className="comfort-header fade-in text-center">
        <div className="gentle-bounce" style={{
          width: '80px',
          height: '80px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '40px',
          backdropFilter: 'blur(10px)'
        }}>
          🚚
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
          SwiftDelivery
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>
          Your trusted delivery partner
        </p>
      </div>

      {/* Login Form */}
      <div style={{ padding: '24px', marginTop: '-20px' }}>
        <div className="comfort-card slide-up" style={{
          maxWidth: '400px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10
        }}>
          <h2 className="text-center mb-6" style={{ fontSize: '24px', fontWeight: '600' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="mb-4">
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: 'var(--text)'
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="comfort-input"
                />
              </div>
            )}

            <div className="mb-4">
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'var(--text)'
              }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="comfort-input"
              />
            </div>

            {isSignUp && (
              <div className="mb-4">
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: 'var(--text)'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="comfort-input"
                />
              </div>
            )}

            <div className="mb-4">
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'var(--text)'
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="comfort-input"
              />
            </div>

            {isSignUp && (
              <div className="mb-6">
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: 'var(--text)'
                }}>
                  Account Type
                </label>
                <select 
                  name="userType" 
                  value={formData.userType} 
                  onChange={handleInputChange}
                  className="comfort-input"
                >
                  <option value="customer">🛒 Customer</option>
                  <option value="driver">🚗 Driver</option>
                </select>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="comfort-button"
              style={{
                width: '100%',
                marginBottom: '20px',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <>
                  <div className="comfort-loading" style={{ marginRight: '8px' }}></div>
                  Please wait...
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--primary)', 
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        {/* Quick Demo */}
        <div className="comfort-card fade-in" style={{ 
          maxWidth: '400px', 
          margin: '16px auto 0',
          animationDelay: '0.2s'
        }}>
          <h3 className="text-center mb-4" style={{ fontSize: '16px', fontWeight: '600' }}>
            Quick Demo Access
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              onClick={() => setFormData({...formData, email: 'customer@test.com', password: 'password123'})}
              style={{
                padding: '12px',
                background: 'var(--background)',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.target.style.borderColor = 'var(--border)'}
            >
              🛒 Customer
            </button>
            <button 
              onClick={() => setFormData({...formData, email: 'driver@test.com', password: 'password123'})}
              style={{
                padding: '12px',
                background: 'var(--background)',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.target.style.borderColor = 'var(--border)'}
            >
              🚗 Driver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;