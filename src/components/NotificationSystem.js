import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config';
import '../styles/comfort.css';

const socket = io(SOCKET_URL);

function NotificationSystem({ user }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Join user's notification room
    socket.emit('join-notifications', user._id);
    
    // Listen for new notifications
    socket.on('new-notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo192.png',
          badge: '/logo192.png'
        });
      }
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    });
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      socket.off('new-notification');
    };
  }, [user._id]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_accepted': return '✅';
      case 'status_shopping': return '🛒';
      case 'status_delivering': return '🚚';
      case 'order_completed': return '🎉';
      case 'order_cancelled': return '❌';
      case 'new_message': return '💬';
      default: return '📱';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order_accepted': return '#10b981';
      case 'status_shopping': return '#f59e0b';
      case 'status_delivering': return '#6366f1';
      case 'order_completed': return '#10b981';
      case 'order_cancelled': return '#ef4444';
      case 'new_message': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '350px'
    }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="slide-up"
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            border: `2px solid ${getNotificationColor(notification.type)}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer'
          }}
          onClick={() => removeNotification(notification.id)}
        >
          <div style={{
            fontSize: '24px',
            flexShrink: 0
          }}>
            {getNotificationIcon(notification.type)}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: '600',
              fontSize: '14px',
              marginBottom: '4px',
              color: getNotificationColor(notification.type)
            }}>
              {notification.title}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--text)',
              lineHeight: '1.4'
            }}>
              {notification.message}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '8px'
            }}>
              {new Date(notification.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '4px',
              flexShrink: 0
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default NotificationSystem;