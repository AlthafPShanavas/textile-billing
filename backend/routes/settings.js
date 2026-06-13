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

// Update settings (multipart/form-data with optional `logo` file and `shop_name`)
// Only superadmin can modify global settings
router.post('/', authMiddleware, upload.single('logo'), async (req, res) => {
  if (req.userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
  }
  const shopName = req.body.shop_name || '';
  const logoFile = req.file; // multer memory storage => buffer in logoFile.buffer
  try {
    const existing = await pool.query('SELECT * FROM settings ORDER BY id LIMIT 1');
    if (existing.rows.length === 0) {
      let logoPath = null;
      if (logoFile && supabase) {
        const ext = path.extname(logoFile.originalname) || '.png';
        const name = `logo_${Date.now()}${ext}`;
        const { data, error: upErr } = await supabase.storage.from('uploads').upload(name, logoFile.buffer, { contentType: logoFile.mimetype, upsert: false });
        if (upErr) console.error('Supabase upload error', upErr);
        else {
          const url = supabase.storage.from('uploads').getPublicUrl(data.path).data.publicUrl;
          logoPath = url;
        }
      }
      const insert = await pool.query('INSERT INTO settings (shop_name, logo_path) VALUES ($1, $2) RETURNING *', [shopName, logoPath]);
      return res.json(insert.rows[0]);
    }

    const current = existing.rows[0];
    let logoPath = current.logo_path;
    if (logoFile && supabase) {
      // upload new logo to Supabase Storage
      const ext = path.extname(logoFile.originalname) || '.png';
      const name = `logo_${Date.now()}${ext}`;
      const { data, error: upErr } = await supabase.storage.from('uploads').upload(name, logoFile.buffer, { contentType: logoFile.mimetype, upsert: false });
      if (upErr) console.error('Supabase upload error', upErr);
      else {
        const url = supabase.storage.from('uploads').getPublicUrl(data.path).data.publicUrl;
        logoPath = url;
      }
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
