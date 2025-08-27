import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { getUserCity } from '../utils/cityDetector';
import { API_BASE_URL, SOCKET_URL } from '../config';
import '../styles/animations.css';

const socket = io(SOCKET_URL);



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
    
    socket.on('driver-locations', (drivers) => {
      console.log('Received drivers:', drivers);
      // Filter out busy drivers on frontend as backup
      const availableDrivers = drivers.filter(driver => 
        !driver.isBusy && !driver.activeDeliveryId
      );
      console.log('Filtered available drivers:', availableDrivers);
      setAvailableDrivers(availableDrivers);
    });
    
    socket.on('driver-status-changed', (data) => {
      console.log('Driver status changed:', data);
      // Refresh driver locations when status changes
      socket.emit('get-driver-locations', { customerId: user._id });
    });
    
    // Request live driver locations via socket only
    socket.emit('get-driver-locations', { customerId: user._id });
    
    // Auto-refresh every 15 seconds for live updates
    const interval = setInterval(() => {
      socket.emit('get-driver-locations', { customerId: user._id });
    }, 15000);
    
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
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
      const response = await axios.get(`${API_BASE_URL}/requests/my/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
    setLoading(false);
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
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      {/* Modern Header */}
      <div className="fade-in" style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        padding: '20px',
        borderRadius: '0 0 30px 30px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="pulse" style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginRight: '15px',
              boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)'
            }}>🚀</div>
            <div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>DeliveryPro</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Fast & Reliable</div>
            </div>
          </div>
          <button 
            className="bounce"
            onClick={() => navigate('/profile')}
            style={{
              width: '50px',
              height: '50px',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '15px',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {user.name?.charAt(0) || 'U'}
          </button>
        </div>
        
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '20px',
          padding: '15px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginBottom: '5px' }}>Your location</div>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
            📍 {user.homeAddress?.address || 'Set your location'}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="slide-up" style={{
        margin: '20px',
        borderRadius: '25px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        position: 'relative',
        height: '300px'
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            padding: '10px 15px',
            borderRadius: '15px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            📍 Find drivers nearby
          </div>
          <div className="pulse" style={{
            background: availableDrivers.length > 0 ? 'linear-gradient(135deg, #00D084 0%, #00A86B 100%)' : 'rgba(255,255,255,0.2)',
            padding: '8px 12px',
            borderRadius: '12px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {availableDrivers.length} online
          </div>
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
          Array.isArray(requests) ? requests.slice(0, 3).map(request => (
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
          )) : []
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