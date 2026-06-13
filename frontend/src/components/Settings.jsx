import React, { useState, useEffect } from 'react';
import api from '../api';

const Settings = () => {
  const [shopName, setShopName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setCurrent(res.data);
      setShopName(res.data.shop_name || '');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!shopName.trim()) { alert('Shop name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('shop_name', shopName);
      if (logoFile) fd.append('logo', logoFile);
      const res = await api.post('/settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCurrent(res.data);
      // notify other components about updated settings
      try { window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: res.data })); } catch (err) {}
      alert('Saved');
    } catch (e) {
      console.error('Settings save error:', e.response || e.message || e);
      const serverMessage = e.response?.data?.message || e.response?.data || e.message || 'Save failed';
      alert(`Save failed: ${serverMessage}`);
    } finally { setSaving(false); }
  };

  return (
    <div style={{padding:20}}>
      <h2>Site Settings</h2>
      <div style={{maxWidth:700}}>
        <label style={{display:'block',marginBottom:6}}>Shop Name (required)</label>
        <input value={shopName} onChange={(e)=>setShopName(e.target.value)} style={{width:'100%',padding:8,marginBottom:12}} />

        <label style={{display:'block',marginBottom:6}}>Logo (PNG/JPG) - optional</label>
        <input type="file" accept="image/*" onChange={(e)=>setLogoFile(e.target.files[0])} />
        {current?.logo_path && (
          <div style={{marginTop:12}}>
            <img src={current.logo_path} alt="logo" style={{maxWidth:200,maxHeight:80}} />
          </div>
        )}

        <div style={{marginTop:16}}>
          <button onClick={handleSave} disabled={saving} style={{padding:'10px 14px'}}>{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
