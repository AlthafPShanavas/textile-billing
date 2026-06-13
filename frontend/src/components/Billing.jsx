import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { productAPI, stockAPI, billingAPI } from '../api';
import { FiSearch, FiX, FiPrinter } from 'react-icons/fi';
import './Billing.css';

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState({ type: 'amount', value: 0 });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [estimateMode, setEstimateMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const searchInputRef = useRef();

  useEffect(() => {
    fetchProducts();
    (async () => {
      try {
        const res = await axios.get('/api/settings');
        setSiteSettings(res.data);
      } catch (e) {
        /* ignore */
      }
    })();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({});
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSearch = async (value) => {
    setSearchTerm(value);
    if (value.length > 0) {
      try {
        const response = await productAPI.getAll({ search: value });
        setProducts(response.data);
      } catch (error) {
        console.error('Error searching products:', error);
      }
    } else {
      fetchProducts();
    }
  };

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        product_name: product.product_name,
        price: product.price,
        quantity: 1
      }]);
    }
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

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

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100;
    }
    return discount.value;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handlePrint = () => {
    // Build printable data: prefer last receipt, otherwise use current cart
    const data = receipt || {
      orderId: lastOrderId || ('TEMP-' + Date.now()),
      items: cartItems,
      subtotal: calculateSubtotal(),
      discountAmount: calculateDiscount(),
      total: calculateTotal(),
      paymentMethod,
      date: new Date().toLocaleString(),
    };

    // Minimal printable HTML
    const style = `
      body{font-family: Arial, Helvetica, sans-serif; color:#111;}
      .receipt{width:100%;max-width:560px;margin:0 auto;padding:8px}
      .receipt h2{margin:0 0 8px;font-size:16px;text-align:center}
      .receipt .meta{font-size:12px;margin-bottom:8px}
      .receipt .items{border-top:1px solid #ddd;padding-top:8px}
      .receipt .item{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px}
      .receipt .summary{border-top:1px solid #ddd;padding-top:8px;margin-top:8px;font-size:13px}
    `;

    const itemsHtml = (data.items || []).map(it => `
      <div class="item"><span>${it.product_name || it.name || 'Item' } × ${it.quantity || 1}</span><span>₹${((it.price||0) * (it.quantity||1)).toFixed(2)}</span></div>
    `).join('');

    const shopTitle = siteSettings?.shop_name || 'Textile Billing Software';
    const logoHtml = siteSettings?.logo_path ? `<div style="text-align:center;margin-bottom:8px"><img src="${siteSettings.logo_path}" style="max-height:60px;" /></div>` : '';

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt ${data.orderId}</title>
          <style>${style}</style>
        </head>
        <body>
          <div class="receipt">
            ${logoHtml}
            <h2>${shopTitle}</h2>
            <div class="meta">Order: ${data.orderId} &nbsp;|&nbsp; ${data.date}</div>
            <div class="items">
              ${itemsHtml || '<div style="color:#666">No items</div>'}
            </div>
            <div class="summary">
              <div style="display:flex;justify-content:space-between"><span>Subtotal:</span><span>₹${(data.subtotal||0).toFixed(2)}</span></div>
              ${data.discountAmount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Discount:</span><span>-₹${(data.discountAmount||0).toFixed(2)}</span></div>` : ''}
              <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:6px"><span>Total:</span><span>₹${(data.total||0).toFixed(2)}</span></div>
              <div style="margin-top:6px">Payment: ${data.paymentMethod || 'N/A'}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Delay to ensure resources render before calling print
    setTimeout(() => {
      printWindow.print();
      // keep window open so user can inspect; close after short delay
      setTimeout(() => printWindow.close(), 500);
    }, 300);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('Please add items to cart');
      return;
    }

    setLoading(true);
    try {
      const response = await billingAPI.create({
        items: cartItems,
        discount_amount: discount.type === 'amount' ? discount.value : 0,
        discount_percentage: discount.type === 'percentage' ? discount.value : 0,
        payment_method: paymentMethod,
      });

      const receiptData = {
        orderId: response.data.orderId,
        items: cartItems,
        discountType: discount.type,
        discountValue: discount.value,
        discountAmount,
        paymentMethod,
        subtotal,
        total,
        date: new Date().toLocaleString(),
      };

      setReceipt(receiptData);
      setLastOrderId(response.data.orderId);
      setOrderPlaced(true);
      setCartItems([]);
      setDiscount({ type: 'amount', value: 0 });
      
      setTimeout(() => {
        setOrderPlaced(false);
      }, 5000);
    } catch (error) {
      alert('Error placing order: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscount();
  const total = calculateTotal();

  return (
    <div className="billing-container">
      <div className="billing-layout">
        <div className="left-section">
          <div className="search-section">
            <div className="search-box">
              <FiSearch />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, code, or product ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            {searchTerm && products.length > 0 && (
              <div className="search-results">
                {products.map(product => (
                  <div key={product.id} className="search-result-item" onClick={() => addToCart(product)}>
                    <div>
                      <strong>{product.product_name}</strong>
                      <p>{product.product_code} - ₹{product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {orderPlaced && (
            <div className="success-message">
              ✓ Order #{lastOrderId} placed successfully!
            </div>
          )}
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
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                        className="qty-input"
                      />
                      <button onClick={() => removeFromCart(item.product_id)} className="remove-btn">
                        <FiX />
                      </button>
                    </div>
                    <div className="item-total">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="billing-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="discount-section">
                <label>Discount</label>
                <div className="discount-controls">
                  <select value={discount.type} onChange={(e) => setDiscount({ ...discount, type: e.target.value })}>
                    <option value="amount">Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                  <input
                    type="number"
                    value={discount.value}
                    onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter discount"
                  />
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="summary-row discount">
                  <span>Discount:</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="summary-row total">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              <div className="payment-section">
                <label>Payment Method</label>
                <div className="payment-options">
                  <label>
                    <input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    Cash
                  </label>
                  <label>
                    <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    Card
                  </label>
                  <label>
                    <input type="radio" value="gpay" checked={paymentMethod === 'gpay'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    GPay
                  </label>
                </div>
              </div>

                <div style={{marginBottom:12}}>
                  <label style={{display:'inline-flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={estimateMode} onChange={(e) => setEstimateMode(e.target.checked)} /> Estimate Mode
                  </label>
                </div>

                {estimateMode && (
                  <div className="estimate-entry" style={{marginBottom:12}}>
                    <input placeholder="Name" value={manualName} onChange={(e) => setManualName(e.target.value)} style={{width:'60%',padding:8,marginRight:8}} />
                    <input placeholder="Price" type="number" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} style={{width:'20%',padding:8,marginRight:8}} />
                    <input placeholder="Qty" type="number" value={manualQty} onChange={(e) => setManualQty(e.target.value)} style={{width:'10%',padding:8,marginRight:8}} />
                    <button onClick={addManualToCart} style={{padding:'8px 10px'}}>Add</button>
                  </div>
                )}

                {(cartItems.length > 0 || receipt) && (
                  <button className="print-btn" onClick={handlePrint} disabled={loading}>
                    <FiPrinter /> {orderPlaced ? 'Print Receipt' : 'Print Bill'}
                  </button>
                )}

              <button className="place-order-btn" onClick={handlePlaceOrder} disabled={loading}>
                {loading ? 'Processing...' : '💰 Place Order'}
              </button>

              {receipt && (
                <div className="receipt-preview">
                  <h4>Receipt #{receipt.orderId}</h4>
                  <p><strong>Date:</strong> {receipt.date}</p>
                  <div className="receipt-items">
                    {receipt.items.map(item => (
                      <div key={item.product_id} className="receipt-item">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="receipt-summary">
                    <div><span>Subtotal:</span><span>₹{receipt.subtotal.toFixed(2)}</span></div>
                    {receipt.discountAmount > 0 && (
                      <div><span>Discount:</span><span>-₹{receipt.discountAmount.toFixed(2)}</span></div>
                    )}
                    <div><span>Total:</span><span>₹{receipt.total.toFixed(2)}</span></div>
                    <div><span>Payment:</span><span>{receipt.paymentMethod}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
