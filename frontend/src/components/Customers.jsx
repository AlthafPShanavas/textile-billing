import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUserCheck, FiSearch, FiEye } from 'react-icons/fi';
import { customerAPI } from '../api';
import { Card } from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Input, Textarea } from './ui/Field';
import EmptyState from './ui/EmptyState';
import { PageLoader } from './ui/Spinner';
import { useToast, useConfirm } from './ui/Feedback';
import { formatCurrency, formatDate } from '../utils/format';

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = async (term) => {
    setLoading(true);
    try {
      const res = await customerAPI.getAll(term ? { search: term } : {});
      setCustomers(res.data);
    } catch (e) {
      toast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    fetchCustomers(value);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await customerAPI.update(editingId, form);
        toast('Customer updated', 'success');
      } else {
        await customerAPI.create(form);
        toast('Customer added', 'success');
      }
      setModalOpen(false);
      fetchCustomers(search);
    } catch (e) {
      toast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    const ok = await confirm({ title: `Delete ${c.name}?`, message: 'This does not delete their past orders.', danger: true });
    if (!ok) return;
    try {
      await customerAPI.delete(c.id);
      toast('Customer deleted', 'success');
      fetchCustomers(search);
    } catch (e) {
      toast('Failed to delete customer', 'error');
    }
  };

  const openHistory = async (c) => {
    try {
      const res = await customerAPI.getById(c.id);
      setHistory(res.data);
    } catch (e) {
      toast('Failed to load purchase history', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">Directory and purchase history.</p>
        </div>
        <Button onClick={openCreate}>
          <FiPlus /> Add Customer
        </Button>
      </div>

      <div className="relative max-w-sm">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by name or phone..." className="pl-9" />
      </div>

      <Card>
        {loading ? (
          <PageLoader />
        ) : customers.length === 0 ? (
          <EmptyState icon={FiUserCheck} title="No customers yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="px-5 py-3 text-slate-600">{c.phone || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{c.email || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openHistory(c)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                          <FiEye />
                        </button>
                        <button onClick={() => openEdit(c)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                          <FiEdit2 />
                        </button>
                        <button onClick={() => handleDelete(c)} className="rounded p-1.5 text-red-500 hover:bg-red-50">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Customer' : 'Add Customer'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Textarea label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </div>
      </Modal>

      <Modal open={!!history} onClose={() => setHistory(null)} title={history ? `${history.customer.name} — Purchase History` : ''}>
        {history && (
          history.orders.length === 0 ? (
            <EmptyState title="No purchases yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{o.invoice_number}</p>
                    <p className="text-xs text-slate-400">{formatDate(o.order_date)} · {o.payment_method}</p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatCurrency(o.total)}</span>
                </li>
              ))}
            </ul>
          )
        )}
      </Modal>
    </div>
  );
};

export default Customers;
