import React, { useState, useEffect, useRef } from 'react';
import { getUserCity } from '../utils/cityDetector';

const LocationSelector = ({ onLocationSelect, pickupLocation, deliveryLocation, mode = 'pickup' }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [userCity, setUserCity] = useState(null);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    const city = await getUserCity();
    setUserCity(city);
    initMap(city.center);
    autoGetLocation();
  };

  const autoGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        };
        onLocationSelect(mode, location);
      },
      () => {
        // If GPS fails, use user's detected city
        const cityCenter = userCity?.center || [31.6295, -7.9811];
        const defaultLocation = {
          latitude: cityCenter[0],
          longitude: cityCenter[1],
          address: `${userCity?.name || 'Marrakech'}, Morocco`
        };
        onLocationSelect(mode, defaultLocation);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    if (map && (pickupLocation || deliveryLocation)) {
      updateMarker(pickupLocation || deliveryLocation);
    }
  }, [map, pickupLocation, deliveryLocation]);

  const initMap = (center = [31.6295, -7.9811]) => {
    if (!mapRef.current || !window.L || map) return;
    
    const leafletMap = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(center, 14);
    
    window.L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
      attribution: '',
      maxZoom: 20
    }).addTo(leafletMap);
    
    // Clean map styling
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-container {
        background: #f8f9fa !important;

      }
      .leaflet-tile {

      }
      .leaflet-control-attribution {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    leafletMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(mode, {
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });
    });
    
    setMap(leafletMap);
  };

  const updateMarker = (location) => {
    if (!map || !location?.latitude) return;
    
    if (marker) {
      map.removeLayer(marker);
    }
    
    const icon = mode === 'home' ? '🏠' : '📍';
    const newMarker = window.L.marker([location.latitude, location.longitude], {
      icon: window.L.divIcon({
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: ${mode === 'home' ? '#4CAF50' : '#FF6B35'};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          ">${icon}</div>
        `,
        className: 'location-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })
    }).addTo(map);
    
    setMarker(newMarker);
    map.setView([location.latitude, location.longitude], 16);
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
        justifyContent: 'center',
        marginBottom: '20px',
        padding: '15px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '15px',
        color: 'white'
      }}>
        <div style={{ fontSize: '24px', marginRight: '10px' }}>
          {mode === 'home' ? '🏠' : '📍'}
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {mode === 'home' ? 'Set Your Home' : 'Set Delivery Location'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Tap on map or use GPS for precise location
          </div>
        </div>
      </div>
      
      <div style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div 
          ref={mapRef}
          style={{ 
            width: '100%', 
            height: '300px'
          }}
        />
        
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '25px',
          padding: '8px 15px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#333',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          📍 Tap to select
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;