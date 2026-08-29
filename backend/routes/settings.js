const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase client - requires env vars SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Use memory storage to get file buffer, then upload to Supabase Storage
const storage = multer.memoryStorage();
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

// Update settings (multipart/form-data with optional `logo` file plus shop/GST/invoice fields)
// Only superadmin can modify global settings
router.post('/', authMiddleware, upload.single('logo'), async (req, res) => {
  if (req.userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
  }
  const { shop_name, shop_address, shop_phone, gstin, gst_rate, invoice_prefix, low_stock_threshold } = req.body;
  const logoFile = req.file; // multer memory storage => buffer in logoFile.buffer
  try {
    const existing = await pool.query('SELECT * FROM settings ORDER BY id LIMIT 1');
    const current = existing.rows[0] || {};

    let logoPath = current.logo_path || null;
    if (logoFile && supabase) {
      const ext = path.extname(logoFile.originalname) || '.png';
      const name = `logo_${Date.now()}${ext}`;
      const { data, error: upErr } = await supabase.storage.from('uploads').upload(name, logoFile.buffer, { contentType: logoFile.mimetype, upsert: false });
      if (upErr) console.error('Supabase upload error', upErr);
      else logoPath = supabase.storage.from('uploads').getPublicUrl(data.path).data.publicUrl;
    }

    const fields = {
      shop_name: shop_name || current.shop_name || 'My Shop',
      logo_path: logoPath,
      shop_address: shop_address ?? current.shop_address ?? null,
      shop_phone: shop_phone ?? current.shop_phone ?? null,
      gstin: gstin ?? current.gstin ?? null,
      gst_rate: gst_rate !== undefined && gst_rate !== '' ? gst_rate : current.gst_rate ?? 0,
      invoice_prefix: invoice_prefix || current.invoice_prefix || 'INV',
      low_stock_threshold: low_stock_threshold !== undefined && low_stock_threshold !== '' ? low_stock_threshold : current.low_stock_threshold ?? 10,
    };

    if (existing.rows.length === 0) {
      const insert = await pool.query(
        `INSERT INTO settings (shop_name, logo_path, shop_address, shop_phone, gstin, gst_rate, invoice_prefix, low_stock_threshold)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [fields.shop_name, fields.logo_path, fields.shop_address, fields.shop_phone, fields.gstin, fields.gst_rate, fields.invoice_prefix, fields.low_stock_threshold]
      );
      return res.json(insert.rows[0]);
    }

    const update = await pool.query(
      `UPDATE settings SET shop_name = $1, logo_path = $2, shop_address = $3, shop_phone = $4,
       gstin = $5, gst_rate = $6, invoice_prefix = $7, low_stock_threshold = $8, updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [fields.shop_name, fields.logo_path, fields.shop_address, fields.shop_phone, fields.gstin, fields.gst_rate, fields.invoice_prefix, fields.low_stock_threshold, current.id]
    );
    res.json(update.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating settings' });
  }
});

module.exports = router;
