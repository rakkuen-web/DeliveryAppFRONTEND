import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationSelector from '../components/LocationSelector';

import { API_BASE_URL } from '../config';

function CreateRequest({ user }) {
  const [formData, setFormData] = useState({
    item: '',
    store: '',
    price: '',
    deliveryLocation: user?.homeAddress || null,
    notes: ''
  });
  const [useHomeAddress, setUseHomeAddress] = useState(true);
  const [showDeliveryMap, setShowDeliveryMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleDeliveryLocationSelect = (type, location) => {
    setFormData(prev => ({
      ...prev,
      deliveryLocation: location
    }));
    setShowDeliveryMap(false);
  };

  const handleDeliveryAddressChange = () => {
    if (!user?.homeAddress) {
      navigate('/profile');
      return;
    }
    setUseHomeAddress(!useHomeAddress);
    setFormData(prev => ({
      ...prev,
      deliveryLocation: useHomeAddress ? null : user.homeAddress
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item || !formData.store || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }
    if (!formData.deliveryLocation) {
      alert('Please set delivery location');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        customerId: user._id,
        item: formData.item,
        store: formData.store,
        price: parseFloat(formData.price),
        notes: formData.notes,
        pickupLocation: {
          latitude: 0, // Store location - you'll need to get this
          longitude: 0,
          address: formData.store
        },
        deliveryLocation: {
          latitude: formData.deliveryLocation.coordinates?.lat || 0,
          longitude: formData.deliveryLocation.coordinates?.lng || 0,
          address: formData.deliveryLocation.address
        }
      };

      await axios.post(`${API_BASE_URL}/requests`, requestData);
      alert('Request created successfully!');
      navigate('/');
    } catch (error) {
      alert('Error creating request. Please try again.');
    }
    setLoading(false);
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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
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
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🚚</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Request Delivery</h1>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>Get anything delivered fast</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

      {!user?.homeAddress && (
        <div className="card" style={{ background: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <p>⚠️ Please set your home address first</p>
          <button 
            type="button"
            onClick={() => navigate('/profile')}
            className="btn-secondary"
          >
            Set Home Address
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', background: '#4CAF50', borderRadius: '50%', marginRight: '10px' }}></div>
          <span>Pickup Location</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', background: '#333', borderRadius: '50%', marginRight: '10px' }}></div>
          <span>Delivery Location</span>
        </div>
      </div>

        <form onSubmit={handleSubmit}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>What do you need? *</label>
              <input
                type="text"
                name="item"
                placeholder="e.g., Bread, Medicine, Groceries"
                value={formData.item}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>From which store? *</label>
              <input
                type="text"
                name="store"
                placeholder="e.g., Carrefour, Marjane, Local Pharmacy"
                value={formData.store}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

          <div className="input-group">
            <label>Delivery Location *</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <input 
                type="checkbox" 
                checked={useHomeAddress}
                onChange={handleDeliveryAddressChange}
              />
              <span>Deliver to my home address</span>
            </div>
            
            <button
              type="button"
              onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setFormData(prev => ({
                      ...prev,
                      deliveryLocation: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        address: `Current Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
                      }
                    }));
                    setUseHomeAddress(false);
                  },
                  (error) => alert('Could not get your location. Please try again.')
                );
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #4CAF50',
                borderRadius: '8px',
                background: 'white',
                color: '#4CAF50',
                cursor: 'pointer',
                marginBottom: '10px',
                fontWeight: 'bold'
              }}
            >
              📍 Use My Current Location
            </button>
            
            {!useHomeAddress && (
              <button
                type="button"
                onClick={() => setShowDeliveryMap(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px dashed #ccc',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {formData.deliveryLocation ? 
                  `📍 ${formData.deliveryLocation.address}` : 
                  '🗺️ Select different delivery location'
                }
              </button>
            )}
            
            {useHomeAddress && formData.deliveryLocation && (
              <div style={{ padding: '8px', background: '#f0f8f0', borderRadius: '4px' }}>
                🏠 {formData.deliveryLocation.address}
              </div>
            )}
          </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>Delivery fee (MAD) *</label>
              <input
                type="number"
                name="price"
                placeholder="Amount in MAD"
                value={formData.price}
                onChange={handleInputChange}
                min="5"
                required
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                💡 This is what you'll pay the driver for the service (not including item cost)
              </small>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>Additional Notes</label>
              <textarea
                name="notes"
                placeholder="Any special instructions..."
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !formData.deliveryLocation}
            style={{
              width: '100%',
              padding: '18px',
              background: loading || !formData.deliveryLocation ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading || !formData.deliveryLocation ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            {loading ? '🔄 Creating Request...' : '🚀 Request Delivery'}
          </button>
        </form>
      </div>

      {showDeliveryMap && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'white',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setShowDeliveryMap(false)}
              style={{ background: 'none', border: 'none', fontSize: '24px', marginRight: '15px' }}
            >
              ←
            </button>
            <h2>Select Delivery Location</h2>
          </div>
          
          <LocationSelector
            onLocationSelect={handleDeliveryLocationSelect}
            deliveryLocation={formData.deliveryLocation}
            mode="delivery"
          />
        </div>
      )}
    </div>
  );
}

export default CreateRequest;