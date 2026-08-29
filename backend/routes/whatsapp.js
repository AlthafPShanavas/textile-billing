const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const { generateInvoicePdfBuffer } = require('../utils/invoicePdf');
const billingRoutes = require('./billing');
const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME; // optional, see DEPLOYMENT.md
const WHATSAPP_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || 'en_US';

async function uploadInvoicePdf(buffer, invoiceNumber) {
  if (!supabase) return null;
  const name = `invoices/${invoiceNumber}-${Date.now()}.pdf`;
  const { data, error } = await supabase.storage.from('uploads').upload(name, buffer, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (error) {
    console.error('Supabase invoice upload error', error);
    return null;
  }
  return supabase.storage.from('uploads').getPublicUrl(data.path).data.publicUrl;
}

// Sends the invoice document via the WhatsApp Cloud API (Meta Graph API).
// Requires WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID.
// - If WHATSAPP_TEMPLATE_NAME is set, sends an approved template with a document header
//   (link: pdfUrl) and one body variable (the invoice number). Match this to your actual
//   approved template's structure, or adjust the `components` below to fit it.
// - Otherwise sends a free-form document message, which only reaches the customer if they
//   messaged your WhatsApp Business number within the last 24 hours, or you're in test mode.
async function sendViaCloudApi({ phone, pdfUrl, invoiceNumber, caption }) {
  const to = phone.replace(/[^\d]/g, '');
  const body = WHATSAPP_TEMPLATE_NAME
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: WHATSAPP_TEMPLATE_NAME,
          language: { code: WHATSAPP_TEMPLATE_LANG },
          components: [
            { type: 'header', parameters: [{ type: 'document', document: { link: pdfUrl, filename: `${invoiceNumber}.pdf` } }] },
            { type: 'body', parameters: [{ type: 'text', text: invoiceNumber }] },
          ],
        },
      }
    : {
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: { link: pdfUrl, filename: `${invoiceNumber}.pdf`, caption },
      };

  const response = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'WhatsApp Cloud API request failed');
  }
  return data;
}

// Generates the invoice PDF, uploads it (if Supabase Storage is configured), and — if the
// WhatsApp Cloud API is configured — sends it directly. Always returns pdfUrl so the frontend
// can fall back to a wa.me link (with the PDF link in the message text) when the Cloud API
// isn't set up yet.
router.post('/send-invoice', authMiddleware, async (req, res) => {
  try {
    const { orderId, phone } = req.body;
    if (!orderId || !phone) {
      return res.status(400).json({ message: 'orderId and phone are required' });
    }

    const result = await billingRoutes.fetchOrderWithItems(orderId);
    if (!result) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const settingsResult = await pool.query('SELECT * FROM settings ORDER BY id LIMIT 1');
    const settings = settingsResult.rows[0];
    const buffer = await generateInvoicePdfBuffer({ settings, ...result });
    const pdfUrl = await uploadInvoicePdf(buffer, result.order.invoice_number);

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return res.json({
        pdfUrl,
        whatsappSent: false,
        message: pdfUrl
          ? 'WhatsApp Cloud API not configured — use the share link instead.'
          : 'WhatsApp Cloud API and file storage are both not configured — see DEPLOYMENT.md.',
      });
    }

    try {
      await sendViaCloudApi({
        phone,
        pdfUrl,
        invoiceNumber: result.order.invoice_number,
        caption: `${settings?.shop_name || 'Invoice'} — ${result.order.invoice_number}`,
      });
      return res.json({ pdfUrl, whatsappSent: true, message: 'Sent via WhatsApp' });
    } catch (apiError) {
      return res.json({ pdfUrl, whatsappSent: false, message: apiError.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
