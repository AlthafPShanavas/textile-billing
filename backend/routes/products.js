const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const upload = multer({ storage: multer.memoryStorage() });

async function uploadImage(file) {
  if (!file || !supabase) return null;
  const ext = path.extname(file.originalname) || '.png';
  const name = `product_${Date.now()}${ext}`;
  const { data, error } = await supabase.storage.from('uploads').upload(name, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) {
    console.error('Supabase upload error', error);
    return null;
  }
  return supabase.storage.from('uploads').getPublicUrl(data.path).data.publicUrl;
}

// Attach variants + stock to a list of products (one query, grouped in JS)
async function withVariants(products) {
  if (products.length === 0) return [];
  const ids = products.map((p) => p.id);
  const variantsResult = await pool.query(
    `SELECT v.*, COALESCE(s.quantity, 0) as quantity
     FROM product_variants v
     LEFT JOIN stock s ON s.variant_id = v.id
     WHERE v.product_id = ANY($1::int[])
     ORDER BY v.size, v.color`,
    [ids]
  );
  const byProduct = {};
  variantsResult.rows.forEach((v) => {
    if (!byProduct[v.product_id]) byProduct[v.product_id] = [];
    byProduct[v.product_id].push(v);
  });
  return products.map((p) => {
    const variants = byProduct[p.id] || [];
    return {
      ...p,
      variants,
      total_stock: variants.reduce((sum, v) => sum + Number(v.quantity), 0),
    };
  });
}

// Get all products (with search + variants/stock attached)
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR EXISTS (
        SELECT 1 FROM product_variants v WHERE v.product_id = products.id AND v.sku ILIKE $${params.length}
      ))`;
    }
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(await withVariants(result.rows));
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
    const [withV] = await withVariants(result.rows);
    res.json(withV);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product + its initial variants
// Accepts multipart/form-data (optional `image` file) with a `variants` field as a JSON string,
// or a plain JSON body with a `variants` array.
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, code, category, description, price, gst_rate } = req.body;
    let variants = req.body.variants;
    if (typeof variants === 'string') variants = JSON.parse(variants || '[]');
    if (!Array.isArray(variants) || variants.length === 0) {
      variants = [{ size: null, color: null, sku: code, quantity: 0 }];
    }

    const image_url = await uploadImage(req.file);

    await client.query('BEGIN');
    const productResult = await client.query(
      'INSERT INTO products (name, code, category, description, image_url, price, gst_rate) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, code, category, description, image_url, price, gst_rate || null]
    );
    const product = productResult.rows[0];

    for (const v of variants) {
      const variantResult = await client.query(
        'INSERT INTO product_variants (product_id, size, color, sku, price_override) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [product.id, v.size || null, v.color || null, v.sku, v.price_override || null]
      );
      await client.query('INSERT INTO stock (variant_id, quantity) VALUES ($1, $2)', [
        variantResult.rows[0].id,
        parseInt(v.quantity, 10) || 0,
      ]);
    }

    await client.query('COMMIT');
    const [withV] = await withVariants([product]);
    res.status(201).json({ message: 'Product added', product: withV });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

// Update product core fields
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, code, category, description, price, gst_rate } = req.body;
    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const image_url = (await uploadImage(req.file)) || existing.rows[0].image_url;

    const result = await pool.query(
      `UPDATE products SET name = $1, code = $2, category = $3, description = $4,
       image_url = $5, price = $6, gst_rate = $7, updated_at = NOW() WHERE id = $8 RETURNING *`,
      [name, code, category, description, image_url, price, gst_rate || null, req.params.id]
    );

    const [withV] = await withVariants(result.rows);
    res.json({ message: 'Product updated', product: withV });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete product (cascades variants + stock)
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

// Add a variant to a product
router.post('/:id/variants', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { size, color, sku, price_override, quantity } = req.body;
    await client.query('BEGIN');
    const variantResult = await client.query(
      'INSERT INTO product_variants (product_id, size, color, sku, price_override) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.id, size || null, color || null, sku, price_override || null]
    );
    const stockResult = await client.query(
      'INSERT INTO stock (variant_id, quantity) VALUES ($1, $2) RETURNING *',
      [variantResult.rows[0].id, parseInt(quantity, 10) || 0]
    );
    await client.query('COMMIT');
    res.status(201).json({ ...variantResult.rows[0], quantity: stockResult.rows[0].quantity });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

// Update a variant (size/color/sku/price override)
router.put('/variants/:variantId', authMiddleware, async (req, res) => {
  try {
    const { size, color, sku, price_override } = req.body;
    const result = await pool.query(
      'UPDATE product_variants SET size = $1, color = $2, sku = $3, price_override = $4 WHERE id = $5 RETURNING *',
      [size || null, color || null, sku, price_override || null, req.params.variantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a variant
router.delete('/variants/:variantId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM product_variants WHERE id = $1 RETURNING *', [
      req.params.variantId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.json({ message: 'Variant deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
