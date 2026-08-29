import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FiLogOut,
  FiHome,
  FiShoppingCart,
  FiBox,
  FiPackage,
  FiUsers,
  FiUserCheck,
  FiBarChart2,
  FiMenu,
  FiSettings,
  FiX,
} from 'react-icons/fi';
import { useAuth } from './Auth';
import { useSettings } from '../context/SettingsContext';

const navItems = [
  { to: 'home', label: 'Home', icon: FiHome },
  { to: 'billing', label: 'Billing', icon: FiShoppingCart },
  { to: 'products', label: 'Products', icon: FiPackage, managerOnly: true },
  { to: 'stock', label: 'Stock', icon: FiBox, managerOnly: true },
  { to: 'customers', label: 'Customers', icon: FiUserCheck, managerOnly: true },
  { to: 'staff', label: 'Staff', icon: FiUsers, managerOnly: true },
  { to: 'reports', label: 'Reports', icon: FiBarChart2, managerOnly: true },
  { to: 'settings', label: 'Settings', icon: FiSettings, superAdminOnly: true },
];

const AppShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) => {
    if (item.superAdminOnly) return user?.role === 'superadmin';
    if (item.managerOnly) return user?.role && user.role !== 'staff';
    return true;
  });

  const NavLinks = ({ onNavigate }) => (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {visibleItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Icon className="text-lg" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white py-6 lg:flex">
        <div className="mb-6 flex items-center gap-3 px-5">
          {settings?.logo_path ? (
            <img src={settings.logo_path} alt="logo" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
              T
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{settings?.shop_name || 'Textile Billing'}</p>
            <p className="text-xs text-slate-400">Billing Software</p>
          </div>
        </div>
        <NavLinks />
        <div className="mt-auto border-t border-slate-100 px-5 pt-4">
          <p className="truncate text-sm font-medium text-slate-700">{user?.username}</p>
          <p className="text-xs capitalize text-slate-400">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white py-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-5">
              <p className="text-sm font-semibold text-slate-900">{settings?.shop_name || 'Textile Billing'}</p>
              <button onClick={() => setMobileOpen(false)} className="text-slate-500">
                <FiX />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto border-t border-slate-100 px-5 pt-4">
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-red-600">
                <FiLogOut /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-xl text-slate-600">
            <FiMenu />
          </button>
          <p className="text-sm font-semibold text-slate-900">{settings?.shop_name || 'Textile Billing'}</p>
          <div className="w-5" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
