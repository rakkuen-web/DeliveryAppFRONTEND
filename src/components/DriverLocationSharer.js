import React, { useEffect, useState } from 'react';
import { LocationTracker } from '../utils/locationTracker';

const DriverLocationSharer = ({ user, activeDelivery }) => {
  const [locationTracker, setLocationTracker] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (user?.userType === 'driver') {
      const tracker = new LocationTracker(user._id);
      setLocationTracker(tracker);
      
      // Set active request ID for tracking
      window.activeRequestId = activeDelivery?._id;
      
      startLocationSharing(tracker);

      return () => {
        if (tracker) {
          tracker.stopTracking();
        }
        window.activeRequestId = null;
      };
    }
  }, [user, activeDelivery]);

  const startLocationSharing = (tracker) => {
    setIsSharing(true);
    tracker.startTracking();
    
    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          accuracy: position.coords.accuracy
        };
        setCurrentLocation(location);
      },
      (error) => {
        console.error('GPS Error:', error);
        // Fallback to Casablanca coordinates
        const fallbackLocation = {
          latitude: 33.5731,
          longitude: -7.5898,
          address: 'Casablanca, Morocco',
          accuracy: 1000
        };
        setCurrentLocation(fallbackLocation);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopLocationSharing = () => {
    setIsSharing(false);
    if (locationTracker) {
      locationTracker.stopTracking();
    }
  };

  if (user?.userType !== 'driver' || !activeDelivery) {
    return null;
  }

  return (
    <div style={{
      background: isSharing ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)',
      color: 'white',
      padding: '15px',
      borderRadius: '15px',
      margin: '10px 0',
      textAlign: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
        📍 Live Tracking: {isSharing ? 'ACTIVE' : 'INACTIVE'}
      </div>
      {currentLocation && (
        <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '5px' }}>
          📍 {currentLocation.address}
        </div>
      )}
      <div style={{ fontSize: '12px', opacity: 0.8 }}>
        {isSharing ? 'Customer is tracking your location' : 'Location sharing disabled'}
      </div>
      {currentLocation?.accuracy && (
        <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '5px' }}>
          Accuracy: ±{Math.round(currentLocation.accuracy)}m
        </div>
      )}
    </div>
  );
};

export default DriverLocationSharer;