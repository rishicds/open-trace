import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import AppLayout from './components/AppLayout';
import Landing from './pages/Landing';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
