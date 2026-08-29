import React, { useEffect, useRef, useState } from 'react';
import { FiSearch, FiX, FiPrinter, FiShoppingCart, FiMessageCircle, FiDownload } from 'react-icons/fi';
import api, { productAPI, billingAPI, whatsappAPI } from '../api';
import { Card, CardBody, CardHeader } from './ui/Card';
import Button from './ui/Button';
import { Input, Select } from './ui/Field';
import EmptyState from './ui/EmptyState';
import { useToast } from './ui/Feedback';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/format';
import { printHtml } from '../utils/printWindow';

const buildReceiptHtml = ({ settings, mode, invoiceNumber, date, items, subtotal, discountAmount, taxRate, taxAmount, total, paymentMethod, customer }) => {
  const style = `
    body{font-family: Arial, Helvetica, sans-serif; color:#111; margin:0;}
    .receipt{width:100%;max-width:560px;margin:0 auto;padding:16px}
    .receipt h2{margin:0 0 4px;font-size:18px;text-align:center}
    .receipt .addr{font-size:11px;text-align:center;color:#555;margin-bottom:8px}
    .receipt .meta{font-size:12px;margin-bottom:8px;display:flex;justify-content:space-between}
    .receipt table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
    .receipt th{text-align:left;border-bottom:1px solid #ddd;padding:4px 2px;font-size:11px;color:#555}
    .receipt td{padding:4px 2px;border-bottom:1px solid #f1f1f1}
    .receipt .summary{margin-top:10px;font-size:13px}
    .receipt .summary div{display:flex;justify-content:space-between;padding:2px 0}
    .receipt .total{font-weight:700;font-size:15px;border-top:1px solid #333;margin-top:4px;padding-top:6px}
    .receipt .footer{margin-top:16px;text-align:center;font-size:11px;color:#777}
  `;

  const itemsHtml = items
    .map(
      (it) => `<tr>
        <td>${it.product_name}${it.size || it.color ? ` <span style="color:#888">(${[it.size, it.color].filter(Boolean).join('/')})</span>` : ''}</td>
        <td style="text-align:center">${it.quantity}</td>
        <td style="text-align:right">${formatCurrency(it.price)}</td>
        <td style="text-align:right">${formatCurrency(it.price * it.quantity)}</td>
      </tr>`
    )
    .join('');

  const shopTitle = settings?.shop_name || 'Textile Billing Software';
  const logoHtml = settings?.logo_path ? `<div style="text-align:center;margin-bottom:6px"><img src="${settings.logo_path}" style="max-height:56px;" /></div>` : '';
  const addrHtml = [settings?.shop_address, settings?.shop_phone].filter(Boolean).join(' · ');
  const gstinHtml = settings?.gstin ? `<div class="addr">GSTIN: ${settings.gstin}</div>` : '';

  return `<!doctype html><html><head><meta charset="utf-8" /><title>${mode === 'estimate' ? 'Estimate' : 'Invoice'} ${invoiceNumber}</title><style>${style}</style></head>
  <body><div class="receipt">
    ${logoHtml}
    <h2>${shopTitle}</h2>
    ${addrHtml ? `<div class="addr">${addrHtml}</div>` : ''}
    ${gstinHtml}
    <div class="meta"><span>${mode === 'estimate' ? 'Estimate' : 'Invoice'}: ${invoiceNumber}</span><span>${date}</span></div>
    ${customer?.name ? `<div class="meta"><span>Customer: ${customer.name}</span><span>${customer.phone || ''}</span></div>` : ''}
    <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${itemsHtml}</tbody></table>
    <div class="summary">
      <div><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
      ${discountAmount > 0 ? `<div><span>Discount</span><span>-${formatCurrency(discountAmount)}</span></div>` : ''}
      ${taxAmount > 0 ? `<div><span>GST (${taxRate}%)</span><span>${formatCurrency(taxAmount)}</span></div>` : ''}
      <div class="total"><span>Total</span><span>${formatCurrency(total)}</span></div>
      <div style="margin-top:6px">Payment: ${paymentMethod || 'N/A'}</div>
    </div>
    <div class="footer">${mode === 'estimate' ? 'This is an estimate, not a tax invoice.' : 'Thank you for shopping with us!'}</div>
  </div></body></html>`;
};

const buildWhatsAppText = ({ settings, mode, invoiceNumber, items, total, pdfUrl }) => {
  const shopTitle = settings?.shop_name || 'Your Shop';
  const lines = [
    `*${shopTitle}*`,
    `${mode === 'estimate' ? 'Estimate' : 'Invoice'}: ${invoiceNumber}`,
    '',
    ...items.map((it) => `${it.product_name}${it.size || it.color ? ` (${[it.size, it.color].filter(Boolean).join('/')})` : ''} x${it.quantity} — ${formatCurrency(it.price * it.quantity)}`),
    '',
    `*Total: ${formatCurrency(total)}*`,
  ];
  if (pdfUrl) lines.push('', `View/download invoice: ${pdfUrl}`);
  lines.push('', 'Thank you for shopping with us!');
  return lines.join('\n');
};

