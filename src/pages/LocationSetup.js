import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationSelector from '../components/LocationSelector';

const API_URL = 'http://localhost:5000/api';

function LocationSetup({ user, setUser }) {
  const [homeLocation, setHomeLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const navigate = useNavigate();

  const getGPSLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        };
        setHomeLocation(location);
        setGettingLocation(false);
      },
      (error) => {
        alert('GPS failed: ' + error.message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLocationSelect = (mode, location) => {
    setHomeLocation(location);
  };

  const saveLocation = async () => {
    if (!homeLocation) {
      alert('Please select your location on the map');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/users/${user._id}`, {
        homeAddress: homeLocation,
        location: homeLocation // For drivers, also set as current location
      });
      
      const updatedUser = { ...user, homeAddress: homeLocation };
      if (user.userType === 'driver') {
        updatedUser.location = homeLocation;
      }
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      navigate('/');
    } catch (error) {
      alert('Error saving location');
    }
    setLoading(false);
  };

  const skipForNow = () => {
    navigate('/');
  };

  return (
    <div className="container">
      <div className="app-header">
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Delivery Connect" 
            style={{ height: '40px', borderRadius: '6px' }}
          />
        </div>
      </div>

      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          📍 Set Your Location
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          {user.userType === 'customer' 
            ? 'Set your home address to get better delivery recommendations'
            : 'Set your location so customers can find you'
          }
        </p>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={getGPSLocation}
            disabled={gettingLocation}
            style={{
              width: '100%',
              padding: '15px',
              background: gettingLocation ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              cursor: gettingLocation ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            {gettingLocation ? '📍 Getting GPS Location...' : '📍 Use My GPS Location'}
          </button>
        </div>

        <div style={{ textAlign: 'center', margin: '10px 0', color: '#666' }}>or</div>

        <LocationSelector
          mode="home"
          onLocationSelect={handleLocationSelect}
          pickupLocation={homeLocation}
        />

        {homeLocation && (
          <div style={{ 
            background: '#f0f8ff', 
            padding: '15px', 
            borderRadius: '10px', 
            margin: '20px 0',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#333' }}>
              📍 Selected: {homeLocation.address}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button
            onClick={skipForNow}
            style={{
              flex: 1,
              padding: '15px',
              background: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Skip for now
          </button>
          <button
            onClick={saveLocation}
            disabled={loading || !homeLocation}
            style={{
              flex: 2,
              padding: '15px',
              background: loading || !homeLocation ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: loading || !homeLocation ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Save Location'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationSetup;