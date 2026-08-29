# User Manual — Textile Billing Software

A day-to-day guide for shop staff using the app.

## Logging in

Go to the app URL, enter your username and password, and click **Login**.

- **staff** accounts can only see **Billing**.
- **admin/superadmin** accounts also see **Home, Products, Stock, Customers, Staff, Reports**, and **superadmin** additionally sees **Settings**.

Demo accounts: `admin` / `admin` (superadmin), `staff1` / `admin` (staff). Change these before real use — ask whoever manages the deployment to update them (see the Security checklist in `DEPLOYMENT.md`).

## Home

The landing page after login. Shows today's sales total and order count, a 7-day sales chart, items running low on stock, your most recent orders, and this month's top-selling products.

## Billing (POS)

1. Use the **Sale / Estimate** toggle at the top:
   - **Sale** — a real transaction: reduces stock and saves a GST invoice.
   - **Estimate** — a printable quote for the customer; nothing is saved, stock isn't touched.
2. Search for a product by name, code or SKU.
3. Each result shows its size/color options as chips with the stock count (e.g. "M / Blue · 12"). Click one to add it to the cart. A chip is disabled if that size/color is out of stock (Sale mode only).
4. Need to sell something not in the catalog? Open **"+ Add a custom / off-catalog item"** below the search box and enter a name, price and quantity.
5. Adjust quantities or remove items directly in the cart.
6. Optionally enter the customer's name/phone — leave blank for a walk-in sale. A phone number is matched against existing customers automatically; otherwise a new customer record is created.
7. Set a discount (₹ or %) and the GST rate (pre-filled from Settings, editable per sale).
8. Choose a payment method and click **Place Order & Print** (or **Print Estimate**). A printable invoice/estimate opens automatically.
9. After placing the order, three more buttons appear: **Reprint**, **WhatsApp** (opens WhatsApp with the bill and a link to the PDF invoice, pre-filled to the customer's number — just tap send), and **PDF** (downloads/opens the invoice as a PDF file).

## Products

Manage your catalog here (admin/superadmin only).

- **Add Product** — enter name, code, category, base price, optional GST override, description and photo, then add one or more size/color variants (e.g. S/White, M/White, M/Black) with a SKU and starting quantity each.
- **Edit** a product to change its core details, add more variants, or remove a variant (removing a variant also removes its stock record).
- **Delete** removes the product and all its variants/stock permanently.

## Stock

Quantities are tracked per size/color variant, grouped by product. Type a new quantity into the box and click **Save** to update it. Items below the shop's low-stock threshold (set in Settings) are flagged **Low**.

## Customers

A searchable directory. Click the eye icon on any customer to see their full purchase history (invoice numbers, dates, totals).

## Staff

Add, edit or remove staff records — contact info, position, salary, joining date. (This does not create a login account; it's a personnel record only.)

## Reports

Pick **Daily / Monthly / Yearly**, set the date/month/year, and click **Generate Report** to see total sales, GST collected, order counts, a sales trend chart, and the full data table. **Download CSV** exports the current table.

## Settings (superadmin only)

Shop name, logo, address and phone (shown on printed invoices); GSTIN and default GST rate; the invoice number prefix (e.g. `INV` → `INV-00001`); and the low-stock threshold used across Stock/Home alerts.

## Tips

- The cart total is shown live as you edit quantities, discount or GST — nothing is calculated only at checkout.
- Printing opens a new browser tab/window — make sure pop-ups are allowed for this site.
- An Estimate never touches stock or GST invoice numbering, so you can print as many as you like without affecting real records.
