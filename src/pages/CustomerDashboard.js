import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { getUserCity } from '../utils/cityDetector';
import { API_BASE_URL, SOCKET_URL } from '../config';
import '../styles/neon.css';

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
    
    // Dark theme map
    window.L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
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
          html: `<div class="holo-marker">🚀</div>`,
          className: 'custom-marker',
          iconSize: [50, 50],
          iconAnchor: [25, 25]
        });
        
        const marker = window.L.marker(
          [driver.currentLocation.latitude, driver.currentLocation.longitude],
          { icon: driverIcon }
        ).addTo(map);
        
        marker.bindPopup(`
          <div style="
            background: var(--card-bg); 
            color: white; 
            padding: 20px; 
            border-radius: 15px;
            border: 1px solid var(--neon-blue);
            text-align: center;
            font-family: 'Orbitron', monospace;
            min-width: 180px;
          ">
            <div style="
              width: 60px; height: 60px; 
              background: linear-gradient(45deg, var(--neon-blue), var(--neon-purple));
              border-radius: 50%; display: flex; align-items: center; justify-content: center;
              color: white; font-weight: 700; font-size: 24px; margin: 0 auto 15px;
              box-shadow: 0 0 30px var(--neon-blue);
            ">${driver.name?.charAt(0) || 'D'}</div>
            <div style="font-weight: 600; margin-bottom: 10px; color: var(--neon-blue);">${driver.name}</div>
            <div style="color: var(--neon-green); margin-bottom: 15px;">⭐ ${driver.rating?.toFixed(1) || '5.0'}</div>
            <div style="
              background: var(--neon-green); 
              color: black; 
              padding: 8px 15px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: bold;
              text-transform: uppercase;
            ">ONLINE</div>
          </div>
        `);
        
        window.driverMarkers.push(marker);
      }
    });
  };

  if (activeTab === 'drivers') {
    return (
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <div className="cyber-bg"></div>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))',
          padding: '50px 20px 30px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setActiveTab('home')} 
              className="holo-btn"
              style={{ 
                padding: '12px',
                marginRight: '15px',
                fontSize: '18px'
              }}
            >←</button>
            <div>
              <div className="cyber-text" style={{ fontSize: '24px' }}>ACTIVE DRONES</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontFamily: 'Orbitron' }}>
                {availableDrivers.length} UNITS ONLINE
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px', marginTop: '-20px', position: 'relative', zIndex: 10 }}>
          {availableDrivers.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚀</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--neon-blue)' }}>
                NO DRONES AVAILABLE
              </div>
              <div style={{ fontSize: '14px', color: 'var(--neon-purple)' }}>SCANNING FOR UNITS...</div>
            </div>
          ) : (
            availableDrivers.map((driver, index) => (
              <div key={driver._id} className="glass-card float" style={{
                display: 'flex',
                alignItems: 'center',
                animationDelay: `${index * 0.2}s`
              }}>
                <div className="neon-glow" style={{
                  width: '70px', height: '70px',
                  background: 'linear-gradient(45deg, var(--neon-blue), var(--neon-purple))',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '24px', marginRight: '20px'
                }}>
                  {driver.name?.charAt(0) || 'D'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '18px', 
                    marginBottom: '8px', 
                    color: 'var(--neon-blue)',
                    fontFamily: 'Orbitron'
                  }}>
                    {driver.name}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--neon-green)', 
                    marginBottom: '5px',
                    fontFamily: 'Orbitron'
                  }}>
                    ⭐ {driver.rating?.toFixed(1) || '5.0'} • NEURAL LINK ACTIVE
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neon-purple)' }}>🟢 READY FOR DEPLOYMENT</div>
                </div>
                <div style={{
                  background: 'var(--neon-green)',
                  color: 'black',
                  padding: '10px 15px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  fontFamily: 'Orbitron'
                }}>
                  2 MIN
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
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <div className="cyber-bg"></div>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-pink))',
          padding: '50px 20px 30px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setActiveTab('home')} 
              className="holo-btn"
              style={{ 
                padding: '12px',
                marginRight: '15px',
                fontSize: '18px'
              }}
            >←</button>
            <div>
              <div className="cyber-text" style={{ fontSize: '24px' }}>MISSION LOG</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontFamily: 'Orbitron' }}>
                {requests.length} TOTAL MISSIONS
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px', marginTop: '-20px', position: 'relative', zIndex: 10 }}>
          {loading ? (
            <div className="glass-card" style={{ 
              height: '80px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <div className="cyber-loading"></div>
              <span style={{ marginLeft: '15px', fontFamily: 'Orbitron' }}>LOADING MISSIONS...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--neon-purple)' }}>
                NO MISSIONS LOGGED
              </div>
              <div style={{ fontSize: '14px', color: 'var(--neon-blue)' }}>YOUR DELIVERY HISTORY WILL APPEAR HERE</div>
            </div>
          ) : (
            requests.map((request, index) => (
              <div 
                key={request._id} 
                className="glass-card float"
                onClick={() => navigate(`/track/${request._id}`)} 
                style={{
                  cursor: 'pointer',
                  animationDelay: `${index * 0.1}s`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '16px', 
                      marginBottom: '5px', 
                      color: 'var(--neon-blue)',
                      fontFamily: 'Orbitron'
                    }}>
                      {request.item}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--neon-purple)' }}>FROM: {request.store}</div>
                  </div>
                  <div style={{
                    background: request.status === 'completed' ? 'var(--neon-green)' : 
                               request.status === 'pending' ? 'var(--neon-blue)' : 
                               request.status === 'delivering' ? 'var(--neon-purple)' : 'var(--neon-pink)',
                    color: request.status === 'completed' ? 'black' : 'white',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontFamily: 'Orbitron'
                  }}>
                    {request.status}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: 'var(--neon-green)',
                    fontFamily: 'Orbitron'
                  }}>
                    {request.price} MAD
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neon-blue)' }}>◉ TAP TO TRACK</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="cyber-bg"></div>
      
      {/* Floating HUD */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="glass-card" style={{
          display: 'flex', alignItems: 'center', flex: 1, marginRight: '15px',
          padding: '15px'
        }}>
          <div style={{ fontSize: '16px', marginRight: '10px' }}>📍</div>
          <div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--neon-blue)',
              fontFamily: 'Orbitron'
            }}>
              {user.homeAddress?.address || 'SET COORDINATES'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--neon-purple)' }}>DELIVERY ZONE</div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="neon-glow"
          style={{
            width: '50px', height: '50px',
            background: 'linear-gradient(45deg, var(--neon-blue), var(--neon-purple))',
            border: 'none',
            borderRadius: '15px', color: 'white',
            fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
            fontFamily: 'Orbitron'
          }}
        >
          {user.name?.charAt(0) || 'U'}
        </button>
      </div>

      {/* Holographic Map */}
      <div style={{ 
        position: 'relative', 
        height: '60vh', 
        width: '100%', 
        marginTop: '100px',
        border: '2px solid var(--neon-blue)',
        borderRadius: '20px',
        margin: '100px 20px 0',
        overflow: 'hidden',
        boxShadow: '0 0 50px var(--neon-blue)'
      }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        
        <div className="neon-glow" style={{
          position: 'absolute', top: '20px', right: '20px',
          background: availableDrivers.length > 0 ? 'var(--neon-green)' : 'var(--neon-pink)',
          color: availableDrivers.length > 0 ? 'black' : 'white',
          padding: '10px 15px', borderRadius: '20px',
          fontSize: '12px', fontWeight: 'bold',
          fontFamily: 'Orbitron',
          textTransform: 'uppercase'
        }}>
          {availableDrivers.length} DRONES ACTIVE
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-card scan-lines" style={{
        margin: '20px',
        padding: '30px',
        position: 'relative'
      }}>
        <div style={{
          width: '50px', height: '4px', background: 'var(--neon-blue)',
          borderRadius: '2px', margin: '0 auto 25px',
          boxShadow: '0 0 10px var(--neon-blue)'
        }}></div>
        
        <button 
          className="holo-btn neon-glow"
          onClick={() => navigate('/create-request')}
          style={{ 
            width: '100%', 
            marginBottom: '25px',
            fontSize: '18px',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}
        >
          ◉ INITIATE DELIVERY
        </button>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <button 
            onClick={() => setActiveTab('orders')}
            className="glass-card"
            style={{
              border: '2px solid var(--neon-purple)',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '20px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 0 30px var(--neon-purple)'}
            onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📦</div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--neon-purple)',
              fontFamily: 'Orbitron'
            }}>
              MISSIONS
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('drivers')}
            className="glass-card"
            style={{
              border: '2px solid var(--neon-green)',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '20px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 0 30px var(--neon-green)'}
            onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚀</div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--neon-green)',
              fontFamily: 'Orbitron'
            }}>
              DRONES
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;