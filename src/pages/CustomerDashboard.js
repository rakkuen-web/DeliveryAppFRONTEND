import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { getUserCity } from '../utils/cityDetector';
import { API_BASE_URL, SOCKET_URL } from '../config';
import '../styles/glovo.css';

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
          html: `<div class="driver-marker">🛵</div>`,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        
        const marker = window.L.marker(
          [driver.currentLocation.latitude, driver.currentLocation.longitude],
          { icon: driverIcon }
        ).addTo(map);
        
        marker.bindPopup(`
          <div style="text-align: center; padding: 15px; min-width: 160px;">
            <div style="
              width: 50px; height: 50px; 
              background: linear-gradient(135deg, #FF3B30 0%, #FF6B35 100%);
              border-radius: 50%; display: flex; align-items: center; justify-content: center;
              color: white; font-weight: 700; font-size: 20px; margin: 0 auto 10px;
              box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);
            ">${driver.name?.charAt(0) || 'D'}</div>
            <div style="font-weight: 600; margin-bottom: 8px;">${driver.name}</div>
            <div style="color: #FF3B30; margin-bottom: 10px;">⭐ ${driver.rating?.toFixed(1) || '5.0'}</div>
            <div class="status-badge" style="background: #00D084;">Available</div>
          </div>
        `);
        
        window.driverMarkers.push(marker);
      }
    });
  };

  if (activeTab === 'drivers') {
    return (
      <div className="glovo-container">
        <div className="glovo-header fade-in">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setActiveTab('home')} 
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                borderRadius: '12px',
                padding: '12px',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                marginRight: '15px'
              }}
            >←</button>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Available Drivers</div>
              <div style={{ opacity: 0.8, fontSize: '14px' }}>{availableDrivers.length} drivers online</div>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px', marginTop: '-20px' }}>
          {availableDrivers.length === 0 ? (
            <div className="glovo-card fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚗</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>No drivers available</div>
              <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>Check back in a few minutes</div>
            </div>
          ) : (
            availableDrivers.map((driver, index) => (
              <div key={driver._id} className="glovo-card slide-up" style={{
                display: 'flex',
                alignItems: 'center',
                animationDelay: `${index * 0.1}s`
              }}>
                <div className="pulse" style={{
                  width: '60px', height: '60px',
                  background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B35 100%)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '20px', marginRight: '15px',
                  boxShadow: '0 4px 15px rgba(255, 59, 48, 0.3)'
                }}>
                  {driver.name?.charAt(0) || 'D'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>{driver.name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--primary)', marginBottom: '5px' }}>⭐ {driver.rating?.toFixed(1) || '5.0'} • Professional</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>🟢 Available now</div>
                </div>
                <div className="status-badge" style={{ background: 'var(--primary)' }}>
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
      <div className="glovo-container">
        <div className="glovo-header fade-in">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setActiveTab('home')} 
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                borderRadius: '12px',
                padding: '12px',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                marginRight: '15px'
              }}
            >←</button>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>My Orders</div>
              <div style={{ opacity: 0.8, fontSize: '14px' }}>{requests.length} total orders</div>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px', marginTop: '-20px' }}>
          {loading ? (
            <div className="glovo-card" style={{ height: '80px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200px 100%', animation: 'shimmer 1.5s infinite' }}></div>
          ) : requests.length === 0 ? (
            <div className="glovo-card fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>No orders yet</div>
              <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>Your delivery history will appear here</div>
            </div>
          ) : (
            requests.map((request, index) => (
              <div 
                key={request._id} 
                className="glovo-card slide-up"
                onClick={() => navigate(`/track/${request._id}`)} 
                style={{
                  cursor: 'pointer',
                  animationDelay: `${index * 0.1}s`,
                  transition: 'transform 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>{request.item}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>from {request.store}</div>
                  </div>
                  <div className={`status-badge status-${request.status}`}>
                    {request.status}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>{request.price} MAD</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Tap to track →</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glovo-container">
      {/* Glovo Navbar */}
      <div className="glovo-navbar fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', flex: 1, marginRight: '15px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '16px', marginRight: '8px' }}>📍</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>
                {user.homeAddress?.address || 'Set your location'}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Delivery address</div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            style={{
              width: '48px', height: '48px',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px', color: 'white',
              fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            {user.name?.charAt(0) || 'U'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ position: 'relative', height: '60vh', width: '100%', marginTop: '120px' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '0' }} />
        
        <div className="pulse" style={{
          position: 'absolute', top: '20px', right: '20px',
          background: availableDrivers.length > 0 ? 'var(--primary)' : 'rgba(0,0,0,0.6)',
          color: 'white', padding: '8px 12px', borderRadius: '20px',
          fontSize: '12px', fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          {availableDrivers.length} drivers
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="slide-up" style={{
        background: 'white', borderRadius: '25px 25px 0 0',
        padding: '25px 20px 20px', boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
        marginTop: '-25px', position: 'relative', zIndex: 1000
      }}>
        <div style={{
          width: '40px', height: '4px', background: '#E5E5E5',
          borderRadius: '2px', margin: '0 auto 20px'
        }}></div>
        
        <button 
          className="glovo-button pulse"
          onClick={() => navigate('/create-request')}
          style={{ width: '100%', marginBottom: '20px' }}
        >
          🚀 Request Delivery
        </button>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{
              background: '#F8F8F8', border: 'none', borderRadius: '12px',
              padding: '16px', cursor: 'pointer', textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>📦</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Orders</div>
          </button>
          <button 
            onClick={() => setActiveTab('drivers')}
            style={{
              background: '#F8F8F8', border: 'none', borderRadius: '12px',
              padding: '16px', cursor: 'pointer', textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>👥</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Drivers</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;