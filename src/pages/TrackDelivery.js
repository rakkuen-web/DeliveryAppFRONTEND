import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LiveTrackingMap from '../components/LiveTrackingMap';

import { API_URL } from '../config';

function TrackDelivery({ user }) {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRequest();
    // Set up polling for real-time updates
    const interval = setInterval(loadRequest, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

  const loadRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/requests/my/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const foundRequest = response.data.find(r => r._id === requestId);
      setRequest(foundRequest);
    } catch (error) {
      console.error('Error loading request:', error);
    }
    setLoading(false);
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

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Looking for a driver...',
      accepted: 'Driver is on the way to the store',
      shopping: 'Driver is shopping for your items',
      delivering: 'Driver is on the way to you',
      completed: 'Delivery completed!',
      cancelled: 'Request was cancelled'
    };
    return messages[status] || status;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Request not found</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Modern Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white',
        borderRadius: '0 0 25px 25px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              color: 'white', 
              fontSize: '20px', 
              padding: '8px 12px',
              borderRadius: '10px',
              marginRight: '15px',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>📍</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Track Delivery</h1>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>Live tracking</p>
          </div>
        </div>
        
        {/* Status Card */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '15px',
          padding: '15px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                {request.item} from {request.store}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                {getStatusMessage(request.status)}
              </div>
            </div>
            <div style={{
              background: getStatusColor(request.status),
              color: 'white',
              padding: '6px 12px',
              borderRadius: '15px',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {request.status}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <LiveTrackingMap request={request} user={user} />

        {request.driverId && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            marginTop: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>Your Driver</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                marginRight: '15px'
              }}>
                {request.driverId.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{request.driverId.name}</h4>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                  📞 {request.driverId.phone}
                </div>
                <div style={{ color: '#FFC107', fontSize: '14px' }}>
                  ⭐ {request.driverId.rating?.toFixed(1) || '5.0'} • Professional driver
                </div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <button 
                onClick={() => window.open(`tel:${request.driverId.phone}`)}
                style={{
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '15px',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📞 Call Driver
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/${request.driverId.phone.replace(/[^0-9]/g, '')}?text=Hi, I'm tracking my delivery order`)}
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '15px',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                💬 WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackDelivery;