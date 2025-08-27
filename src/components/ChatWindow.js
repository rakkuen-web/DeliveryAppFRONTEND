import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config';
import '../styles/comfort.css';

const socket = io(SOCKET_URL);

function ChatWindow({ requestId, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Join chat room
    socket.emit('join-chat', requestId);
    
    // Listen for messages
    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    socket.on('user-typing', (data) => {
      if (data.userId !== user._id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });
    
    return () => {
      socket.off('new-message');
      socket.off('user-typing');
    };
  }, [requestId, user._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const messageData = {
      requestId,
      senderId: user._id,
      senderType: user.userType,
      message: newMessage,
      timestamp: new Date()
    };
    
    socket.emit('send-message', messageData);
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
  };

  const handleTyping = () => {
    socket.emit('typing', { requestId, userId: user._id, userType: user.userType });
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '0',
      right: '20px',
      width: '300px',
      height: '400px',
      background: 'white',
      borderRadius: '12px 12px 0 0',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--primary)',
        color: 'white',
        borderRadius: '12px 12px 0 0'
      }}>
        <div>
          <div style={{ fontWeight: '600', fontSize: '14px' }}>
            💬 Chat with {user.userType === 'customer' ? 'Driver' : 'Customer'}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Order #{requestId.slice(-6)}
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >×</button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            alignSelf: msg.senderId === user._id ? 'flex-end' : 'flex-start',
            maxWidth: '80%'
          }}>
            <div style={{
              background: msg.senderId === user._id ? 'var(--primary)' : 'var(--background)',
              color: msg.senderId === user._id ? 'white' : 'var(--text)',
              padding: '8px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              wordBreak: 'break-word'
            }}>
              {msg.message}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '4px',
              textAlign: msg.senderId === user._id ? 'right' : 'left'
            }}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{
            alignSelf: 'flex-start',
            background: 'var(--background)',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '14px',
            color: 'var(--text-muted)',
            fontStyle: 'italic'
          }}>
            Typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') sendMessage();
            handleTyping();
          }}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            outline: 'none',
            fontSize: '14px'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          style={{
            background: newMessage.trim() ? 'var(--primary)' : 'var(--text-muted)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;