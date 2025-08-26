import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';

function CustomerMap({ user }) {
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [socket, setSocket] = useState(null);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    // Listen for driver location updates
    newSocket.on('driver-locations', (drivers) => {
      console.log('Received driver locations:', drivers);
      setAvailableDrivers(drivers);
      updateDriversOnMap(drivers);
    });
    
    // Request initial driver locations
    newSocket.emit('get-driver-locations');

    loadAvailableDrivers();
    initMap();

    return () => newSocket.disconnect();
  }, []);

  const loadAvailableDrivers = async () => {
    try {
      const response = await axios.get(`${API_URL}/drivers/available`);
      setAvailableDrivers(response.data);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const initMap = () => {
    if (!window.google || !mapRef.current) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 14,
      center: { lat: 33.5731, lng: -7.5898 },
      styles: [
        {
          "featureType": "poi",
          "stylers": [{"visibility": "off"}]
        }
      ]
    });

    setMap(mapInstance);
  };

  const updateDriversOnMap = (drivers) => {
    if (!map) return;

    console.log(`Updating map with ${drivers.length} drivers`);

    // Clear existing markers (you'd store them in state in a real app)
    // Add driver markers
    drivers.forEach((driver, index) => {
      if (driver.currentLocation) {
        console.log(`Adding marker for driver ${driver.name} at:`, driver.currentLocation);
        
        const marker = new window.google.maps.Marker({
          position: {
            lat: driver.currentLocation.latitude,
            lng: driver.currentLocation.longitude
          },
          map: map,
          title: `${driver.name} - ⭐${driver.rating?.toFixed(1) || '5.0'}`,
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
            fillColor: '#4CAF50',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 1.5
          },
          animation: window.google.maps.Animation.DROP,
          zIndex: 1000 + index
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; text-align: center;">
              <h4 style="margin: 0 0 5px 0;">${driver.name}</h4>
              <div style="color: #FFC107; margin: 5px 0;">⭐ ${driver.rating?.toFixed(1) || '5.0'}</div>
              <div style="color: #4CAF50; font-size: 12px;">🟢 Available Now</div>
              <div style="color: #666; font-size: 11px; margin-top: 5px;">
                ${driver.vehicle?.type || 'Car'} • ${driver.totalDeliveries || 0} deliveries
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          setSelectedDriver(driver);
        });
      } else {
        console.log(`Driver ${driver.name} has no location data`);
      }
    });
    
    // Fit map to show all drivers
    if (drivers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      drivers.forEach(driver => {
        if (driver.currentLocation) {
          bounds.extend({
            lat: driver.currentLocation.latitude,
            lng: driver.currentLocation.longitude
          });
        }
      });
      map.fitBounds(bounds);
    }
  };

  return (
    <div className="container">
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', marginRight: '15px' }}
          >
            ←
          </button>
          <img 
            src="/logo.png" 
            alt="Delivery Connect" 
            style={{
              height: '40px',
              borderRadius: '6px'
            }}
          />
        </div>
      </div>

      <div 
        ref={mapRef}
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '15px',
          border: '2px solid #e0e0e0',
          marginBottom: '20px'
        }}
      />

      <div className="card">
        <h3>Drivers Near You ({availableDrivers.length})</h3>
        
        {availableDrivers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No drivers available right now
          </p>
        ) : (
          availableDrivers.map(driver => (
            <div 
              key={driver._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                marginBottom: '10px',
                cursor: 'pointer',
                background: selectedDriver?._id === driver._id ? '#f0f8ff' : 'white'
              }}
              onClick={() => setSelectedDriver(driver)}
            >
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                marginRight: '15px'
              }}>
                {driver.name?.charAt(0) || 'D'}
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0 }}>{driver.name || 'Unknown Driver'}</h4>
                <div style={{ color: '#FFC107', fontSize: '14px', margin: '2px 0' }}>
                  ⭐ {driver.rating?.toFixed(1) || '5.0'} ({driver.totalReviews || 0} reviews)
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {driver.vehicle?.type} {driver.vehicle?.model}
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold' }}>
                  🟢 Available
                </div>
                <div style={{ fontSize: '10px', color: '#666' }}>
                  2 min away
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedDriver && (
        <div className="card" style={{ background: '#f8f9fa' }}>
          <h4>Selected Driver: {selectedDriver.name || 'Unknown Driver'}</h4>
          <button 
            className="btn-primary"
            onClick={() => navigate('/create-request')}
            style={{ marginTop: '10px' }}
          >
            Request Delivery from {selectedDriver.name || 'Driver'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomerMap;