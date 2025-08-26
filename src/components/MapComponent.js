import React, { useEffect, useRef, useState } from 'react';

const MapComponent = ({ drivers = [], pickupLocation, deliveryLocation, driverLocation }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  useEffect(() => {
    if (map) {
      updateMarkers();
    }
  }, [drivers, pickupLocation, deliveryLocation, driverLocation, map]);

  const initMap = () => {
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: 33.5731, lng: -7.5898 }, // Casablanca
      zoom: 13,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });
    setMap(mapInstance);
  };

  const updateMarkers = () => {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    if (!map) return;

    // Add driver markers
    drivers.forEach(driver => {
      if (driver.location?.latitude && driver.location?.longitude) {
        const marker = new window.google.maps.Marker({
          position: { lat: driver.location.latitude, lng: driver.location.longitude },
          map: map,
          title: driver.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#4CAF50" stroke="white" stroke-width="2"/>
                <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🚗</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 40)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <h4>${driver.name}</h4>
              <p>⭐ ${driver.rating?.toFixed(1) || '5.0'}</p>
              <p>${driver.isOnline ? '🟢 Online' : '🔴 Offline'}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
      }
    });

    // Add pickup location marker
    if (pickupLocation?.latitude && pickupLocation?.longitude) {
      const pickupMarker = new window.google.maps.Marker({
        position: { lat: pickupLocation.latitude, lng: pickupLocation.longitude },
        map: map,
        title: 'Pickup Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="12" fill="#4CAF50" stroke="white" stroke-width="2"/>
              <circle cx="15" cy="15" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(30, 30)
        }
      });
      newMarkers.push(pickupMarker);
    }

    // Add delivery location marker
    if (deliveryLocation?.latitude && deliveryLocation?.longitude) {
      const deliveryMarker = new window.google.maps.Marker({
        position: { lat: deliveryLocation.latitude, lng: deliveryLocation.longitude },
        map: map,
        title: 'Delivery Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="12" fill="#333" stroke="white" stroke-width="2"/>
              <circle cx="15" cy="15" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(30, 30)
        }
      });
      newMarkers.push(deliveryMarker);
    }

    // Add active driver location (for tracking)
    if (driverLocation?.latitude && driverLocation?.longitude) {
      const activeDriverMarker = new window.google.maps.Marker({
        position: { lat: driverLocation.latitude, lng: driverLocation.longitude },
        map: map,
        title: 'Your Driver',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25" cy="25" r="22" fill="#FF5722" stroke="white" stroke-width="3"/>
              <text x="25" y="32" text-anchor="middle" fill="white" font-size="20" font-weight="bold">🚗</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(50, 50)
        }
      });
      newMarkers.push(activeDriverMarker);
    }

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      map.fitBounds(bounds);
    }
  };

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '300px', 
        borderRadius: '15px',
        border: '2px solid #e0e0e0'
      }} 
    />
  );
};

export default MapComponent;