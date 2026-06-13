const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Daily sales report
router.get('/daily/:date', authMiddleware, async (req, res) => {
  try {
    const date = req.params.date;
    const result = await pool.query(
      `SELECT 
        DATE(order_date) as date,
        COUNT(*) as total_orders,
        SUM(subtotal) as total_subtotal,
        SUM(discount_amount) as total_discount,
        SUM(total) as total_sales,
        payment_method,
        COUNT(DISTINCT user_id) as total_staff
      FROM orders 
      WHERE DATE(order_date) = $1
      GROUP BY DATE(order_date), payment_method
      ORDER BY payment_method`,
      [date]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Monthly sales report
router.get('/monthly/:year/:month', authMiddleware, async (req, res) => {
  try {
    const { year, month } = req.params;
    const result = await pool.query(
      `SELECT 
        DATE_TRUNC('day', order_date)::date as date,
        COUNT(*) as total_orders,
        SUM(subtotal) as total_subtotal,
        SUM(discount_amount) as total_discount,
        SUM(total) as total_sales
      FROM orders 
      WHERE EXTRACT(YEAR FROM order_date) = $1 
        AND EXTRACT(MONTH FROM order_date) = $2
      GROUP BY DATE_TRUNC('day', order_date)
      ORDER BY date DESC`,
      [year, month]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yearly sales report
router.get('/yearly/:year', authMiddleware, async (req, res) => {
  try {
    const year = req.params.year;
    const result = await pool.query(
      `SELECT 
        EXTRACT(MONTH FROM order_date) as month,
        COUNT(*) as total_orders,
        SUM(subtotal) as total_subtotal,
        SUM(discount_amount) as total_discount,
        SUM(total) as total_sales
      FROM orders 
      WHERE EXTRACT(YEAR FROM order_date) = $1
      GROUP BY EXTRACT(MONTH FROM order_date)
      ORDER BY month`,
      [year]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get summary statistics
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const dailyResult = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_sales,
        SUM(discount_amount) as total_discount
      FROM orders 
      WHERE DATE(order_date) = $1`,
      [today]
    );

    const productResult = await pool.query(
      `SELECT COUNT(*) as total_products FROM products`
    );

    const staffResult = await pool.query(
      `SELECT COUNT(*) as total_staff FROM staff`
    );

    res.json({
      daily: dailyResult.rows[0],
      total_products: productResult.rows[0].total_products,
      total_staff: staffResult.rows[0].total_staff
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
