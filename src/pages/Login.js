import React, { useState } from 'react';
import axios from 'axios';

import { API_URL } from '../config';

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
      const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
      const response = await axios.post(`${API_URL}${endpoint}`, formData);
      
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
    <div className="container">
      {/* Header */}
      <div className="indrive-header" style={{ textAlign: 'center', paddingBottom: '40px' }}>
        <img 
          src="/logo.png" 
          alt="Delivery Connect" 
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '16px',
            marginBottom: '16px'
          }}
        />
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          DeliveryConnect
        </h1>
        <p style={{ fontSize: '16px', opacity: '0.9' }}>
          Get anything delivered fast
        </p>
      </div>

      {/* Login Form */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: '600',
            color: '#333'
          }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            {isSignUp && (
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            {isSignUp && (
              <div style={{ marginBottom: '20px' }}>
                <select 
                  name="userType" 
                  value={formData.userType} 
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="customer">Customer</option>
                  <option value="driver">Driver</option>
                </select>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '16px'
              }}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#28a745', 
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        {/* Quick Login */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#333' }}>Quick Test Login</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              onClick={() => setFormData({...formData, email: 'customer@test.com', password: 'password123'})}
              style={{
                padding: '12px',
                background: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Customer
            </button>
            <button 
              onClick={() => setFormData({...formData, email: 'driver@test.com', password: 'password123'})}
              style={{
                padding: '12px',
                background: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Driver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;