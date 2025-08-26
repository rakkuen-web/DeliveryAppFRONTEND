import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationSystem from '../components/NotificationSystem';

import { API_BASE_URL } from '../config';

function Profile({ user, setUser }) {
  const [homeAddress, setHomeAddress] = useState(user?.homeAddress?.address || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const saveHomeAddress = async () => {
    if (!homeAddress.trim()) {
      alert('Please enter your address');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${user._id}`, {
        homeAddress: {
          address: homeAddress,
          latitude: 33.5731 + Math.random() * 0.01,
          longitude: -7.5898 + Math.random() * 0.01
        }
      });
      
      setUser(response.data.user);
      alert('Address saved successfully!');
    } catch (error) {
      alert('Error saving address');
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="indrive-header">
        <div className="header-top">
          <button className="menu-btn" onClick={() => navigate('/')}>←</button>
          <h2>Profile</h2>
          <div></div>
        </div>
      </div>

      {/* Profile Info */}
      <div style={{ padding: '20px' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: '700',
              marginRight: '16px'
            }}>
              {user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px' }}>
                {user.name}
              </h3>
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '4px' }}>
                {user.email}
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {user.phone}
              </p>
            </div>
          </div>

          {user.userType === 'customer' && (
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <h4 style={{ fontSize: '16px', marginBottom: '12px' }}>Home Address</h4>
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="Enter your home address"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}
              />
              <button
                onClick={saveHomeAddress}
                disabled={loading}
                style={{
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>
                ⭐ {user.rating?.toFixed(1) || '5.0'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Rating</div>
            </div>
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>
                {user.totalReviews || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Reviews</div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <NotificationSystem user={user} />

        {/* Settings */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <h4 style={{ fontSize: '18px', marginBottom: '16px' }}>Settings</h4>
          
          <div style={{ marginBottom: '12px' }}>
            <button style={{
              width: '100%',
              padding: '16px',
              background: 'none',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              🌍 Language
            </button>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <button style={{
              width: '100%',
              padding: '16px',
              background: 'none',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              ❓ Help & Support
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '16px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '100px'
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;