const openWhatsApp = (phone, text) => {
  const digits = (phone || '').replace(/[^\d]/g, '');
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const Billing = () => {
  const [mode, setMode] = useState('sale'); // 'sale' | 'estimate'
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState({ type: 'amount', value: 0 });
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const searchInputRef = useRef();
  const toast = useToast();
  const { settings } = useSettings();

  useEffect(() => {
    if (settings?.gst_rate !== undefined) setTaxRate(Number(settings.gst_rate) || 0);
  }, [settings]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchTerm.trim()) {
        productAPI.getAll({ search: searchTerm }).then((res) => setProducts(res.data)).catch(() => {});
      } else {
        setProducts([]);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const addVariantToCart = (product, variant) => {
    if (mode === 'sale' && variant.quantity <= 0) {
      toast(`${product.name} (${[variant.size, variant.color].filter(Boolean).join('/')}) is out of stock`, 'error');
      return;
    }
    setCartItems((prev) => {
      const key = `v-${variant.id}`;
      const existing = prev.find((it) => it.key === key);
      if (existing) {
        return prev.map((it) => (it.key === key ? { ...it, quantity: it.quantity + 1 } : it));
      }
      return [
        ...prev,
        {
          key,
          variant_id: variant.id,
          product_name: product.name,
          size: variant.size,
          color: variant.color,
          price: Number(variant.price_override || product.price),
          quantity: 1,
          availableStock: variant.quantity,
        },
      ];
    });
    setSearchTerm('');
    setProducts([]);
    searchInputRef.current?.focus();
  };

  // A barcode scanner behaves like a keyboard: it "types" the code into whatever's focused,
  // then sends Enter. Here we bypass the debounced live-search and look for an exact SKU
  // match on Enter, so a scan adds straight to the cart instead of just filtering results.
  const handleSearchKeyDown = async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    try {
      const res = await productAPI.getAll({ search: term });
      let matched = null;
      for (const product of res.data) {
        const variant = product.variants.find((v) => v.sku.toLowerCase() === term.toLowerCase());
        if (variant) {
          matched = { product, variant };
          break;
        }
      }
      if (matched) {
        addVariantToCart(matched.product, matched.variant);
      } else {
        setProducts(res.data);
        if (res.data.length === 0) toast('No product found for that code', 'error');
      }
    } catch (err) {
      toast('Search failed', 'error');
    }
  };

  const addManualToCart = () => {
    const name = manualName.trim();
    const price = parseFloat(manualPrice);
    const qty = parseInt(manualQty, 10) || 1;
    if (!name) return toast('Enter product name', 'error');
    if (isNaN(price) || price < 0) return toast('Enter a valid price', 'error');

    setCartItems((prev) => [
      ...prev,
      { key: `manual-${Date.now()}`, variant_id: null, product_name: name, price, quantity: qty },
    ]);
    setManualName('');
    setManualPrice('');
    setManualQty(1);
  };

  const removeFromCart = (key) => setCartItems((prev) => prev.filter((it) => it.key !== key));

  const updateQuantity = (key, quantity) => {
    if (quantity <= 0) return removeFromCart(key);
    setCartItems((prev) => prev.map((it) => (it.key === key ? { ...it, quantity } : it)));
  };

  const subtotal = cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const discountAmount = discount.type === 'percentage' ? (subtotal * discount.value) / 100 : Number(discount.value) || 0;
  const taxableValue = Math.max(subtotal - discountAmount, 0);
  const taxAmount = (taxableValue * (Number(taxRate) || 0)) / 100;
  const total = taxableValue + taxAmount;

  const resetCart = () => {
    setCartItems([]);
    setDiscount({ type: 'amount', value: 0 });
    setCustomerName('');
    setCustomerPhone('');
  };

  const handlePrint = (receipt) => printHtml(buildReceiptHtml({ settings, ...receipt }));

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return toast('Add items to the cart first', 'error');

    if (mode === 'estimate') {
      const receipt = {
        mode: 'estimate',
        invoiceNumber: 'EST-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleString('en-IN'),
        items: cartItems,
        subtotal,
        discountAmount,
        taxRate,
        taxAmount,
        total,
        paymentMethod,
        customer: { name: customerName, phone: customerPhone },
      };
      setLastReceipt(receipt);
      handlePrint(receipt);
      return;
    }

    setLoading(true);
    try {
      const response = await billingAPI.create({
        items: cartItems,
        discount_amount: discount.type === 'amount' ? discount.value : 0,
        discount_percentage: discount.type === 'percentage' ? discount.value : 0,
        tax_rate: taxRate,
        payment_method: paymentMethod,
        customer: customerName || customerPhone ? { name: customerName || 'Walk-in Customer', phone: customerPhone } : undefined,
      });

      const receipt = {
        mode: 'sale',
        orderId: response.data.orderId,
        invoiceNumber: response.data.invoiceNumber,
        date: new Date().toLocaleString('en-IN'),
        items: cartItems,
        subtotal,
        discountAmount,
        taxRate,
        taxAmount,
        total,
        paymentMethod,
        customer: { name: customerName, phone: customerPhone },
      };
      setLastReceipt(receipt);
      toast(`Order ${response.data.invoiceNumber} placed successfully`, 'success');
      resetCart();
    } catch (error) {
      toast(error.response?.data?.message || 'Error placing order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async (receipt) => {
    const phone = receipt.customer?.phone;
    if (!phone) return toast('Enter a customer phone number first', 'error');

    if (receipt.mode === 'estimate' || !receipt.orderId) {
      openWhatsApp(phone, buildWhatsAppText(receipt));
      return;
    }

    setWhatsappLoading(true);
    try {
      const res = await whatsappAPI.sendInvoice({ orderId: receipt.orderId, phone });
      if (res.data.whatsappSent) {
        toast('Invoice sent via WhatsApp', 'success');
      } else {
        toast(res.data.message || 'Opening WhatsApp share link instead', 'info');
        openWhatsApp(phone, buildWhatsAppText({ ...receipt, pdfUrl: res.data.pdfUrl }));
      }
    } catch (error) {
      toast(error.response?.data?.message || 'Failed to send — opening WhatsApp share link instead', 'error');
      openWhatsApp(phone, buildWhatsAppText(receipt));
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleDownloadPdf = async (receipt) => {
    if (!receipt.orderId) return;
    setPdfLoading(true);
    try {
      const res = await api.get(`/billing/${receipt.orderId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch (error) {
      toast('Failed to generate PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
          <p className="mt-1 text-sm text-slate-500">Ring up a sale or prepare a customer estimate.</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          {['sale', 'estimate'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                mode === m ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardBody>
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search, or scan a barcode..."
                  className="pl-9"
                />
              </div>

              {products.length > 0 && (
                <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
                  {products.map((product) => (
                    <div key={product.id} className="rounded-lg border border-slate-100 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800">{product.name}</p>
                        <span className="text-sm text-slate-500">{formatCurrency(product.price)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => addVariantToCart(product, v)}
                            disabled={mode === 'sale' && v.quantity <= 0}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {[v.size, v.color].filter(Boolean).join(' / ') || 'Add'} · {v.quantity}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-brand-600">+ Add a custom / off-catalog item</summary>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Input placeholder="Name" value={manualName} onChange={(e) => setManualName(e.target.value)} className="col-span-2 sm:col-span-2" />
                  <Input placeholder="Price" type="number" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} />
                  <Input placeholder="Qty" type="number" value={manualQty} onChange={(e) => setManualQty(e.target.value)} />
                </div>
                <Button variant="secondary" size="sm" className="mt-2" onClick={addManualToCart}>
                  Add item
                </Button>
              </details>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Customer" subtitle="Optional — leave blank for a walk-in sale" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in Customer" />
              <Input label="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="98470xxxxx" />
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader title="Cart" />
            <CardBody className="p-0">
              {cartItems.length === 0 ? (
                <EmptyState icon={FiShoppingCart} title="Cart is empty" message="Search and add products above." />
              ) : (
                <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                  {cartItems.map((item) => (
                    <li key={item.key} className="flex items-center justify-between gap-2 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{item.product_name}</p>
                        <p className="text-xs text-slate-400">
                          {[item.size, item.color].filter(Boolean).join(' / ')} {formatCurrency(item.price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.key, parseInt(e.target.value, 10) || 0)}
                          className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                        />
                        <button onClick={() => removeFromCart(item.key)} className="text-slate-400 hover:text-red-500">
                          <FiX />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-3 border-t border-slate-100 px-5 py-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select value={discount.type} onChange={(e) => setDiscount({ ...discount, type: e.target.value })}>
                    <option value="amount">Discount ₹</option>
                    <option value="percentage">Discount %</option>
                  </Select>
                  <Input type="number" value={discount.value} onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })} />
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>GST %</span>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                  />
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax amount</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <Select label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="gpay">GPay / UPI</option>
                </Select>

                {lastReceipt && (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => handlePrint(lastReceipt)}>
                      <FiPrinter /> Reprint
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSendWhatsApp(lastReceipt)}
                      loading={whatsappLoading}
                    >
                      <FiMessageCircle /> WhatsApp
                    </Button>
                    {lastReceipt.orderId && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownloadPdf(lastReceipt)}
                        loading={pdfLoading}
                      >
                        <FiDownload /> PDF
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button className="flex-1" onClick={handlePlaceOrder} loading={loading}>
                    {mode === 'estimate' ? 'Print Estimate' : 'Place Order & Print'}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Billing;
