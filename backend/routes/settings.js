const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pool = require('../db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `logo_${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

// Get settings (assume single row)
router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM settings ORDER BY id LIMIT 1');
    if (r.rows.length === 0) return res.json({});
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// Update settings (multipart/form-data with optional `logo` file and `shop_name`)
// Only superadmin can modify global settings
router.post('/', authMiddleware, upload.single('logo'), async (req, res) => {
  if (req.userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
  }
  const shopName = req.body.shop_name || '';
  const logoFile = req.file;
  try {
    const existing = await pool.query('SELECT * FROM settings ORDER BY id LIMIT 1');
    if (existing.rows.length === 0) {
      const logoPath = logoFile ? `/uploads/${logoFile.filename}` : null;
      const insert = await pool.query('INSERT INTO settings (shop_name, logo_path) VALUES ($1, $2) RETURNING *', [shopName, logoPath]);
      return res.json(insert.rows[0]);
    }

    const current = existing.rows[0];
    let logoPath = current.logo_path;
    if (logoFile) {
      // remove previous file if present
      if (logoPath) {
        const prev = path.join(__dirname, '..', logoPath.replace(/^\//, ''));
        if (fs.existsSync(prev)) {
          try { fs.unlinkSync(prev); } catch (e) { console.warn('Could not remove old logo', e); }
        }
      }
      logoPath = `/uploads/${logoFile.filename}`;
    }

    const update = await pool.query(
      'UPDATE settings SET shop_name = $1, logo_path = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [shopName || current.shop_name, logoPath, current.id]
    );
    res.json(update.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating settings' });
  }
});

module.exports = router;
