const PDFDocument = require('pdfkit');

const money = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

// Renders a compact A5 invoice PDF for an order and resolves a Buffer.
// `order` is a row from the orders table (joined with username/customer_name/customer_phone),
// `items` is the matching order_items rows, `settings` is the single settings row.
function generateInvoicePdfBuffer({ settings, order, items }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 36 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(16).text(settings?.shop_name || 'Invoice', { align: 'center' });

    const addressLine = [settings?.shop_address, settings?.shop_phone].filter(Boolean).join('  |  ');
    doc.font('Helvetica').fontSize(9).fillColor('#555');
    if (addressLine) doc.text(addressLine, { align: 'center' });
    if (settings?.gstin) doc.text(`GSTIN: ${settings.gstin}`, { align: 'center' });
    doc.fillColor('#000').moveDown(0.8);

    doc.font('Helvetica-Bold').fontSize(10).text(`Invoice: ${order.invoice_number}`);
    doc.font('Helvetica').fontSize(9).text(`Date: ${new Date(order.order_date).toLocaleString('en-IN')}`);
    if (order.customer_name) {
      doc.text(`Customer: ${order.customer_name}${order.customer_phone ? ` (${order.customer_phone})` : ''}`);
    }
    doc.moveDown(0.6);

    const startX = doc.x;
    const colWidths = { item: 190, qty: 40, price: 65, amount: 65 };

    const row = (item, qty, price, amount, opts = {}) => {
      const y = doc.y;
      doc.text(item, startX, y, { width: colWidths.item, ...opts });
      doc.text(qty, startX + colWidths.item, y, { width: colWidths.qty, align: 'right', ...opts });
      doc.text(price, startX + colWidths.item + colWidths.qty, y, { width: colWidths.price, align: 'right', ...opts });
      doc.text(amount, startX + colWidths.item + colWidths.qty + colWidths.price, y, { width: colWidths.amount, align: 'right', ...opts });
    };

    doc.font('Helvetica-Bold').fontSize(9);
    row('Item', 'Qty', 'Price', 'Amount');
    doc.moveDown(0.3);
    doc.moveTo(startX, doc.y).lineTo(startX + 360, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    items.forEach((it) => {
      const variant = [it.size, it.color].filter(Boolean).join('/');
      row(variant ? `${it.product_name} (${variant})` : it.product_name, String(it.quantity), money(it.price), money(it.price * it.quantity));
      doc.moveDown(0.35);
    });

    doc.moveDown(0.2);
    doc.moveTo(startX, doc.y).lineTo(startX + 360, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.4);

    const summaryLine = (label, value, bold) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9.5);
      const y = doc.y;
      doc.text(label, startX + 180, y, { width: 110, align: 'right' });
      doc.text(value, startX + 290, y, { width: 70, align: 'right' });
      doc.moveDown(0.3);
    };

    summaryLine('Subtotal', money(order.subtotal));
    if (Number(order.discount_amount) > 0) summaryLine('Discount', `-${money(order.discount_amount)}`);
    if (Number(order.tax_amount) > 0) summaryLine(`GST (${order.tax_rate}%)`, money(order.tax_amount));
    summaryLine('Total', money(order.total), true);

    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9).text(`Payment: ${order.payment_method || 'N/A'}`, startX, doc.y, { width: 360 });

    doc.moveDown(1);
    doc.font('Helvetica').fontSize(8).fillColor('#888888').text('Thank you for shopping with us!', startX, doc.y, { width: 360, align: 'center' });

    doc.end();
  });
}

module.exports = { generateInvoicePdfBuffer };
