import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { API_URL } from '../config';

const TrackingTest = ({ user }) => {
  const [testLocation, setTestLocation] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTestLocation = async () => {
    setIsUpdating(true);
    try {
      // Generate random location around Casablanca
      const lat = 33.5731 + (Math.random() - 0.5) * 0.01;
      const lng = -7.5898 + (Math.random() - 0.5) * 0.01;
      
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/users/${user._id}/location`, {
        latitude: lat,
        longitude: lng,
        address: `Test Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTestLocation({ latitude: lat, longitude: lng });
      console.log('✅ Test location updated:', lat, lng);
    } catch (error) {
      console.error('❌ Failed to update test location:', error);
    }
    setIsUpdating(false);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '15px',
      padding: '20px',
      margin: '10px 0',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🧪 Tracking Test</h3>
      
      <button
        onClick={updateTestLocation}
        disabled={isUpdating}
        style={{
          background: isUpdating ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: isUpdating ? 'not-allowed' : 'pointer',
          width: '100%',
          marginBottom: '15px'
        }}
      >
        {isUpdating ? '📡 Updating...' : '📍 Update Test Location'}
      </button>
      
      {testLocation && (
        <div style={{
          background: '#f8f9fa',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#666'
        }}>
          <div><strong>Last Update:</strong></div>
          <div>Lat: {testLocation.latitude.toFixed(6)}</div>
          <div>Lng: {testLocation.longitude.toFixed(6)}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
            This simulates driver location updates for testing
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingTest;