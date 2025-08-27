import React, { useState } from 'react';
import axios from 'axios';
import '../styles/glovo.css';
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
    <div className="glovo-container">
      {/* Glovo Header */}
      <div className="glovo-header fade-in" style={{ textAlign: 'center' }}>
        <div className="pulse" style={{
          width: '80px',
          height: '80px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '40px',
          backdropFilter: 'blur(10px)'
        }}>
          🚀
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
          DeliveryPro
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>
          Fast & Reliable Delivery
        </p>
      </div>

      {/* Login Card */}
      <div style={{ padding: '20px', marginTop: '-20px' }}>
        <div className="glovo-card slide-up" style={{
          position: 'relative',
          zIndex: 10,
          padding: '30px'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            {isSignUp ? 'Join DeliveryPro' : 'Welcome Back'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="glovo-input"
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="glovo-input"
              />
            </div>

            {isSignUp && (
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="glovo-input"
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="glovo-input"
              />
            </div>

            {isSignUp && (
              <div style={{ marginBottom: '25px' }}>
                <select 
                  name="userType" 
                  value={formData.userType} 
                  onChange={handleInputChange}
                  className="glovo-input"
                >
                  <option value="customer">🛒 Customer</option>
                  <option value="driver">🚗 Driver</option>
                </select>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="glovo-button"
              style={{
                width: '100%',
                marginBottom: '20px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '⏳ Please wait...' : (isSignUp ? '🚀 Create Account' : '🔑 Sign In')}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--primary)', 
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        {/* Quick Test Login */}
        <div className="glovo-card fade-in" style={{ animationDelay: '0.3s' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px', textAlign: 'center' }}>
            🚀 Quick Demo Access
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              onClick={() => setFormData({...formData, email: 'customer@test.com', password: 'password123'})}
              style={{
                padding: '15px',
                background: '#F8F9FA',
                border: '2px solid var(--border)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              🛒 Customer
            </button>
            <button 
              onClick={() => setFormData({...formData, email: 'driver@test.com', password: 'password123'})}
              style={{
                padding: '15px',
                background: '#F8F9FA',
                border: '2px solid var(--border)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
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