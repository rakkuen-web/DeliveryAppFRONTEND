import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import '../styles/comfort.css';

function ReviewModal({ request, user, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [speedRating, setSpeedRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const reviewData = {
        requestId: request._id,
        customerId: user._id,
        driverId: request.driverId._id || request.driverId,
        rating,
        comment,
        speedRating,
        qualityRating,
        communicationRating
      };

      await axios.post(`${API_BASE_URL}/reviews`, reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
    setSubmitting(false);
  };

  const StarRating = ({ value, onChange, label }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: star <= value ? '#FFD700' : '#E5E5E5'
            }}
          >
            ⭐
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div className="comfort-card" style={{
        maxWidth: '400px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            Delivery Completed!
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
            How was your experience with {request.driverId?.name || 'your driver'}?
          </p>
        </div>

        <StarRating 
          value={rating} 
          onChange={setRating} 
          label="Overall Rating" 
        />

        <StarRating 
          value={speedRating} 
          onChange={setSpeedRating} 
          label="⚡ Speed" 
        />

        <StarRating 
          value={qualityRating} 
          onChange={setQualityRating} 
          label="📦 Service Quality" 
        />

        <StarRating 
          value={communicationRating} 
          onChange={setCommunicationRating} 
          label="💬 Communication" 
        />

        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px', 
            fontWeight: '500' 
          }}>
            Additional Comments (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
              minHeight: '80px'
            }}
            maxLength={500}
          />
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--text-muted)', 
            textAlign: 'right',
            marginTop: '4px'
          }}>
            {comment.length}/500
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'var(--background)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Skip for now
          </button>
          <button
            onClick={submitReview}
            disabled={submitting}
            className="comfort-button"
            style={{
              flex: 2,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Submitting...' : '⭐ Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewModal;