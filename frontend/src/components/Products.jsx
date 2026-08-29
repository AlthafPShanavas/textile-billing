import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiSearch, FiX } from 'react-icons/fi';
import { productAPI } from '../api';
import { Card } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Modal from './ui/Modal';
import { Input, Textarea } from './ui/Field';
import EmptyState from './ui/EmptyState';
import { PageLoader } from './ui/Spinner';
import { useToast, useConfirm } from './ui/Feedback';
import { formatCurrency } from '../utils/format';

const emptyProduct = { name: '', code: '', category: '', description: '', price: '', gst_rate: '' };
const emptyVariant = { size: '', color: '', sku: '', quantity: 0 };

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // full product with variants, or null for "new"
  const [form, setForm] = useState(emptyProduct);
  const [variants, setVariants] = useState([{ ...emptyVariant }]);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async (searchTerm) => {
    setLoading(true);
    try {
      const res = await productAPI.getAll(searchTerm ? { search: searchTerm } : {});
      setProducts(res.data);
    } catch (e) {
      toast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    fetchProducts(value);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setVariants([{ ...emptyVariant }]);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = async (product) => {
    try {
      const res = await productAPI.getById(product.id);
      setEditing(res.data);
      setForm({
        name: res.data.name,
        code: res.data.code,
        category: res.data.category || '',
        description: res.data.description || '',
        price: res.data.price,
        gst_rate: res.data.gst_rate ?? '',
      });
      setImageFile(null);
      setModalOpen(true);
    } catch (e) {
      toast('Failed to load product', 'error');
    }
  };

  const updateVariantRow = (index, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addVariantRow = () => setVariants((prev) => [...prev, { ...emptyVariant }]);
  const removeVariantRow = (index) => setVariants((prev) => prev.filter((_, i) => i !== index));

  const handleSaveProduct = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.price) {
      toast('Name, code and price are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        await productAPI.update(editing.id, fd);
        toast('Product updated', 'success');
      } else {
        const validVariants = variants.filter((v) => v.sku.trim());
        fd.append('variants', JSON.stringify(validVariants));
        await productAPI.create(fd);
        toast('Product created', 'success');
      }
      setModalOpen(false);
      fetchProducts(search);
    } catch (e) {
      toast(e.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariantToExisting = async () => {
    const last = variants[variants.length - 1];
    if (!last?.sku?.trim()) {
      toast('Enter a SKU for the new variant', 'error');
      return;
    }
    try {
      await productAPI.addVariant(editing.id, last);
      toast('Variant added', 'success');
      const res = await productAPI.getById(editing.id);
      setEditing(res.data);
      setVariants([{ ...emptyVariant }]);
      fetchProducts(search);
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to add variant', 'error');
    }
  };

  const handleDeleteVariant = async (variantId) => {
    const ok = await confirm({ title: 'Delete variant?', message: 'This removes the size/color option and its stock.', danger: true });
    if (!ok) return;
    try {
      await productAPI.deleteVariant(variantId);
      const res = await productAPI.getById(editing.id);
      setEditing(res.data);
      fetchProducts(search);
      toast('Variant deleted', 'success');
    } catch (e) {
      toast('Failed to delete variant', 'error');
    }
  };

  const handleDeleteProduct = async (product) => {
    const ok = await confirm({
      title: `Delete "${product.name}"?`,
      message: 'This permanently removes the product, its variants and stock records.',
      danger: true,
    });
    if (!ok) return;
    try {
      await productAPI.delete(product.id);
      toast('Product deleted', 'success');
      fetchProducts(search);
    } catch (e) {
      toast('Failed to delete product', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your catalog, sizes, colors and pricing.</p>
        </div>
        <Button onClick={openCreate}>
          <FiPlus /> Add Product
        </Button>
      </div>

      <div className="relative max-w-sm">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, code or SKU..."
          className="pl-9"
        />
      </div>

      <Card>
        {loading ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <EmptyState icon={FiPackage} title="No products yet" message="Add your first product to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Variants</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <FiPackage />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{p.category || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{formatCurrency(p.price)}</td>
                    <td className="px-5 py-3 text-slate-600">{p.variants.length}</td>
                    <td className="px-5 py-3">
                      <Badge tone={p.total_stock === 0 ? 'red' : 'green'}>{p.total_stock} units</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50"
                        >
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
        title={editing ? `Edit ${editing.name}` : 'Add Product'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} loading={saving}>
              {editing ? 'Save changes' : 'Create product'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input
              label="Base Price (₹)"
              type="number"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              label="GST Rate (%) — optional override"
              type="number"
              value={form.gst_rate}
              onChange={(e) => setForm({ ...form, gst_rate: e.target.value })}
            />
            <Input label="Image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
          </div>
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">
              {editing ? 'Existing variants' : 'Size / Color variants'}
            </p>

            {editing && (
              <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                {editing.variants.map((v) => (
                  <li key={v.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>
                      {[v.size, v.color].filter(Boolean).join(' / ') || 'Default'} — <span className="text-slate-400">{v.sku}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <Badge tone={v.quantity < 10 ? 'red' : 'slate'}>{v.quantity} in stock</Badge>
                      <button onClick={() => handleDeleteVariant(v.id)} className="text-red-500 hover:text-red-700">
                        <FiX />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {(editing ? [variants[variants.length - 1]] : variants).map((v, idx) => {
              const realIndex = editing ? variants.length - 1 : idx;
              return (
                <div key={realIndex} className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <Input placeholder="Size (e.g. M)" value={v.size} onChange={(e) => updateVariantRow(realIndex, 'size', e.target.value)} />
                  <Input placeholder="Color" value={v.color} onChange={(e) => updateVariantRow(realIndex, 'color', e.target.value)} />
                  <Input placeholder="SKU" value={v.sku} onChange={(e) => updateVariantRow(realIndex, 'sku', e.target.value)} />
                  <Input
                    placeholder="Qty"
                    type="number"
                    value={v.quantity}
                    onChange={(e) => updateVariantRow(realIndex, 'quantity', e.target.value)}
                  />
                  {!editing && variants.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeVariantRow(realIndex)}>
                      <FiX /> Remove
                    </Button>
                  )}
                </div>
              );
            })}

            {editing ? (
              <Button variant="secondary" size="sm" onClick={handleAddVariantToExisting}>
                <FiPlus /> Add this variant
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={addVariantRow}>
                <FiPlus /> Add another variant
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Products;
