const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Add staff member
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, position, salary, joining_date } = req.body;

    const result = await pool.query(
      'INSERT INTO staff (name, email, phone, position, salary, joining_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone, position, salary, joining_date]
    );

    res.status(201).json({ message: 'Staff member added', staff: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all staff
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get staff by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update staff
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, position, salary, joining_date } = req.body;
    const result = await pool.query(
      'UPDATE staff SET name = $1, email = $2, phone = $3, position = $4, salary = $5, joining_date = $6 WHERE id = $7 RETURNING *',
      [name, email, phone, position, salary, joining_date, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({ message: 'Staff updated', staff: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete staff
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM staff WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    res.json({ message: 'Staff deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
