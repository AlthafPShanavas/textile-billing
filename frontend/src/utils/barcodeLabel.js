import JsBarcode from 'jsbarcode';
import { printHtml } from './printWindow';
import { formatCurrency } from './format';

// Renders a Code128 barcode for `sku` (handles our alphanumeric SKUs like "TS001-M-BLK"
// directly, unlike EAN/UPC which require numeric, registered codes) and opens a print dialog
// with `copies` small labels (sized for a 50mm x 30mm thermal label printer, but prints fine
// small-and-centered on plain paper too for testing without one).
export const printBarcodeLabel = ({ shopName, productName, size, color, price, sku, copies = 1 }) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, sku, {
    format: 'CODE128',
    displayValue: true,
    fontSize: 12,
    height: 40,
    margin: 4,
  });
  const barcodeDataUrl = canvas.toDataURL('image/png');

  const variantLabel = [size, color].filter(Boolean).join(' / ');
  const labelHtml = `
    <div class="label">
      ${shopName ? `<div class="shop">${shopName}</div>` : ''}
      <div class="product">${productName}${variantLabel ? ` — ${variantLabel}` : ''}</div>
      <img src="${barcodeDataUrl}" alt="${sku}" />
      <div class="price">${formatCurrency(price)}</div>
    </div>
  `;

  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Label ${sku}</title>
    <style>
      @page { size: 50mm 30mm; margin: 2mm; }
      body { font-family: Arial, Helvetica, sans-serif; margin: 0; }
      .label { width: 46mm; padding: 2mm; text-align: center; page-break-after: always; }
      .shop { font-size: 7pt; color: #444; }
      .product { font-size: 7.5pt; font-weight: bold; margin: 1mm 0; overflow-wrap: break-word; }
      img { width: 100%; height: auto; }
      .price { font-size: 10pt; font-weight: bold; margin-top: 1mm; }
    </style>
    </head><body>${labelHtml.repeat(Math.max(1, copies))}</body></html>`;

  printHtml(html);
};
