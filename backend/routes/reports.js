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
        SUM(tax_amount) as total_tax,
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
        SUM(tax_amount) as total_tax,
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
        SUM(tax_amount) as total_tax,
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

    const productResult = await pool.query(`SELECT COUNT(*) as total_products FROM products`);
    const staffResult = await pool.query(`SELECT COUNT(*) as total_staff FROM staff`);

    res.json({
      daily: dailyResult.rows[0],
      total_products: productResult.rows[0].total_products,
      total_staff: staffResult.rows[0].total_staff,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard summary: today's sales, low stock items, recent orders, top products this month
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todayResult = await pool.query(
      `SELECT COUNT(*) as order_count, COALESCE(SUM(total), 0) as total_sales
       FROM orders WHERE DATE(order_date) = $1`,
      [today]
    );

    const thresholdResult = await pool.query('SELECT low_stock_threshold FROM settings ORDER BY id LIMIT 1');
    const threshold = thresholdResult.rows[0]?.low_stock_threshold ?? 10;

    const lowStockResult = await pool.query(
      `SELECT p.name as product_name, v.size, v.color, v.sku, s.quantity
       FROM stock s
       JOIN product_variants v ON s.variant_id = v.id
       JOIN products p ON v.product_id = p.id
       WHERE s.quantity < $1
       ORDER BY s.quantity ASC
       LIMIT 8`,
      [threshold]
    );

    const recentOrdersResult = await pool.query(
      `SELECT o.id, o.invoice_number, o.total, o.payment_method, o.order_date,
              COALESCE(c.name, 'Walk-in Customer') as customer_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       ORDER BY o.order_date DESC
       LIMIT 5`
    );

    const topProductsResult = await pool.query(
      `SELECT oi.product_name, SUM(oi.quantity) as units_sold, SUM(oi.quantity * oi.price) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE)
       GROUP BY oi.product_name
       ORDER BY units_sold DESC
       LIMIT 5`
    );

    const trendResult = await pool.query(
      `SELECT DATE(order_date) as date, SUM(total) as total_sales
       FROM orders
       WHERE order_date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY DATE(order_date)
       ORDER BY date`
    );

    res.json({
      today: { orderCount: Number(todayResult.rows[0].order_count), totalSales: Number(todayResult.rows[0].total_sales) },
      lowStockCount: lowStockResult.rows.length,
      lowStockItems: lowStockResult.rows,
      recentOrders: recentOrdersResult.rows,
      topProducts: topProductsResult.rows,
      salesTrend: trendResult.rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
