import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationTracker from '../utils/locationTracker';
import DriverLocationSharer from '../components/DriverLocationSharer';
import TrackingTest from '../components/TrackingTest';
import ChatWindow from '../components/ChatWindow';
import NotificationSystem from '../components/NotificationSystem';
import io from 'socket.io-client';
import { API_BASE_URL } from '../config';
import '../styles/comfort.css';

function DriverDashboard({ user }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [isOnline, setIsOnline] = useState(user.isOnline || false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [locationTracker] = useState(new LocationTracker(user._id));
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [activeChatRequest, setActiveChatRequest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingRequests();
    loadMyRequests();
    
    // Initialize socket connection for driver
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    window.driverSocket = socket;
    
    // Start location tracking when driver goes online
    if (isOnline) {
      startLocationTracking();
    }
    
    return () => {
      locationTracker.stopTracking();
      socket.disconnect();
      window.driverSocket = null;
    };
  }, []);
  
  useEffect(() => {
    if (isOnline) {
      startLocationTracking();
    } else {
      locationTracker.stopTracking();
    }
  }, [isOnline]);

  const loadPendingRequests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/requests/pending`);
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
    setLoading(false);
  };

  const loadMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/requests/my/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyRequests(response.data.filter(r => r.driverId?._id === user._id));
    } catch (error) {
      console.error('Error loading my requests:', error);
    }
  };

  const startLocationTracking = async () => {
    const location = await locationTracker.getCurrentLocation();
    setCurrentLocation(location);
    locationTracker.startTracking();
    console.log('📍 Location tracking started:', location);
  };
  
  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      await axios.patch(`${API_BASE_URL}/users/${user._id}/online`, {
        isOnline: newStatus
      });
      setIsOnline(newStatus);
      
      if (newStatus) {
        startLocationTracking();
      } else {
        locationTracker.stopTracking();
        setCurrentLocation(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/requests/${requestId}/accept`, {
        driverId: user._id
      });
      
      // Mark driver as busy and assign to customer
      await axios.patch(`${API_BASE_URL}/users/${user._id}`, {
        isBusy: true,
        assignedCustomer: response.data.customerId
      });
      
      // Remove from pending and reload
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      loadMyRequests();
      alert('Request accepted! Contact the customer to coordinate.');
    } catch (error) {
      alert('Error accepting request. It may have been taken by another driver.');
      loadPendingRequests();
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      await axios.patch(`${API_BASE_URL}/requests/${requestId}/status`, { status });
      
      // If delivery is completed, mark driver as available again
      if (status === 'completed') {
        await axios.patch(`${API_BASE_URL}/users/${user._id}`, {
          isBusy: false,
          assignedCustomer: null
        });
      }
      
      loadMyRequests();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FF9800',
      accepted: '#4CAF50',
      shopping: '#2196F3',
      delivering: '#9C27B0',
      completed: '#4CAF50',
      cancelled: '#F44336'
    };
    return colors[status] || '#666';
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Modern Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white',
        borderRadius: '0 0 25px 25px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginRight: '15px'
            }}>
              🚗
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{user.name}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Driver • ⭐ {user.rating?.toFixed(1) || '5.0'}</div>
            </div>
          </div>
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '8px 15px',
            borderRadius: '20px',
            cursor: 'pointer'
          }}>
            Logout
          </button>
        </div>
        
        {/* Status Card */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '20px',
          padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                {isOnline ? 'Ready to receive requests' : 'Go online to start earning'}
              </div>
              {currentLocation && (
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
                  📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </div>
              )}
            </div>
            <button 
              onClick={toggleOnlineStatus}
              style={{
                background: isOnline ? '#ff4757' : '#2ed573',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Modern Tabs */}
        <div style={{
          display: 'flex',
          background: 'white',
          borderRadius: '15px',
          padding: '5px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <button 
            onClick={() => setActiveTab('available')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              background: activeTab === 'available' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: activeTab === 'available' ? 'white' : '#666',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📎 Available ({pendingRequests.length})
          </button>
          <button 
            onClick={() => setActiveTab('my-deliveries')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              background: activeTab === 'my-deliveries' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: activeTab === 'my-deliveries' ? 'white' : '#666',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🚚 My Deliveries ({myRequests.length})
          </button>
        </div>

      {activeTab === 'available' ? (
        loading ? (
          <div className="loading">Loading requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#666', fontSize: '16px' }}>No requests available</p>
            <p style={{ color: '#999', fontSize: '14px' }}>Check back later for new delivery requests</p>
          </div>
        ) : (
          pendingRequests.map(request => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div>
                  <h4 style={{ margin: 0, color: '#333' }}>{request.item}</h4>
                  <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                    from {request.store}
                  </p>
                </div>
                <div className="request-price">{request.price} MAD</div>
              </div>
              
              <div className="request-details">
                <p><strong>Customer:</strong> {request.customerId.name} 
                  <span style={{ color: '#FFC107', marginLeft: '5px' }}>
                    ⭐ {request.customerId.rating?.toFixed(1) || '5.0'}
                  </span>
                </p>
                <p><strong>Pickup:</strong> {request.pickupLocation.address}</p>
                <p><strong>Delivery:</strong> {request.deliveryLocation.address}</p>
                {request.notes && (
                  <p><strong>Notes:</strong> {request.notes}</p>
                )}
              </div>
              
              <button 
                className="btn-primary"
                onClick={() => acceptRequest(request._id)}
                style={{ marginTop: '15px' }}
                disabled={user.isBusy}
              >
                {user.isBusy ? 'Complete Current Delivery First' : 'Accept Request'}
              </button>
            </div>
          ))
        )
      ) : (
        myRequests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#666', fontSize: '16px' }}>No active deliveries</p>
            <p style={{ color: '#999', fontSize: '14px' }}>Accept requests to start earning</p>
          </div>
        ) : (
          myRequests.map(request => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div>
                  <h4 style={{ margin: 0, color: '#333' }}>{request.item}</h4>
                  <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                    from {request.store}
                  </p>
                </div>
                <div className="request-price">{request.price} MAD</div>
              </div>
              
              <div className="request-details">
                <p><strong>Status:</strong> 
                  <span style={{ color: getStatusColor(request.status), marginLeft: '5px' }}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </p>
                <p><strong>Customer:</strong> {request.customerId.name}</p>
                <p><strong>Phone:</strong> {request.customerId.phone}</p>
                <p><strong>Pickup:</strong> {request.pickupLocation.address}</p>
                <p><strong>Delivery:</strong> {request.deliveryLocation.address}</p>
              </div>
              
              {request.status === 'accepted' && (
                <button 
                  className="btn-primary"
                  onClick={() => updateRequestStatus(request._id, 'shopping')}
                  style={{ marginTop: '15px' }}
                >
                  Start Shopping
                </button>
              )}
              
              {request.status === 'shopping' && (
                <button 
                  className="btn-primary"
                  onClick={() => updateRequestStatus(request._id, 'delivering')}
                  style={{ marginTop: '15px' }}
                >
                  Start Delivery
                </button>
              )}
              
              {request.status === 'delivering' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button 
                    onClick={() => {
                      setActiveChatRequest(request);
                      setShowChat(true);
                    }}
                    style={{
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    💬 Chat with Customer
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => updateRequestStatus(request._id, 'completed')}
                    style={{ flex: 1 }}
                  >
                    Mark as Delivered
                  </button>
                </div>
              )}
              
              {['accepted', 'shopping'].includes(request.status) && (
                <button 
                  onClick={() => {
                    setActiveChatRequest(request);
                    setShowChat(true);
                  }}
                  style={{
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    marginTop: '10px',
                    width: '100%'
                  }}
                >
                  💬 Chat with Customer
                </button>
              )}
            </div>
          ))
        )
      )}
      
      {/* Location Sharing for Active Deliveries */}
      {myRequests.find(r => ['accepted', 'shopping', 'delivering'].includes(r.status)) && (
        <DriverLocationSharer 
          user={user} 
          activeDelivery={myRequests.find(r => ['accepted', 'shopping', 'delivering'].includes(r.status))}
        />
      )}
      
      {/* Tracking Test Component */}
      <TrackingTest user={user} />

      </div>
    </div>
  );
}

export default DriverDashboard;