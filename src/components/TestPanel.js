import React, { useState, useEffect } from 'react';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';
import LocationTracker from '../utils/locationTracker';

const TestPanel = ({ user }) => {
  const [deviceId, setDeviceId] = useState('');
  const [location, setLocation] = useState(null);
  const [locationTracker] = useState(new LocationTracker(user._id));

  useEffect(() => {
    setDeviceId(generateDeviceFingerprint());
  }, []);

  const testLocation = async () => {
    try {
      const loc = await locationTracker.getCurrentLocation();
      setLocation(loc);
      console.log('📍 Location test:', loc);
    } catch (error) {
      console.error('❌ Location test failed:', error);
      alert('Location access denied. Enable location in browser settings.');
    }
  };

  const testBusyStatus = () => {
    console.log('🚗 User busy status:', user.isBusy);
    console.log('📋 Active delivery:', user.activeDeliveryId);
    alert(`Driver busy: ${user.isBusy ? 'YES' : 'NO'}\nActive delivery: ${user.activeDeliveryId || 'None'}`);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid #4CAF50',
      borderRadius: '10px',
      padding: '15px',
      fontSize: '12px',
      maxWidth: '300px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>🧪 Test Panel</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Device ID:</strong><br/>
        <code style={{ fontSize: '10px', background: '#f0f0f0', padding: '2px' }}>
          {deviceId}
        </code>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Location:</strong><br/>
        {location ? (
          <span style={{ color: '#4CAF50' }}>
            📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        ) : (
          <span style={{ color: '#666' }}>Not detected</span>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button 
          onClick={testLocation}
          style={{ 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            padding: '5px 10px', 
            borderRadius: '5px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Test Location
        </button>
        
        {user.userType === 'driver' && (
          <button 
            onClick={testBusyStatus}
            style={{ 
              background: '#FF9800', 
              color: 'white', 
              border: 'none', 
              padding: '5px 10px', 
              borderRadius: '5px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Test Busy Status
          </button>
        )}
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        <strong>How to test:</strong><br/>
        • Device ID prevents multiple driver accounts<br/>
        • Location updates every 30s when online<br/>
        • Busy status blocks new requests<br/>
        • Check browser console for logs
      </div>
    </div>
  );
};

export default TestPanel;