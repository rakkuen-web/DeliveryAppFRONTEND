import React, { useState } from 'react';
import axios from 'axios';
import '../styles/neon.css';
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
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="cyber-bg"></div>
      
      {/* Floating Particles */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '20px', height: '20px', background: 'var(--neon-blue)', borderRadius: '50%', opacity: 0.6 }} className="float"></div>
      <div style={{ position: 'absolute', top: '20%', right: '15%', width: '15px', height: '15px', background: 'var(--neon-purple)', borderRadius: '50%', opacity: 0.4 }} className="float"></div>
      <div style={{ position: 'absolute', bottom: '30%', left: '20%', width: '25px', height: '25px', background: 'var(--neon-green)', borderRadius: '50%', opacity: 0.5 }} className="float"></div>

      <div style={{ padding: '40px 20px', position: 'relative', zIndex: 10 }}>
        {/* Cyber Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div className="float" style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(45deg, var(--neon-blue), var(--neon-purple))',
            borderRadius: '25px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            fontSize: '50px',
            boxShadow: '0 0 50px var(--neon-blue)'
          }}>
            🚀
          </div>
          <h1 className="cyber-text">NEXUS DELIVERY</h1>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--neon-blue)', 
            marginTop: '10px',
            fontFamily: 'Orbitron, monospace',
            letterSpacing: '2px'
          }}>
            QUANTUM SPEED • NEURAL PRECISION
          </p>
        </div>

        {/* Login Interface */}
        <div className="glass-card scan-lines" style={{ 
          maxWidth: '400px', 
          margin: '0 auto',
          position: 'relative'
        }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--neon-blue)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {isSignUp ? '◉ INITIALIZE USER' : '◉ ACCESS GRANTED'}
          </div>
          
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  name="name"
                  placeholder="NEURAL ID"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: 'rgba(0, 245, 255, 0.1)',
                    border: '2px solid var(--neon-blue)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'Orbitron, monospace',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 20px var(--neon-blue)'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <input
                type="email"
                name="email"
                placeholder="QUANTUM EMAIL"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'rgba(0, 245, 255, 0.1)',
                  border: '2px solid var(--neon-blue)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontFamily: 'Orbitron, monospace',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 20px var(--neon-blue)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>

            {isSignUp && (
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="tel"
                  name="phone"
                  placeholder="NEURAL LINK"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: 'rgba(0, 245, 255, 0.1)',
                    border: '2px solid var(--neon-blue)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'Orbitron, monospace',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 20px var(--neon-blue)'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <input
                type="password"
                name="password"
                placeholder="SECURITY CODE"
                value={formData.password}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'rgba(0, 245, 255, 0.1)',
                  border: '2px solid var(--neon-blue)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontFamily: 'Orbitron, monospace',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 20px var(--neon-blue)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>

            {isSignUp && (
              <div style={{ marginBottom: '25px' }}>
                <select 
                  name="userType" 
                  value={formData.userType} 
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: 'rgba(0, 245, 255, 0.1)',
                    border: '2px solid var(--neon-blue)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'Orbitron, monospace',
                    outline: 'none'
                  }}
                >
                  <option value="customer" style={{ background: '#1a1a2e' }}>🛒 CONSUMER UNIT</option>
                  <option value="driver" style={{ background: '#1a1a2e' }}>🚗 DELIVERY DRONE</option>
                </select>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="holo-btn"
              style={{
                width: '100%',
                marginBottom: '20px',
                opacity: loading ? 0.7 : 1,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="cyber-loading" style={{ marginRight: '10px' }}></div>
                  PROCESSING...
                </div>
              ) : (
                isSignUp ? '◉ INITIALIZE' : '◉ CONNECT'
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--neon-purple)', 
                fontSize: '12px',
                fontFamily: 'Orbitron, monospace',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {isSignUp ? '◉ EXISTING USER?' : '◉ NEW USER?'}
            </button>
          </div>
        </div>

        {/* Quick Access */}
        <div className="glass-card" style={{ 
          maxWidth: '400px', 
          margin: '20px auto 0',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            marginBottom: '15px', 
            color: 'var(--neon-green)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            ◉ DEMO ACCESS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              onClick={() => setFormData({...formData, email: 'customer@test.com', password: 'password123'})}
              className="holo-btn"
              style={{ fontSize: '12px', padding: '12px' }}
            >
              CONSUMER
            </button>
            <button 
              onClick={() => setFormData({...formData, email: 'driver@test.com', password: 'password123'})}
              className="holo-btn"
              style={{ fontSize: '12px', padding: '12px' }}
            >
              DRONE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;