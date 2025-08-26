import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { API_BASE_URL } from '../config';

const NotificationSystem = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 5 seconds
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/notifications/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'order_accepted': '✅',
      'driver_assigned': '🚗',
      'status_shopping': '🛒',
      'status_delivering': '🚚',
      'order_completed': '🎉',
      'order_cancelled': '❌'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'order_accepted': '#4CAF50',
      'driver_assigned': '#2196F3',
      'status_shopping': '#FF9800',
      'status_delivering': '#9C27B0',
      'order_completed': '#4CAF50',
      'order_cancelled': '#F44336'
    };
    return colors[type] || '#667eea';
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      margin: '10px 0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '24px', marginRight: '10px' }}>🔔</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              Notifications
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Stay updated on your deliveries
            </div>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <div style={{
            background: '#FF6B35',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {unreadCount}
          </div>
        )}
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>No notifications yet</div>
            <div style={{ fontSize: '14px' }}>You'll see delivery updates here</div>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification._id}
              onClick={() => !notification.read && markAsRead(notification._id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '16px',
                marginBottom: '12px',
                background: notification.read ? '#f8f9fa' : '#fff',
                border: `2px solid ${notification.read ? '#e9ecef' : getNotificationColor(notification.type)}`,
                borderRadius: '12px',
                cursor: notification.read ? 'default' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: '24px',
                marginRight: '12px',
                color: getNotificationColor(notification.type)
              }}>
                {getNotificationIcon(notification.type)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: notification.read ? 'normal' : 'bold',
                  color: '#333',
                  marginBottom: '4px'
                }}>
                  {notification.title}
                </div>
                
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  {notification.message}
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: '#999'
                }}>
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
              
              {!notification.read && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: getNotificationColor(notification.type),
                  borderRadius: '50%',
                  marginTop: '8px'
                }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationSystem;