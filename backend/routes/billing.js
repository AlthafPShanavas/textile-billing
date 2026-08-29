const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { generateInvoicePdfBuffer } = require('../utils/invoicePdf');
const router = express.Router();

async function fetchOrderWithItems(id) {
  const orderResult = await pool.query(
    `SELECT o.*, u.username, c.name as customer_name, c.phone as customer_phone
     FROM orders o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN customers c ON o.customer_id = c.id
     WHERE o.id = $1`,
    [id]
  );
  if (orderResult.rows.length === 0) return null;
  const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
  return { order: orderResult.rows[0], items: itemsResult.rows };
}

async function resolveCustomer(client, { customer_id, customer }) {
  if (customer_id) return customer_id;
  if (!customer || (!customer.phone && !customer.name)) return null;

  if (customer.phone) {
    const existing = await client.query('SELECT id FROM customers WHERE phone = $1 LIMIT 1', [customer.phone]);
    if (existing.rows.length > 0) return existing.rows[0].id;
  }

  const inserted = await client.query(
    'INSERT INTO customers (name, phone, email, address) VALUES ($1, $2, $3, $4) RETURNING id',
    [customer.name || 'Walk-in Customer', customer.phone || null, customer.email || null, customer.address || null]
  );
  return inserted.rows[0].id;
}

// Create billing order (transactional: validates + decrements stock per variant)
router.post('/create', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, discount_amount, discount_percentage, payment_method, notes, customer_id, customer, tax_rate } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    await client.query('BEGIN');

    // Lock and validate stock for catalog items (skip manual/off-catalog items with no variant_id)
    for (const item of items) {
      if (!item.variant_id) continue;
      const stockRow = await client.query('SELECT quantity FROM stock WHERE variant_id = $1 FOR UPDATE', [item.variant_id]);
      const available = stockRow.rows[0]?.quantity ?? 0;
      if (available < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Insufficient stock for ${item.product_name || 'item'} (available: ${available})` });
      }
    }

    const settingsResult = await client.query('SELECT gst_rate, invoice_prefix FROM settings ORDER BY id LIMIT 1');
    const settings = settingsResult.rows[0] || { gst_rate: 0, invoice_prefix: 'INV' };
    const effectiveTaxRate = tax_rate !== undefined && tax_rate !== null ? Number(tax_rate) : Number(settings.gst_rate || 0);

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = discount_amount || 0;
    if (discount_percentage) {
      discountAmount = (subtotal * discount_percentage) / 100;
    }
    const taxableValue = subtotal - discountAmount;
    const taxAmount = (taxableValue * effectiveTaxRate) / 100;
    const total = taxableValue + taxAmount;

    const resolvedCustomerId = await resolveCustomer(client, { customer_id, customer });

    const seqResult = await client.query("SELECT nextval('invoice_number_seq') as n");
    const invoiceNumber = `${settings.invoice_prefix || 'INV'}-${String(seqResult.rows[0].n).padStart(5, '0')}`;

    const orderResult = await client.query(
      `INSERT INTO orders (invoice_number, user_id, customer_id, subtotal, discount_amount, discount_percentage, tax_rate, tax_amount, total, payment_method, notes, order_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
      [invoiceNumber, req.userId, resolvedCustomerId, subtotal, discountAmount, discount_percentage || 0, effectiveTaxRate, taxAmount, total, payment_method, notes]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, variant_id, product_name, size, color, quantity, price) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [order.id, item.variant_id || null, item.product_name, item.size || null, item.color || null, item.quantity, item.price]
      );

      if (item.variant_id) {
        await client.query('UPDATE stock SET quantity = quantity - $1, last_updated = NOW() WHERE variant_id = $2', [
          item.quantity,
          item.variant_id,
        ]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Order created successfully', order, orderId: order.id, invoiceNumber });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

// Get all orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.username, c.name as customer_name, c.phone as customer_phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN customers c ON o.customer_id = c.id
       ORDER BY o.order_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order by ID with items
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await fetchOrderWithItems(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download a printable PDF invoice for an order
router.get('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const result = await fetchOrderWithItems(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const settingsResult = await pool.query('SELECT * FROM settings ORDER BY id LIMIT 1');
    const buffer = await generateInvoicePdfBuffer({ settings: settingsResult.rows[0], ...result });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${result.order.invoice_number}.pdf"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
module.exports.fetchOrderWithItems = fetchOrderWithItems;
