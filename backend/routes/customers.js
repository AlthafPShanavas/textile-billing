const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// List / search customers (by name or phone)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length})`;
    }
    query += ' ORDER BY name LIMIT 50';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one customer + their purchase history
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const ordersResult = await pool.query(
      'SELECT id, invoice_number, total, payment_method, order_date FROM orders WHERE customer_id = $1 ORDER BY order_date DESC',
      [req.params.id]
    );
    res.json({ customer: customerResult.rows[0], orders: ordersResult.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create customer
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (name, phone, email, address, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone || null, email || null, address || null, notes || null]
    );
    res.status(201).json({ message: 'Customer added', customer: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update customer
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const result = await pool.query(
      'UPDATE customers SET name = $1, phone = $2, email = $3, address = $4, notes = $5 WHERE id = $6 RETURNING *',
      [name, phone || null, email || null, address || null, notes || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer updated', customer: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
