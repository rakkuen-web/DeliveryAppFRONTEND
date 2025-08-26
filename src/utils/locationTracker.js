import axios from 'axios';

import { API_URL } from '../config';

export class LocationTracker {
  constructor(userId) {
    this.userId = userId;
    this.watchId = null;
    this.isTracking = false;
  }

  startTracking() {
    this.isTracking = true;
    console.log('🚀 Starting GPS tracking...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ GPS WORKING:', position.coords.latitude, position.coords.longitude);
        this.updateLocation(position.coords.latitude, position.coords.longitude);
        
        this.watchId = navigator.geolocation.watchPosition(
          (pos) => {
            console.log('📍 GPS UPDATE:', pos.coords.latitude, pos.coords.longitude);
            this.updateLocation(pos.coords.latitude, pos.coords.longitude);
          },
          (error) => console.log('Watch error:', error),
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
        );
      },
      (error) => {
        console.log('❌ GPS FAILED:', error.code, error.message);
        alert(`GPS Error: ${error.message}. Code: ${error.code}`);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  }

  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    console.log('🛑 GPS tracking stopped');
  }

  async updateLocation(latitude, longitude) {
    console.log('📤 Updating location:', latitude, longitude);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/users/${this.userId}/location`, {
        latitude,
        longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Location updated successfully');
      
      if (window.driverSocket) {
        const locationData = {
          driverId: this.userId,
          location: { latitude, longitude },
          timestamp: Date.now()
        };
        window.driverSocket.emit('driver-location', locationData);
        window.driverSocket.emit('cache-driver-location', locationData);
      }
    } catch (error) {
      console.error('❌ Location update failed:', error.response?.data || error.message);
    }
  }

  async getCurrentLocation() {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('📍 Current location:', position.coords.latitude, position.coords.longitude);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('❌ getCurrentLocation failed:', error.message);
          resolve({ latitude: 33.5731, longitude: -7.5898 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }


}

export default LocationTracker;