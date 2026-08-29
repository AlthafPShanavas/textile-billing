import React, { useEffect, useState } from 'react';
import { settingsAPI } from '../api';
import { Card, CardBody, CardHeader } from './ui/Card';
import Button from './ui/Button';
import { Input } from './ui/Field';
import { useToast } from './ui/Feedback';
import { useSettings } from '../context/SettingsContext';

const emptyForm = {
  shop_name: '',
  shop_address: '',
  shop_phone: '',
  gstin: '',
  gst_rate: 0,
  invoice_prefix: 'INV',
  low_stock_threshold: 10,
};

const Settings = () => {
  const { settings, refresh } = useSettings();
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (settings) {
      setForm({
        shop_name: settings.shop_name || '',
        shop_address: settings.shop_address || '',
        shop_phone: settings.shop_phone || '',
        gstin: settings.gstin || '',
        gst_rate: settings.gst_rate ?? 0,
        invoice_prefix: settings.invoice_prefix || 'INV',
        low_stock_threshold: settings.low_stock_threshold ?? 10,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!form.shop_name.trim()) return toast('Shop name is required', 'error');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (logoFile) fd.append('logo', logoFile);
      await settingsAPI.update(fd);
      await refresh();
      toast('Settings saved', 'success');
      setLogoFile(null);
    } catch (e) {
      toast(e.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Shop identity, GST and invoicing.</p>
      </div>

      <Card>
        <CardHeader title="Shop details" />
        <CardBody className="space-y-4">
          <Input label="Shop Name" required value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} />
          <Input label="Address" value={form.shop_address} onChange={(e) => setForm({ ...form, shop_address: e.target.value })} />
          <Input label="Phone" value={form.shop_phone} onChange={(e) => setForm({ ...form, shop_phone: e.target.value })} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Logo</label>
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="text-sm" />
            {settings?.logo_path && (
              <img src={settings.logo_path} alt="logo" className="mt-3 h-16 rounded-lg border border-slate-200 object-contain" />
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="GST & Invoicing" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
          <Input
            label="Default GST Rate (%)"
            type="number"
            value={form.gst_rate}
            onChange={(e) => setForm({ ...form, gst_rate: e.target.value })}
          />
          <Input
            label="Invoice Prefix"
            value={form.invoice_prefix}
            onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
          />
          <Input
            label="Low Stock Threshold"
            type="number"
            value={form.low_stock_threshold}
            onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
          />
        </CardBody>
      </Card>

      <Button onClick={handleSave} loading={saving}>
        Save Settings
      </Button>
    </div>
  );
};

export default Settings;
