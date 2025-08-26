import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { getUserCity } from '../utils/cityDetector';

const API_URL = 'http://localhost:5000/api';

function CustomerDashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMyRequests();
    loadAvailableDrivers();
    
    const socket = io('http://localhost:5000');
    socket.on('driver-locations', (drivers) => {
      console.log('Received drivers:', drivers);
      setAvailableDrivers(drivers);
    });
    
    socket.emit('get-driver-locations', { customerId: user._id });
    
    return () => socket.disconnect();
  }, []);
  
  useEffect(() => {
    if (!map) {
      initMap();
    } else {
      updateDriversOnMap(availableDrivers);
    }
  }, [availableDrivers, map]);

  const loadMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/requests/my/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
    setLoading(false);
  };

  const loadAvailableDrivers = async () => {
    try {
      // Get user's city and location
      const userCity = await getUserCity();
      let userLat = userCity.center[0];
      let userLng = userCity.center[1];
      
      if (user.homeAddress?.latitude && user.homeAddress?.longitude) {
        userLat = user.homeAddress.latitude;
        userLng = user.homeAddress.longitude;
      }
      
      const response = await axios.get(`${API_URL}/drivers/available?lat=${userLat}&lng=${userLng}&radius=30`);
      setAvailableDrivers(response.data);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const initMap = async () => {
    if (!mapRef.current || !window.L || map) return;
    
    // Get user's city for map center
    const userCity = await getUserCity();
    
    // Clear any existing map
    if (mapRef.current._leaflet_id) {
      mapRef.current._leaflet_id = null;
    }
    
    // Create Leaflet map centered on user's city
    const leafletMap = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(userCity.center, 14);
    
    // Clean map style like the image
    window.L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
      attribution: '',
      maxZoom: 20
    }).addTo(leafletMap);
    
    // Clean map styling like the delivery app image
    if (!document.getElementById('delivery-map-style')) {
      const style = document.createElement('style');
      style.id = 'delivery-map-style';
      style.textContent = `
        .leaflet-container {
          background: #f8f9fa !important;

        }
        .leaflet-tile {

        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    setMap(leafletMap);
  };

  const updateDriversOnMap = (drivers) => {
    if (!map || !window.L) return;

    console.log('Updating Leaflet map with drivers:', drivers.length);
    console.log('Driver data:', drivers);
    
    // Clear existing markers
    if (window.driverMarkers) {
      window.driverMarkers.forEach(marker => map.removeLayer(marker));
    }
    window.driverMarkers = [];
    
    // Add driver markers to Leaflet map
    drivers.forEach((driver) => {
      if (driver.currentLocation) {
        console.log('Adding driver to Leaflet map:', driver.name);
        
        // Different icon for assigned vs available drivers
        const iconColor = driver.isAssignedToMe ? '#667eea' : '#00D084';
        const iconSize = driver.isAssignedToMe ? 40 : 32;
        
        const driverIcon = window.L.divIcon({
          html: `
            <div style="
              width: ${iconSize}px;
              height: ${iconSize}px;
              background: ${iconColor};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(${driver.isAssignedToMe ? '102, 126, 234' : '0, 208, 132'}, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${driver.isAssignedToMe ? '20px' : '16px'};
              ${driver.isAssignedToMe ? 'animation: pulse 2s infinite;' : ''}
            ">🛵</div>
          `,
          className: 'delivery-driver-marker',
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconSize/2, iconSize/2]
        });
        
        const marker = window.L.marker(
          [driver.currentLocation.latitude, driver.currentLocation.longitude],
          { icon: driverIcon }
        ).addTo(map);
        
        // Add Glovo-style popup
        marker.bindPopup(`
          <div style="
            text-align: center; 
            padding: 12px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            border-radius: 8px;
            min-width: 150px;
          ">
            <div style="
              width: 50px;
              height: 50px;
              background: #FF6B35;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 700;
              font-size: 20px;
              margin: 0 auto 8px;
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
            ">${driver.name?.charAt(0) || 'D'}</div>
            <div style="font-weight: 600; margin-bottom: 6px; color: #333;">${driver.name}</div>
            <div style="color: #FF6B35; margin-bottom: 8px; font-size: 14px;">⭐ ${driver.rating?.toFixed(1) || '5.0'}</div>
            <div style="
              background: #00D084;
              color: white;
              padding: 6px 12px;
              border-radius: 16px;
              font-size: 12px;
              font-weight: 600;
              display: inline-block;
            ">Available</div>
          </div>
        `);
        
        window.driverMarkers.push(marker);
      }
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (activeTab === 'drivers') {
    return (
      <div className="container">
        <div className="indrive-header">
          <div className="header-top">
            <button className="menu-btn" onClick={() => setActiveTab('home')}>←</button>
            <h2>Available Drivers</h2>
            <div></div>
          </div>
        </div>

        <div className="driver-list">
          {availableDrivers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚗</div>
              <div>No drivers available</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>Try again in a few minutes</div>
            </div>
          ) : (
            availableDrivers.map(driver => (
              <div key={driver._id} className="driver-item">
                <div className="driver-avatar">
                  {driver.name?.charAt(0) || 'D'}
                </div>
                <div className="driver-info">
                  <div className="driver-name">{driver.name || 'Unknown Driver'}</div>
                  <div className="driver-rating">⭐ {driver.rating?.toFixed(1) || '5.0'} ({driver.totalReviews || 0} reviews)</div>
                  <div className="driver-vehicle">{driver.vehicle?.type || 'Car'} {driver.vehicle?.model || 'Vehicle'}</div>
                </div>
                <div className="driver-status">
                  <div className="online-indicator">🟢 Online</div>
                  <div className="driver-distance">2 min away</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bottom-nav">
          <button className="nav-item" onClick={() => setActiveTab('home')}>
            <div className="nav-icon">🏠</div>
            <div>Home</div>
          </button>
          <button className="nav-item active">
            <div className="nav-icon">👥</div>
            <div>Drivers</div>
          </button>
          <button className="nav-item" onClick={() => setActiveTab('orders')}>
            <div className="nav-icon">📦</div>
            <div>Orders</div>
          </button>
          <button className="nav-item" onClick={() => navigate('/profile')}>
            <div className="nav-icon">👤</div>
            <div>Profile</div>
          </button>
        </div>
      </div>
    );
  }

  if (activeTab === 'orders') {
    return (
      <div className="container">
        <div className="indrive-header">
          <div className="header-top">
            <button className="menu-btn" onClick={() => setActiveTab('home')}>←</button>
            <h2>My Orders</h2>
            <div></div>
          </div>
        </div>

        <div className="recent-orders">
          {requests.map(request => (
            <div key={request._id} className="order-item" onClick={() => navigate(`/track/${request._id}`)}>
              <div className="order-header">
                <div>
                  <div className="order-title">{request.item}</div>
                  <div className="order-store">from {request.store}</div>
                </div>
                <div className={`order-status status-${request.status}`}>
                  {request.status}
                </div>
              </div>
              <div className="order-price">{request.price} MAD</div>
            </div>
          ))}
        </div>

        <div className="bottom-nav">
          <button className="nav-item" onClick={() => setActiveTab('home')}>
            <div className="nav-icon">🏠</div>
            <div>Home</div>
          </button>
          <button className="nav-item" onClick={() => setActiveTab('drivers')}>
            <div className="nav-icon">👥</div>
            <div>Drivers</div>
          </button>
          <button className="nav-item active">
            <div className="nav-icon">📦</div>
            <div>Orders</div>
          </button>
          <button className="nav-item" onClick={() => navigate('/profile')}>
            <div className="nav-icon">👤</div>
            <div>Profile</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* inDrive Header */}
      <div className="indrive-header">
        <div className="header-top">
          <button className="menu-btn">☰</button>
          <button className="profile-btn" onClick={() => navigate('/profile')}>
            {user.name?.charAt(0) || 'U'}
          </button>
        </div>
        
        <div className="location-section">
          <div className="location-label">Your location</div>
          <div className="location-text">
            📍 {user.address || 'Set your location'}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="map-section">
        <div className="map-overlay">
          <div>📍 Find drivers nearby</div>
          <div className="drivers-online">{availableDrivers.length} online</div>
        </div>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="main-action" onClick={() => navigate('/create-request')}>
          🚀 Request Delivery
        </button>
        
        <div className="secondary-actions">
          <button className="secondary-btn" onClick={() => setActiveTab('drivers')}>
            <span className="icon">👥</span>
            <div>Drivers</div>
            <div style={{ fontSize: '11px', color: '#666' }}>{availableDrivers.length} available</div>
          </button>
          <button className="secondary-btn" onClick={() => navigate('/drivers-map')}>
            <span className="icon">🗺️</span>
            <div>Map View</div>
            <div style={{ fontSize: '11px', color: '#666' }}>Live tracking</div>
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders">
        <div className="section-title">Recent orders</div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div>No orders yet</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>Your delivery history will appear here</div>
          </div>
        ) : (
          requests.slice(0, 3).map(request => (
            <div key={request._id} className="order-item" onClick={() => navigate(`/track/${request._id}`)}>
              <div className="order-header">
                <div>
                  <div className="order-title">{request.item}</div>
                  <div className="order-store">from {request.store}</div>
                </div>
                <div className={`order-status status-${request.status}`}>
                  {request.status}
                </div>
              </div>
              <div className="order-price">{request.price} MAD</div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className="nav-item active">
          <div className="nav-icon">🏠</div>
          <div>Home</div>
        </button>
        <button className="nav-item" onClick={() => setActiveTab('drivers')}>
          <div className="nav-icon">👥</div>
          <div>Drivers</div>
        </button>
        <button className="nav-item" onClick={() => setActiveTab('orders')}>
          <div className="nav-icon">📦</div>
          <div>Orders</div>
        </button>
        <button className="nav-item" onClick={() => navigate('/profile')}>
          <div className="nav-icon">👤</div>
          <div>Profile</div>
        </button>
      </div>
    </div>
  );
}

export default CustomerDashboard;