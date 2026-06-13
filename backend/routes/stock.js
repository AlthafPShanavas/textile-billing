const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Add stock
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    const productCheck = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const result = await pool.query(
      'INSERT INTO stock (product_id, quantity) VALUES ($1, $2) ON CONFLICT (product_id) DO UPDATE SET quantity = stock.quantity + $2 RETURNING *',
      [product_id, quantity]
    );

    res.status(201).json({ message: 'Stock added', stock: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all stock
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT s.*, p.product_name, p.product_code, p.category, p.price FROM stock s JOIN products p ON s.product_id = p.id ORDER BY p.product_name'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock by product ID
router.get('/:productId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT s.*, p.product_name, p.product_code, p.price FROM stock s JOIN products p ON s.product_id = p.id WHERE s.product_id = $1',
      [req.params.productId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update stock quantity
router.put('/:productId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const result = await pool.query(
      'UPDATE stock SET quantity = $1 WHERE product_id = $2 RETURNING *',
      [quantity, req.params.productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.json({ message: 'Stock updated', stock: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
