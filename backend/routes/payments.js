const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Record payment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { order_id, amount, method, reference_number, notes } = req.body;

    const result = await pool.query(
      'INSERT INTO payments (order_id, amount, method, reference_number, notes, payment_date) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [order_id, amount, method, reference_number, notes]
    );

    res.status(201).json({ message: 'Payment recorded', payment: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment by order ID
router.get('/order/:orderId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1',
      [req.params.orderId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
