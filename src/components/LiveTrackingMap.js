import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

import { API_BASE_URL as API_URL, SOCKET_URL } from '../config';

const LiveTrackingMap = ({ request, user }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [markers, setMarkers] = useState({});
  const [eta, setEta] = useState(null);
  const [routeLine, setRouteLine] = useState(null);

  useEffect(() => {
    if (request) {
      initMap();
      startLocationTracking();
      loadCustomerData();
    }
    return () => stopLocationTracking();
  }, [request]);
  
  const loadCustomerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${request.customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomerData(response.data);
      console.log('Customer data loaded:', response.data.homeAddress);
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  useEffect(() => {
    if (map && request) {
      updateMapMarkers();
    }
  }, [map, request, driverLocation, customerData]);

  const initMap = () => {
    if (!mapRef.current || !window.L || map) return;
    
    // Use delivery location from request
    const userLat = request.deliveryLocation.latitude;
    const userLng = request.deliveryLocation.longitude;
    setUserLocation({ latitude: userLat, longitude: userLng });
    
    const leafletMap = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([userLat, userLng], 14);
    
    window.L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
      attribution: '',
      maxZoom: 20
    }).addTo(leafletMap);
    
    setMap(leafletMap);
    
    if (!document.getElementById('tracking-map-style')) {
      const style = document.createElement('style');
      style.id = 'tracking-map-style';
      style.textContent = `
        .leaflet-container {
          background: #f8f9fa !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  };

  const startLocationTracking = () => {
    if (!request?.driverId) return;
    
    // Simple polling for driver location
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/users/${request.driverId._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.location) {
          setDriverLocation(response.data.location);
        }
      } catch (error) {
        console.error('Error fetching driver location:', error);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  };

  const stopLocationTracking = () => {};

  const calculateETA = (driverLoc) => {
    if (!driverLoc || !request) return;
    
    const userLat = user.homeAddress?.latitude || request.deliveryLocation.latitude;
    const userLng = user.homeAddress?.longitude || request.deliveryLocation.longitude;
    
    const distance = getDistance(driverLoc.latitude, driverLoc.longitude, userLat, userLng);
    const roadDistance = distance * 1.5;
    const estimatedMinutes = Math.max(1, Math.round((roadDistance / 20) * 60) + 2);
    setEta(estimatedMinutes);
    
    drawSingleLine(driverLoc, { latitude: userLat, longitude: userLng });
  };
  
  const drawSingleLine = (start, end) => {
    if (!map) return;
    
    if (routeLine) {
      map.removeLayer(routeLine);
    }
    
    const newRouteLine = window.L.polyline([
      [start.latitude, start.longitude],
      [end.latitude, end.longitude]
    ], {
      color: '#667eea',
      weight: 3,
      opacity: 0.8
    }).addTo(map);
    
    setRouteLine(newRouteLine);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const updateMapMarkers = () => {
    if (!map || !request) return;
    
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    
    const newMarkers = {};
    
    // User location marker (use customer data from API)
    const userLat = customerData?.homeAddress?.latitude || request.deliveryLocation.latitude;
    const userLng = customerData?.homeAddress?.longitude || request.deliveryLocation.longitude;
    
    console.log('User location:', userLat, userLng);
    
    // Only add user marker if coordinates are valid
    if (userLat && userLng) {
      newMarkers.user = window.L.marker(
        [userLat, userLng],
        {
          icon: window.L.divIcon({
            html: `<div style="font-size: 24px;">📍</div>`,
            className: 'user-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 24]
          })
        }
      ).addTo(map);
    }
    
    // Driver location marker (if available)
    if (driverLocation && driverLocation.latitude && driverLocation.longitude) {
      console.log('Driver location:', driverLocation.latitude, driverLocation.longitude);
      
      newMarkers.driver = window.L.marker(
        [driverLocation.latitude, driverLocation.longitude],
        {
          icon: window.L.divIcon({
            html: `<div style="font-size: 24px;">🛵</div>`,
            className: 'driver-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 24]
          })
        }
      ).addTo(map);
      
      // Draw line between user and driver (only if both have valid coordinates)
      if (userLat && userLng && routeLine) {
        map.removeLayer(routeLine);
      }
      
      if (userLat && userLng) {
        const newRouteLine = window.L.polyline([
          [userLat, userLng],
          [driverLocation.latitude, driverLocation.longitude]
        ], {
          color: '#667eea',
          weight: 3,
          opacity: 0.8
        }).addTo(map);
        
        setRouteLine(newRouteLine);
      }
    }
    
    setMarkers(newMarkers);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Live Tracking</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {request.status === 'accepted' && 'Driver heading to store'}
              {request.status === 'shopping' && 'Driver shopping for items'}
              {request.status === 'delivering' && 'Driver coming to you'}
              {request.status === 'completed' && 'Delivery completed'}
            </div>
          </div>
          
          {eta && request.status !== 'completed' && (
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 15px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ETA: {eta} min
            </div>
          )}
        </div>
      </div>
      
      <div style={{ position: 'relative' }}>
        <div 
          ref={mapRef}
          style={{ 
            width: '100%', 
            height: '500px'
          }}
        />
        
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '15px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '15px',
          padding: '8px 12px',
          fontSize: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          📍 You • 🛵 Driver
        </div>
        
        {!driverLocation && request.status !== 'pending' && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.95)',
            padding: '20px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📡</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Connecting to driver...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingMap;