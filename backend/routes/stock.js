const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

async function lowStockThreshold() {
  const r = await pool.query('SELECT low_stock_threshold FROM settings ORDER BY id LIMIT 1');
  return r.rows[0]?.low_stock_threshold ?? 10;
}

// Get all stock (variant-level, joined with product info)
router.get('/', async (req, res) => {
  try {
    const threshold = await lowStockThreshold();
    const result = await pool.query(
      `SELECT s.id, s.variant_id, s.quantity, s.last_updated,
              v.sku, v.size, v.color, v.product_id,
              p.name as product_name, p.code as product_code, p.category,
              COALESCE(v.price_override, p.price) as price
       FROM stock s
       JOIN product_variants v ON s.variant_id = v.id
       JOIN products p ON v.product_id = p.id
       ORDER BY p.name, v.size, v.color`
    );
    const rows = result.rows.map((r) => ({ ...r, low_stock: r.quantity < threshold }));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock for a single variant
router.get('/:variantId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, v.sku, v.size, v.color, p.name as product_name, p.code as product_code
       FROM stock s
       JOIN product_variants v ON s.variant_id = v.id
       JOIN products p ON v.product_id = p.id
       WHERE s.variant_id = $1`,
      [req.params.variantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Adjust stock quantity (relative add/subtract) for a variant
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { variant_id, quantity } = req.body;
    const variantCheck = await pool.query('SELECT * FROM product_variants WHERE id = $1', [variant_id]);
    if (variantCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    const result = await pool.query(
      `INSERT INTO stock (variant_id, quantity) VALUES ($1, $2)
       ON CONFLICT (variant_id) DO UPDATE SET quantity = stock.quantity + $2, last_updated = NOW()
       RETURNING *`,
      [variant_id, quantity]
    );
    res.status(201).json({ message: 'Stock updated', stock: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set stock quantity (absolute) for a variant
router.put('/:variantId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const result = await pool.query(
      `INSERT INTO stock (variant_id, quantity) VALUES ($1, $2)
       ON CONFLICT (variant_id) DO UPDATE SET quantity = $2, last_updated = NOW()
       RETURNING *`,
      [req.params.variantId, quantity]
    );
    res.json({ message: 'Stock updated', stock: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
