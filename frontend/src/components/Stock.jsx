import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiBox, FiSearch, FiSave } from 'react-icons/fi';
import { stockAPI } from '../api';
import { Card } from './ui/Card';
import Badge from './ui/Badge';
import { Input } from './ui/Field';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import { PageLoader } from './ui/Spinner';
import { useToast } from './ui/Feedback';
import { formatCurrency, formatDate } from '../utils/format';

const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState({}); // variant_id -> new quantity
  const [savingId, setSavingId] = useState(null);
  const [receiveMode, setReceiveMode] = useState(false);
  const searchInputRef = useRef();
  const qtyInputRefs = useRef({});
  const toast = useToast();

  useEffect(() => {
    fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await stockAPI.getAll();
      setStocks(res.data);
    } catch (e) {
      toast('Failed to load stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? stocks.filter(
          (s) =>
            s.product_name.toLowerCase().includes(term) ||
            s.product_code.toLowerCase().includes(term) ||
            s.sku.toLowerCase().includes(term)
        )
      : stocks;

    const map = new Map();
    filtered.forEach((s) => {
      if (!map.has(s.product_id)) map.set(s.product_id, { product_name: s.product_name, product_code: s.product_code, category: s.category, rows: [] });
      map.get(s.product_id).rows.push(s);
    });
    return Array.from(map.values());
  }, [stocks, search]);

  // Once a scan (or typed search) narrows the list to exactly one variant, focus its quantity
  // field so a person can immediately type the new count — no clicking required.
  useEffect(() => {
    const totalRows = grouped.reduce((sum, g) => sum + g.rows.length, 0);
    if (!receiveMode && search.trim() && totalRows === 1) {
      const variantId = grouped[0].rows[0].variant_id;
      const el = qtyInputRefs.current[variantId];
      el?.focus();
      el?.select();
    }
  }, [grouped, search, receiveMode]);

  // A barcode scanner "types" the code then sends Enter. In Receive Mode, scanning a variant's
  // barcode adds 1 unit immediately — handy for counting garments in as a delivery arrives.
  const handleSearchKeyDown = async (e) => {
    if (e.key !== 'Enter' || !receiveMode) return;
    e.preventDefault();
    const term = search.trim().toLowerCase();
    if (!term) return;
    const match = stocks.find((s) => s.sku.toLowerCase() === term);
    if (!match) {
      toast('No product found for that code', 'error');
      return;
    }
    try {
      const res = await stockAPI.adjust({ variant_id: match.variant_id, quantity: 1 });
      toast(`${match.product_name} (${match.sku}) +1 → now ${res.data.stock.quantity}`, 'success');
      setSearch('');
      fetchStocks();
    } catch (err) {
      toast('Failed to update stock', 'error');
    }
  };

  const handleSave = async (variantId) => {
    const value = edits[variantId];
    if (value === undefined || value === '') return;
    setSavingId(variantId);
    try {
      await stockAPI.set(variantId, { quantity: parseInt(value, 10) || 0 });
      toast('Stock updated', 'success');
      setEdits((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      fetchStocks();
    } catch (e) {
      toast('Failed to update stock', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Stock</h1>
        <p className="mt-1 text-sm text-slate-500">Quantities are tracked per size/color variant.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={receiveMode ? 'Scan a barcode to add 1 unit...' : 'Search products, or scan a barcode...'}
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={receiveMode}
            onChange={(e) => {
              setReceiveMode(e.target.checked);
              setSearch('');
              searchInputRef.current?.focus();
            }}
          />
          Receive Mode (scan to add +1 stock)
        </label>
      </div>

      {loading ? (
        <PageLoader />
      ) : grouped.length === 0 ? (
        <Card>
          <EmptyState icon={FiBox} title="No stock records" message="Add products first to start tracking stock." />
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <Card key={group.product_code}>
              <div className="border-b border-slate-100 px-5 py-3">
                <p className="font-medium text-slate-800">{group.product_name}</p>
                <p className="text-xs text-slate-400">{group.product_code} · {group.category || 'Uncategorized'}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-5 py-2">Variant</th>
                      <th className="px-5 py-2">Price</th>
                      <th className="px-5 py-2">Quantity</th>
                      <th className="px-5 py-2">Last updated</th>
                      <th className="px-5 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {group.rows.map((row) => (
                      <tr key={row.variant_id}>
                        <td className="px-5 py-2.5">
                          {[row.size, row.color].filter(Boolean).join(' / ') || 'Default'}
                          <span className="ml-2 text-xs text-slate-400">{row.sku}</span>
                        </td>
                        <td className="px-5 py-2.5 text-slate-600">{formatCurrency(row.price)}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <input
                              ref={(el) => (qtyInputRefs.current[row.variant_id] = el)}
                              type="number"
                              min="0"
                              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                              value={edits[row.variant_id] ?? row.quantity}
                              onChange={(e) => setEdits((prev) => ({ ...prev, [row.variant_id]: e.target.value }))}
                            />
                            {row.low_stock && <Badge tone="red">Low</Badge>}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-slate-500">{formatDate(row.last_updated)}</td>
                        <td className="px-5 py-2.5 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={edits[row.variant_id] === undefined}
                            loading={savingId === row.variant_id}
                            onClick={() => handleSave(row.variant_id)}
                          >
                            <FiSave /> Save
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stock;
