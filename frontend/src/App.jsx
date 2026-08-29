import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, Login, useAuth } from './components/Auth';
import { SettingsProvider } from './context/SettingsContext';
import { FeedbackProvider } from './components/ui/Feedback';
import AppShell from './components/AppShell';
import Home from './components/Home';
import Billing from './components/Billing';
import Products from './components/Products';
import Stock from './components/Stock';
import Customers from './components/Customers';
import Staff from './components/Staff';
import Reports from './components/Reports';
import Settings from './components/Settings';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  return token && user ? children : <Navigate to="/login" replace />;
};

const ManagerOnly = ({ children }) => {
  const { user } = useAuth();
  return user?.role && user.role !== 'staff' ? children : <Navigate to="/app/home" replace />;
};

const SuperAdminOnly = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'superadmin' ? children : <Navigate to="/app/home" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <FeedbackProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<Home />} />
                <Route path="billing" element={<Billing />} />
                <Route
                  path="products"
                  element={
                    <ManagerOnly>
                      <Products />
                    </ManagerOnly>
                  }
                />
                <Route
                  path="stock"
                  element={
                    <ManagerOnly>
                      <Stock />
                    </ManagerOnly>
                  }
                />
                <Route
                  path="customers"
                  element={
                    <ManagerOnly>
                      <Customers />
                    </ManagerOnly>
                  }
                />
                <Route
                  path="staff"
                  element={
                    <ManagerOnly>
                      <Staff />
                    </ManagerOnly>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ManagerOnly>
                      <Reports />
                    </ManagerOnly>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <SuperAdminOnly>
                      <Settings />
                    </SuperAdminOnly>
                  }
                />
              </Route>
              <Route path="/" element={<Navigate to="/app/home" replace />} />
              <Route path="*" element={<Navigate to="/app/home" replace />} />
            </Routes>
          </FeedbackProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
