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
          (error) => {
            console.log('Watch error:', error);
            // Continue with last known location
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
        );
      },
      (error) => {
        console.log('❌ GPS FAILED:', error.code, error.message);
        // Use fallback location (Casablanca)
        this.updateLocation(33.5731, -7.5898);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
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
    console.log('📤 Live location update:', latitude, longitude);
    
    // Only emit to socket for live tracking, don't update database
    if (window.driverSocket) {
      const locationData = {
        driverId: this.userId,
        location: { latitude, longitude },
        timestamp: Date.now(),
        requestId: window.activeRequestId // Set by DriverLocationSharer
      };
      window.driverSocket.emit('driver-location', locationData);
      window.driverSocket.emit('cache-driver-location', locationData);
      console.log('✅ Live location broadcasted');
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
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    });
  }


}

export default LocationTracker;