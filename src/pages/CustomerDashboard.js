import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { getUserCity } from '../utils/cityDetector';
import { API_BASE_URL, SOCKET_URL } from '../config';
import '../styles/comfort.css';

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
      const availableDrivers = drivers.filter(driver => 
        !driver.isBusy && !driver.activeDeliveryId
      );
      setAvailableDrivers(availableDrivers);
    });
    
    socket.on('driver-status-changed', (data) => {
      socket.emit('get-driver-locations', { customerId: user._id });
    });
    
    socket.emit('get-driver-locations', { customerId: user._id });
    
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
    
    const userCity = await getUserCity();
    
    if (mapRef.current._leaflet_id) {
      mapRef.current._leaflet_id = null;
    }
    
    const leafletMap = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(userCity.center, 14);
    
    window.L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
      attribution: '',
      maxZoom: 20
    }).addTo(leafletMap);
    
    setMap(leafletMap);
  };

  const updateDriversOnMap = (drivers) => {
    if (!map || !window.L) return;
    
    if (window.driverMarkers) {
      window.driverMarkers.forEach(marker => map.removeLayer(marker));
    }
    window.driverMarkers = [];
    
    drivers.forEach((driver) => {
      if (driver.currentLocation) {
        const driverIcon = window.L.divIcon({
          html: `<div class="driver-marker">🚗</div>`,
          className: 'custom-marker',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });
        
        const marker = window.L.marker(
          [driver.currentLocation.latitude, driver.currentLocation.longitude],
          { icon: driverIcon }
        ).addTo(map);
        
        marker.bindPopup(`
          <div style="
            padding: 16px; 
            text-align: center;
            font-family: 'Inter', sans-serif;
            min-width: 160px;
          ">
            <div style="
              width: 50px; height: 50px; 
              background: var(--primary);
              border-radius: 50%; display: flex; align-items: center; justify-content: center;
              color: white; font-weight: 600; font-size: 18px; margin: 0 auto 12px;
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            ">${driver.name?.charAt(0) || 'D'}</div>
            <div style="font-weight: 600; margin-bottom: 8px; color: var(--text);">${driver.name}</div>
            <div style="color: var(--primary); margin-bottom: 12px; font-size: 14px;">⭐ ${driver.rating?.toFixed(1) || '5.0'}</div>
            <div class="status-badge" style="background: var(--secondary); color: white;">Available</div>
          </div>
        `);
        
        window.driverMarkers.push(marker);
      }
    });
  };

  if (activeTab === 'drivers') {
    return (
      <div className="comfort-container">
        <div className="comfort-header fade-in">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setActiveTab('home')} 
              className="comfort-button"
              style={{ 
                padding: '12px',
                marginRight: '16px',
                background: 'rgba(255, 255, 255, 0.2)'
              }}
            >←</button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Available Drivers</h1>
              <p style={{ opacity: 0.9, fontSize: '14px' }}>{availableDrivers.length} drivers online</p>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '24px', marginTop: '-20px' }}>
          {availableDrivers.length === 0 ? (
            <div className="comfort-card fade-in text-center" style={{ padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
              <h3 className="font-semibold mb-2">No drivers available</h3>
              <p className="text-muted">Check back in a few minutes</p>
            </div>
          ) : (
            availableDrivers.map((driver, index) => (
              <div key={driver._id} className="comfort-card slide-up" style={{
                display: 'flex',
                alignItems: 'center',
                animationDelay: `${index * 0.1}s`
              }}>
                <div style={{
                  width: '56px', height: '56px',
                  background: 'var(--primary)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '600', fontSize: '18px',
                  marginRight: '16px', flexShrink: 0
                }}>
                  {driver.name?.charAt(0) || 'D'}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="font-semibold mb-1">{driver.name}</h4>
                  <p className="text-primary mb-1" style={{ fontSize: '14px' }}>
                    ⭐ {driver.rating?.toFixed(1) || '5.0'} • Professional driver
                  </p>
                  <p className="text-muted" style={{ fontSize: '13px' }}>🟢 Available now</p>
                </div>
                <div className="status-badge" style={{ background: 'var(--primary)', color: 'white' }}>
                  2 min
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'orders') {
    return (
      <div className="comfort-container">
        <div className="comfort-header fade-in">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setActiveTab('home')} 
              className="comfort-button"
              style={{ 
                padding: '12px',
                marginRight: '16px',
                background: 'rgba(255, 255, 255, 0.2)'
              }}
            >←</button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>My Orders</h1>
              <p style={{ opacity: 0.9, fontSize: '14px' }}>{requests.length} total orders</p>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '24px', marginTop: '-20px' }}>
          {loading ? (
            <div className="comfort-card" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '32px'
            }}>
              <div className="comfort-loading" style={{ marginRight: '12px' }}></div>
              <span>Loading orders...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="comfort-card fade-in text-center" style={{ padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <h3 className="font-semibold mb-2">No orders yet</h3>
              <p className="text-muted">Your delivery history will appear here</p>
            </div>
          ) : (
            requests.map((request, index) => (
              <div 
                key={request._id} 
                className="comfort-card slide-up"
                onClick={() => navigate(`/track/${request._id}`)} 
                style={{
                  cursor: 'pointer',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 className="font-semibold mb-1">{request.item}</h4>
                    <p className="text-muted" style={{ fontSize: '14px' }}>from {request.store}</p>
                  </div>
                  <div className={`status-badge status-${request.status}`}>
                    {request.status}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="text-primary font-semibold" style={{ fontSize: '18px' }}>
                    {request.price} MAD
                  </div>
                  <div className="text-muted" style={{ fontSize: '13px' }}>Tap to track →</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="comfort-container">
      {/* Navigation Bar */}
      <div className="comfort-navbar fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            display: 'flex', alignItems: 'center',
            flex: 1, marginRight: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '16px', marginRight: '8px' }}>📍</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>
                {user.homeAddress?.address || 'Set your location'}
              </div>
              <div className="text-muted" style={{ fontSize: '12px' }}>Delivery address</div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            style={{
              width: '44px', height: '44px',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: 'white',
              fontSize: '16px', fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {user.name?.charAt(0) || 'U'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ 
        position: 'relative', 
        height: '55vh', 
        margin: '100px 24px 0',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        
        <div style={{
          position: 'absolute', top: '16px', right: '16px',
          background: availableDrivers.length > 0 ? 'var(--secondary)' : 'var(--text-muted)',
          color: 'white', padding: '8px 12px', borderRadius: '20px',
          fontSize: '12px', fontWeight: '500',
          boxShadow: 'var(--shadow)'
        }}>
          {availableDrivers.length} drivers online
        </div>
      </div>

      {/* Action Panel */}
      <div style={{ padding: '24px' }}>
        <div className="comfort-card slide-up">
          <button 
            className="comfort-button gentle-bounce"
            onClick={() => navigate('/create-request')}
            style={{ 
              width: '100%', 
              marginBottom: '20px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            🚚 Request Delivery
          </button>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button 
              onClick={() => setActiveTab('orders')}
              className="comfort-card"
              style={{
                border: '2px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '20px',
                margin: 0,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📦</div>
              <div className="font-medium">Orders</div>
            </button>
            <button 
              onClick={() => setActiveTab('drivers')}
              className="comfort-card"
              style={{
                border: '2px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '20px',
                margin: 0,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
              <div className="font-medium">Drivers</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;