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
      const availableDrivers = drivers.filter(driver => 
        !driver.isBusy && !driver.activeDeliveryId
      );
      console.log('Filtered available drivers:', availableDrivers);
      setAvailableDrivers(availableDrivers);
    });
    
    socket.on('driver-status-changed', (data) => {
      console.log('Driver status changed:', data);
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
    
    if (!document.getElementById('delivery-map-style')) {
      const style = document.createElement('style');
      style.id = 'delivery-map-style';
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
    
    setMap(leafletMap);
  };

  const updateDriversOnMap = (drivers) => {
    if (!map || !window.L) return;

    console.log('Updating Leaflet map with drivers:', drivers.length);
    console.log('Driver data:', drivers);
    
    if (window.driverMarkers) {
      window.driverMarkers.forEach(marker => map.removeLayer(marker));
    }
    window.driverMarkers = [];
    
    drivers.forEach((driver) => {
      if (driver.currentLocation) {
        console.log('Adding driver to Leaflet map:', driver.name);
        
        const iconColor = '#FF3B30';
        const iconSize = 32;
        
        const driverIcon = window.L.divIcon({
          html: `
            <div style="
              width: ${iconSize}px;
              height: ${iconSize}px;
              background: ${iconColor};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(255, 59, 48, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
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
              background: #FF3B30;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 700;
              font-size: 20px;
              margin: 0 auto 8px;
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
            ">${driver.name?.charAt(0) || 'D'}</div>
            <div style="font-weight: 600; margin-bottom: 6px; color: #333;">${driver.name}</div>
            <div style="color: #FF3B30; margin-bottom: 8px; font-size: 14px;">⭐ ${driver.rating?.toFixed(1) || '5.0'}</div>
            <div style="
              background: #FF3B30;
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

  if (activeTab === 'drivers') {
    return (
      <div style={{ background: '#fff', minHeight: '100vh' }}>
        <div className="fade-in" style={{
          background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B35 100%)',
          padding: '20px',
          paddingTop: '50px',
          borderRadius: '0 0 25px 25px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setActiveTab('home')} 
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                borderRadius: '12px',
                padding: '10px',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                marginRight: '15px'
              }}
            >←</button>
            <div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>Available Drivers</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>{availableDrivers.length} drivers online</div>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px' }}>
          {availableDrivers.length === 0 ? (
            <div className="fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚗</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>No drivers available</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Check back in a few minutes</div>
            </div>
          ) : (
            availableDrivers.map((driver, index) => (
              <div key={driver._id} className="slide-up" style={{ 
                background: 'white', 
                borderRadius: '16px', 
                padding: '20px', 
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                animationDelay: `${index * 0.1}s`
              }}>
                <div className="pulse" style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B35 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  marginRight: '15px',
                  boxShadow: '0 4px 15px rgba(255, 59, 48, 0.3)'
                }}>
                  {driver.name?.charAt(0) || 'D'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px', color: '#333' }}>{driver.name}</div>
                  <div style={{ fontSize: '14px', color: '#FF3B30', marginBottom: '5px' }}>⭐ {driver.rating?.toFixed(1) || '5.0'} • Professional</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>🟢 Available now</div>
                </div>
                <div style={{
                  background: '#FF3B30',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
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
      <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
        <div className="fade-in" style={{
          background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B35 100%)',
          padding: '20px',
          paddingTop: '50px',
          borderRadius: '0 0 25px 25px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setActiveTab('home')} 
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                borderRadius: '12px',
                padding: '10px',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                marginRight: '15px'
              }}
            >←</button>
            <div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>My Orders</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>{requests.length} total orders</div>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px' }}>
          {loading ? (
            <div className="shimmer" style={{ height: '80px', borderRadius: '16px', marginBottom: '15px' }}></div>
          ) : requests.length === 0 ? (
            <div className="fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>No orders yet</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Your delivery history will appear here</div>
            </div>
          ) : (
            requests.map((request, index) => (
              <div 
                key={request._id} 
                className="slide-up"
                onClick={() => navigate(`/track/${request._id}`)} 
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  animationDelay: `${index * 0.1}s`,
                  transition: 'transform 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px', color: '#333' }}>{request.item}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>from {request.store}</div>
                  </div>
                  <div style={{
                    background: request.status === 'completed' ? '#00D084' : 
                               request.status === 'pending' ? '#FF9800' : 
                               request.status === 'delivering' ? '#2196F3' : '#FF3B30',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}>
                    {request.status}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF3B30' }}>{request.price} MAD</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Tap to track →</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh', position: 'relative' }}>
      {/* Glovo-style Header */}
      <div className="fade-in" style={{
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
          background: 'white',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          marginRight: '15px'
        }}>
          <div style={{ fontSize: '16px', marginRight: '8px' }}>📍</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
              {user.homeAddress?.address || 'Set your location'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Delivery address</div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          style={{
            width: '48px',
            height: '48px',
            background: '#FF3B30',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255, 59, 48, 0.3)'
          }}
        >
          {user.name?.charAt(0) || 'U'}
        </button>
      </div>

      {/* Map Section */}
      <div style={{ position: 'relative', height: '60vh', width: '100%', marginTop: '80px' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        
        {/* Drivers Counter */}
        <div className="pulse" style={{
          position: 'absolute',
          top: '90px',
          right: '20px',
          background: availableDrivers.length > 0 ? '#FF3B30' : 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          {availableDrivers.length} drivers
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="slide-up" style={{
        background: 'white',
        borderRadius: '25px 25px 0 0',
        padding: '25px 20px 20px',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
        marginTop: '-25px',
        position: 'relative',
        zIndex: 1000
      }}>
        <div style={{
          width: '40px',
          height: '4px',
          background: '#E5E5E5',
          borderRadius: '2px',
          margin: '0 auto 20px'
        }}></div>
        
        <button 
          className="pulse"
          onClick={() => navigate('/create-request')}
          style={{
            width: '100%',
            background: '#FF3B30',
            border: 'none',
            borderRadius: '16px',
            padding: '18px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '20px',
            boxShadow: '0 8px 25px rgba(255, 59, 48, 0.3)'
          }}
        >
          Request Delivery
        </button>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{
              background: '#F8F8F8',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>📦</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Orders</div>
          </button>
          <button 
            onClick={() => setActiveTab('drivers')}
            style={{
              background: '#F8F8F8',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>👥</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Drivers</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;