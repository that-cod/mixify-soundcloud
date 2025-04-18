
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';

// Pages
import Home from '@/pages/Index'; // Changed from Home to Index
import Login from '@/pages/Login';
import Register from '@/pages/Signup'; // Changed from Register to Signup
import Mixer from '@/pages/Mixer';
import Dashboard from '@/pages/NotFound'; // Temporary using NotFound as Dashboard
import MultiTrackMixer from '@/pages/MultiTrackMixer';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/mixer" element={<Mixer />} />
          <Route path="/multi-track-mixer" element={<MultiTrackMixer />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
