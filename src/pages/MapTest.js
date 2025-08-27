import React, { useState, useRef, useEffect } from 'react';
import '../styles/comfort.css';

function MapTest() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [pickupMarker, setPickupMarker] = useState(null);
  const [dropoffMarker, setDropoffMarker] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [currentMode, setCurrentMode] = useState('pickup'); // 'pickup' or 'dropoff'

  useEffect(() => {
    initMap();
  }, []);

  const initMap = () => {
    if (!mapRef.current || !window.L || map) return;

    const leafletMap = window.L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([33.5731, -7.5898], 13); // Casablanca

    window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: '',
      maxZoom: 20
    }).addTo(leafletMap);

    // Map click handler
    leafletMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setMarker(lat, lng);
      reverseGeocode(lat, lng);
    });

    setMap(leafletMap);
  };

  const setMarker = (lat, lng) => {
    if (!map) return;

    const icon = window.L.divIcon({
      html: `<div style="
        width: 40px; height: 40px;
        background: ${currentMode === 'pickup' ? '#10b981' : '#6366f1'};
        border-radius: 50%; border: 3px solid white;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">${currentMode === 'pickup' ? '📍' : '🎯'}</div>`,
      className: 'custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = window.L.marker([lat, lng], { icon }).addTo(map);

    if (currentMode === 'pickup') {
      if (pickupMarker) map.removeLayer(pickupMarker);
      setPickupMarker(marker);
    } else {
      if (dropoffMarker) map.removeLayer(dropoffMarker);
      setDropoffMarker(marker);
    }

    // Make marker draggable
    marker.dragging.enable();
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      reverseGeocode(lat, lng);
    });
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
      if (currentMode === 'pickup') {
        setPickupAddress(address);
      } else {
        setDropoffAddress(address);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      const fallbackAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      if (currentMode === 'pickup') {
        setPickupAddress(fallbackAddress);
      } else {
        setDropoffAddress(fallbackAddress);
      }
    }
  };

  const geocodeAddress = async () => {
    if (!searchAddress.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        map.setView([latitude, longitude], 16);
        setMarker(latitude, longitude);
        reverseGeocode(latitude, longitude);
        setSearchAddress('');
      } else {
        alert('Address not found. Please try a different search.');
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      alert('Search failed. Please try again.');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 16);
        setMarker(latitude, longitude);
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please try again or set manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="comfort-container">
      {/* Header */}
      <div className="comfort-header fade-in">
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
          Interactive Map Test
        </h1>
        <p style={{ opacity: 0.9, fontSize: '14px' }}>
          Tap map to set locations • Drag markers to adjust
        </p>
      </div>

      {/* Controls */}
      <div style={{ padding: '24px', marginTop: '-20px' }}>
        {/* Mode Selector */}
        <div className="comfort-card slide-up">
          <h3 className="font-semibold mb-3">Select Location Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => setCurrentMode('pickup')}
              className={`comfort-button ${currentMode === 'pickup' ? '' : 'comfort-card'}`}
              style={{
                background: currentMode === 'pickup' ? 'var(--secondary)' : 'var(--background)',
                color: currentMode === 'pickup' ? 'white' : 'var(--text)',
                border: currentMode === 'pickup' ? 'none' : '2px solid var(--border)'
              }}
            >
              📍 Pickup Point
            </button>
            <button
              onClick={() => setCurrentMode('dropoff')}
              className={`comfort-button ${currentMode === 'dropoff' ? '' : 'comfort-card'}`}
              style={{
                background: currentMode === 'dropoff' ? 'var(--primary)' : 'var(--background)',
                color: currentMode === 'dropoff' ? 'white' : 'var(--text)',
                border: currentMode === 'dropoff' ? 'none' : '2px solid var(--border)'
              }}
            >
              🎯 Drop-off Point
            </button>
          </div>
        </div>

        {/* Address Search */}
        <div className="comfort-card slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-semibold mb-3">Search Address</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Enter address to search..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && geocodeAddress()}
              className="comfort-input"
              style={{ flex: 1 }}
            />
            <button onClick={geocodeAddress} className="comfort-button">
              🔍
            </button>
          </div>
          <button 
            onClick={getCurrentLocation}
            className="comfort-button"
            style={{ 
              width: '100%', 
              marginTop: '12px',
              background: 'var(--accent)',
              fontSize: '14px'
            }}
          >
            📍 Use My Current Location
          </button>
        </div>

        {/* Selected Addresses */}
        <div className="comfort-card slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold mb-3">Selected Locations</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '8px',
              color: 'var(--secondary)',
              fontWeight: '500'
            }}>
              📍 Pickup Location
            </div>
            <div style={{
              padding: '12px',
              background: pickupAddress ? 'var(--background)' : '#f3f4f6',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              color: pickupAddress ? 'var(--text)' : 'var(--text-muted)',
              border: '1px solid var(--border)'
            }}>
              {pickupAddress || 'Tap map to set pickup location'}
            </div>
          </div>

          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '8px',
              color: 'var(--primary)',
              fontWeight: '500'
            }}>
              🎯 Drop-off Location
            </div>
            <div style={{
              padding: '12px',
              background: dropoffAddress ? 'var(--background)' : '#f3f4f6',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              color: dropoffAddress ? 'var(--text)' : 'var(--text-muted)',
              border: '1px solid var(--border)'
            }}>
              {dropoffAddress || 'Tap map to set drop-off location'}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div style={{ 
        margin: '0 24px 24px',
        height: '400px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        
        {/* Map Instructions */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--text)',
          boxShadow: 'var(--shadow)',
          maxWidth: '200px'
        }}>
          <div style={{ color: currentMode === 'pickup' ? 'var(--secondary)' : 'var(--primary)' }}>
            {currentMode === 'pickup' ? '📍 Setting Pickup' : '🎯 Setting Drop-off'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Tap map or drag markers
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ padding: '0 24px 24px' }}>
        <button 
          className="comfort-button"
          disabled={!pickupAddress || !dropoffAddress}
          style={{
            width: '100%',
            opacity: (!pickupAddress || !dropoffAddress) ? 0.5 : 1,
            cursor: (!pickupAddress || !dropoffAddress) ? 'not-allowed' : 'pointer'
          }}
          onClick={() => {
            if (pickupAddress && dropoffAddress) {
              alert(`Pickup: ${pickupAddress}\n\nDrop-off: ${dropoffAddress}`);
            }
          }}
        >
          ✅ Confirm Locations
        </button>
      </div>
    </div>
  );
}

export default MapTest;