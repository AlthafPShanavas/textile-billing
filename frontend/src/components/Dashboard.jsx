import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Auth';
import Billing from './Billing';
import EstimateBilling from './EstimateBilling';
import Stock from './Stock';
import Staff from './Staff';
import Reports from './Reports';
import { FiLogOut, FiHome, FiShoppingCart, FiBox, FiUsers, FiBarChart2, FiMenu, FiSettings } from 'react-icons/fi';
import axios from 'axios';
import Settings from './Settings';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('billing');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [siteSettings, setSiteSettings] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/settings');
        setSiteSettings(res.data);
      } catch (e) { /* ignore */ }
    })();
    // listen for updates from Settings component
    const onSettingsUpdated = (e) => {
      if (e?.detail) setSiteSettings(e.detail);
    };
    window.addEventListener('settingsUpdated', onSettingsUpdated);
    return () => window.removeEventListener('settingsUpdated', onSettingsUpdated);
  }, []);

  // Redirect to login if user is not present (useEffect keeps hooks order stable)
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="dashboard">
      <nav className="navbar">
          <div className="navbar-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiMenu />
          </button>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {siteSettings?.logo_path ? (
              <img src={siteSettings.logo_path} alt="logo" style={{height:28}} />
            ) : null}
            <h1 style={{margin:0}}>{siteSettings?.shop_name || 'Textile Billing System'}</h1>
          </div>
          <div className="user-info">
            <span>{user.username} ({user.role})</span>
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <ul className="nav-menu">
            <li>
              <button
                className={activeTab === 'billing' ? 'active' : ''}
                onClick={() => setActiveTab('billing')}
              >
                <FiShoppingCart /> Billing
              </button>
            </li>
              <li>
                {user && (
                  <button
                    className={activeTab === 'estimate' ? 'active' : ''}
                    onClick={() => setActiveTab('estimate')}
                  >
                    <FiShoppingCart /> Estimate Billing
                  </button>
                )}
              </li>
            <li>
              {user?.role && user.role !== 'staff' && (
                <button
                  className={activeTab === 'stock' ? 'active' : ''}
                  onClick={() => setActiveTab('stock')}
                >
                  <FiBox /> Stock Management
                </button>
              )}
            </li>
            <li>
              {user?.role && user.role !== 'staff' && (
                <button
                  className={activeTab === 'staff' ? 'active' : ''}
                  onClick={() => setActiveTab('staff')}
                >
                  <FiUsers /> Staff Management
                </button>
              )}
            </li>
            <li>
              {user?.role && user.role !== 'staff' && (
                <button
                  className={activeTab === 'reports' ? 'active' : ''}
                  onClick={() => setActiveTab('reports')}
                >
                  <FiBarChart2 /> Reports
                </button>
              )}
            </li>
            <li>
              {user?.role === 'superadmin' && (
                <button
                  className={activeTab === 'settings' ? 'active' : ''}
                  onClick={() => setActiveTab('settings')}
                >
                  <FiSettings /> Settings
                </button>
              )}
            </li>
          </ul>
        </aside>

        <main className="main-content">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {siteSettings?.logo_path ? (
              <img src={siteSettings.logo_path} alt="logo" style={{height:36}} />
            ) : null}
            <h1 style={{margin:0}}>{siteSettings?.shop_name || 'Textile Billing System'}</h1>
          </div>
          {activeTab === 'billing' && <Billing />}
          {activeTab === 'estimate' && <EstimateBilling />}
          {activeTab === 'stock' && <Stock />}
          {activeTab === 'staff' && <Staff />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
