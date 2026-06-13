const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Create billing order
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { items, discount_amount, discount_percentage, payment_method, notes } = req.body;
    
    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    let discountAmount = discount_amount || 0;
    if (discount_percentage) {
      discountAmount = (subtotal * discount_percentage) / 100;
    }

    const total = subtotal - discountAmount;

    // Insert order
    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, subtotal, discount_amount, discount_percentage, total, payment_method, notes, order_date) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
      [req.userId, subtotal, discountAmount, discount_percentage || 0, total, payment_method, notes]
    );

    const orderId = orderResult.rows[0].id;

    // Insert order items and update stock
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );

      // Reduce stock
      await pool.query(
        'UPDATE stock SET quantity = quantity - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }

    res.status(201).json({ 
      message: 'Order created successfully', 
      order: orderResult.rows[0],
      orderId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.order_date DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order by ID with items
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const orderResult = await pool.query(
      'SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1',
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const itemsResult = await pool.query(
      'SELECT oi.*, p.product_name, p.product_code FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
      [req.params.id]
    );

    res.json({ order: orderResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
