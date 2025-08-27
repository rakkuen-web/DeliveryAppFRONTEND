import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CustomerDashboard from './pages/CustomerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import CreateRequest from './pages/CreateRequest';
import TrackDelivery from './pages/TrackDelivery';
import Profile from './pages/Profile';
import CustomerMap from './pages/CustomerMap';
import LocationSetup from './pages/LocationSetup';
import MapTest from './pages/MapTest';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const loginTime = localStorage.getItem('loginTime');
    
    // Check if token is expired (1 hour = 3600000 ms)
    if (token && userData && loginTime) {
      const isExpired = Date.now() - parseInt(loginTime) > 3600000;
      
      if (isExpired) {
        // Clear expired session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
      } else {
        setUser(JSON.parse(userData));
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
          
          <Route path="/" element={
            user ? (
              !user.homeAddress ? 
                <Navigate to="/setup-location" /> :
                user.userType === 'customer' ? 
                  <CustomerDashboard user={user} /> : 
                  <DriverDashboard user={user} />
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/setup-location" element={
            user ? <LocationSetup user={user} setUser={setUser} /> : <Navigate to="/login" />
          } />
          
          <Route path="/create-request" element={
            user?.userType === 'customer' ? 
              <CreateRequest user={user} setUser={setUser} /> : 
              <Navigate to="/" />
          } />
          
          <Route path="/profile" element={
            user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />
          } />
          
          <Route path="/track/:requestId" element={
            user ? <TrackDelivery user={user} /> : <Navigate to="/login" />
          } />
          
          <Route path="/drivers-map" element={
            user?.userType === 'customer' ? 
              <CustomerMap user={user} /> : 
              <Navigate to="/" />
          } />
          
          <Route path="/map-test" element={<MapTest />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;