import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiPrinter } from 'react-icons/fi';
import './Billing.css';

const EstimateBilling = () => {
  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState({ type: 'amount', value: 0 });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const searchInputRef = useRef();

  const addManualToCart = () => {
    const name = (manualName || '').trim();
    const price = parseFloat(manualPrice);
    const qty = parseInt(manualQty) || 1;
    if (!name) { alert('Enter product name'); return; }
    if (isNaN(price) || price < 0) { alert('Enter valid price'); return; }

    const manualItem = {
      product_id: `manual-${Date.now()}`,
      product_name: name,
      price: price,
      quantity: qty,
      manual: true,
    };

    setCartItems([...cartItems, manualItem]);
    setManualName('');
    setManualPrice('');
    setManualQty(1);
    searchInputRef.current?.focus();
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(cartItems.map(item =>
        item.product_id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const calculateSubtotal = () => cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discount.type === 'percentage') return (subtotal * discount.value) / 100;
    return discount.value;
  };
  const calculateTotal = () => calculateSubtotal() - calculateDiscount();

  const handlePrint = () => {
    const data = {
      orderId: 'EST-' + Date.now(),
      items: cartItems,
      subtotal: calculateSubtotal(),
      discountAmount: calculateDiscount(),
      total: calculateTotal(),
      paymentMethod,
      date: new Date().toLocaleString(),
    };

    const style = `body{font-family: Arial, Helvetica, sans-serif; color:#111;} .receipt{width:100%;max-width:560px;margin:0 auto;padding:8px} .receipt h2{margin:0 0 8px;font-size:16px;text-align:center} .receipt .meta{font-size:12px;margin-bottom:8px} .receipt .items{border-top:1px solid #ddd;padding-top:8px} .receipt .item{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px} .receipt .summary{border-top:1px solid #ddd;padding-top:8px;margin-top:8px;font-size:13px}`;

    const itemsHtml = (data.items || []).map(it => `<div class="item"><span>${it.product_name} × ${it.quantity}</span><span>₹${((it.price||0) * (it.quantity||1)).toFixed(2)}</span></div>`).join('');

    const shopTitle = siteSettings?.shop_name || 'Estimate';
    const logoHtml = siteSettings?.logo_path ? `<div style="text-align:center;margin-bottom:8px"><img src="${siteSettings.logo_path}" style="max-height:60px;" /></div>` : '';

    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Estimate ${data.orderId}</title><style>${style}</style></head><body><div class="receipt">${logoHtml}<h2>${shopTitle}</h2><div class="meta">Estimate: ${data.orderId} &nbsp;|&nbsp; ${data.date}</div><div class="items">${itemsHtml || '<div style="color:#666">No items</div>'}</div><div class="summary"><div style="display:flex;justify-content:space-between"><span>Subtotal:</span><span>₹${(data.subtotal||0).toFixed(2)}</span></div>${data.discountAmount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Discount:</span><span>-₹${(data.discountAmount||0).toFixed(2)}</span></div>` : ''}<div style="display:flex;justify-content:space-between;font-weight:700;margin-top:6px"><span>Total:</span><span>₹${(data.total||0).toFixed(2)}</span></div><div style="margin-top:6px">Payment: ${data.paymentMethod || 'N/A'}</div></div></div></body></html>`;

    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) { alert('Pop-up blocked. Please allow pop-ups for this site to print.'); return; }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); setTimeout(() => printWindow.close(), 500); }, 300);
  };

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscount();
  const total = calculateTotal();

  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/settings');
        setSiteSettings(res.data);
      } catch (e) { }
    })();
  }, []);

  return (
    <div className="billing-container">
      <div className="billing-layout">
        <div className="left-section">
          <div style={{padding:16}}>
            <div style={{marginBottom:8,fontWeight:700}}>Estimate Items (manual entry)</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input ref={searchInputRef} placeholder="Name" value={manualName} onChange={(e)=>setManualName(e.target.value)} style={{flex:1,padding:8}} />
              <input placeholder="Price" type="number" value={manualPrice} onChange={(e)=>setManualPrice(e.target.value)} style={{width:100,padding:8}} />
              <input placeholder="Qty" type="number" value={manualQty} onChange={(e)=>setManualQty(e.target.value)} style={{width:80,padding:8}} />
              <button onClick={addManualToCart} style={{padding:'8px 10px'}}>Add</button>
            </div>
          </div>
        </div>

        <div className="right-section">
          <div className="cart-section">
            <h3>Cart Items</h3>
            <div className="cart-items">
              {cartItems.length === 0 ? (
                <p className="empty-cart">No items in cart</p>
              ) : (
                cartItems.map(item => (
                  <div key={item.product_id} className="cart-item">
                    <div className="item-details">
                      <strong>{item.product_name}</strong>
                      <p>₹{item.price} × {item.quantity}</p>
                    </div>
                    <div className="item-controls">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))} className="qty-input" />
                      <button onClick={() => removeFromCart(item.product_id)} className="remove-btn"><FiX /></button>
                    </div>
                    <div className="item-total">₹{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="billing-summary">
              <div className="summary-row"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="discount-section"><label>Discount</label><div className="discount-controls"><select value={discount.type} onChange={(e)=>setDiscount({...discount,type:e.target.value})}><option value="amount">Amount (₹)</option><option value="percentage">Percentage (%)</option></select><input type="number" value={discount.value} onChange={(e)=>setDiscount({...discount,value:parseFloat(e.target.value)||0})} placeholder="Enter discount" /></div></div>
              {discountAmount>0 && <div className="summary-row discount"><span>Discount:</span><span>-₹{discountAmount.toFixed(2)}</span></div>}
              <div className="summary-row total"><span>Total:</span><span>₹{total.toFixed(2)}</span></div>
              <div className="payment-section"><label>Payment Method</label><div className="payment-options"><label><input type="radio" value="cash" checked={paymentMethod==='cash'} onChange={(e)=>setPaymentMethod(e.target.value)} /> Cash</label><label><input type="radio" value="card" checked={paymentMethod==='card'} onChange={(e)=>setPaymentMethod(e.target.value)} /> Card</label><label><input type="radio" value="gpay" checked={paymentMethod==='gpay'} onChange={(e)=>setPaymentMethod(e.target.value)} /> GPay</label></div></div>

              {(cartItems.length > 0 || receipt) && (<button className="print-btn" onClick={handlePrint} disabled={loading}><FiPrinter /> Print Estimate</button>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateBilling;
