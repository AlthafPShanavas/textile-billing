import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import { staffAPI } from '../api';
import { Card } from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Input } from './ui/Field';
import EmptyState from './ui/EmptyState';
import { PageLoader } from './ui/Spinner';
import { useToast, useConfirm } from './ui/Feedback';
import { formatCurrency, formatDate } from '../utils/format';

const emptyForm = { name: '', email: '', phone: '', position: '', salary: '', joining_date: '' };

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await staffAPI.getAll();
      setStaffList(response.data);
    } catch (error) {
      toast('Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (staff) => {
    setEditingId(staff.id);
    setForm({
      name: staff.name,
      email: staff.email || '',
      phone: staff.phone || '',
      position: staff.position || '',
      salary: staff.salary || '',
      joining_date: staff.joining_date ? staff.joining_date.split('T')[0] : '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast('Name is required', 'error');
    setSaving(true);
    try {
      if (editingId) {
        await staffAPI.update(editingId, form);
        toast('Staff member updated', 'success');
      } else {
        await staffAPI.create(form);
        toast('Staff member added', 'success');
      }
      setModalOpen(false);
      fetchStaff();
    } catch (error) {
      toast(error.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staff) => {
    const ok = await confirm({ title: `Remove ${staff.name}?`, message: 'This cannot be undone.', danger: true });
    if (!ok) return;
    try {
      await staffAPI.delete(staff.id);
      toast('Staff member removed', 'success');
      fetchStaff();
    } catch (error) {
      toast('Failed to remove staff member', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Staff</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your team.</p>
        </div>
        <Button onClick={openCreate}>
          <FiPlus /> Add Staff
        </Button>
      </div>

      <Card>
        {loading ? (
          <PageLoader />
        ) : staffList.length === 0 ? (
          <EmptyState icon={FiUsers} title="No staff members yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Position</th>
                  <th className="px-5 py-3">Salary</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{staff.name}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <div>{staff.email}</div>
                      <div className="text-xs text-slate-400">{staff.phone}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{staff.position || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{formatCurrency(staff.salary)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(staff.joining_date)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(staff)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                          <FiEdit2 />
                        </button>
                        <button onClick={() => handleDelete(staff)} className="rounded p-1.5 text-red-500 hover:bg-red-50">
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
        title={editingId ? 'Edit Staff Member' : 'Add Staff Member'}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <Input label="Salary" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          <Input
            label="Joining Date"
            type="date"
            value={form.joining_date}
            onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Staff;
