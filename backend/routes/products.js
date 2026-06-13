const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Add new product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { product_name, product_code, category, price, description } = req.body;

    const result = await pool.query(
      'INSERT INTO products (product_name, product_code, category, price, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [product_name, product_code, category, price, description]
    );

    res.status(201).json({ message: 'Product added', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (product_name ILIKE $' + (params.length + 1) + ' OR product_code ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }

    if (category) {
      query += ' AND category = $' + (params.length + 1);
      params.push(category);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { product_name, product_code, category, price, description } = req.body;
    const result = await pool.query(
      'UPDATE products SET product_name = $1, product_code = $2, category = $3, price = $4, description = $5 WHERE id = $6 RETURNING *',
      [product_name, product_code, category, price, description, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
