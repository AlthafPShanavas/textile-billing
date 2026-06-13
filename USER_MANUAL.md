# User Manual - Textile Billing Software

## Table of Contents
1. [Login](#login)
2. [Dashboard Overview](#dashboard-overview)
3. [Billing (POS) System](#billing-pos-system)
4. [Stock Management](#stock-management)
5. [Staff Management](#staff-management)
6. [Reports](#reports)
7. [Tips & Tricks](#tips--tricks)

---

## Login

### First Time Login
1. Open the application in your browser
2. Enter username: `admin`
3. Enter password: `admin`
4. Click "Login"

### Change Password (Recommended)
1. You can add new users from the backend
2. Ask admin to create new accounts with individual credentials

---

## Dashboard Overview

The main dashboard has 4 sections:

### 1. Billing Tab 📱
Quick POS system for sales

### 2. Stock Management Tab 📦
Manage product inventory

### 3. Staff Management Tab 👥
Manage employee records

### 4. Reports Tab 📊
View sales analytics

---

## Billing (POS) System

### How to Bill a Customer

**Step 1: Search for Product**
- Type product name, code, or first letters in search box
- Example: Type "shirt" or "LPS" or "S" to find "LPshirt"

**Step 2: Add to Cart**
- Click on product from search results
- Product appears in cart

**Step 3: Adjust Quantity**
- Use quantity input in cart
- Click X to remove item

**Step 4: Apply Discount (Optional)**
- Select "Amount (₹)" for fixed discount
  - Example: ₹100 off
- Select "Percentage (%)" for percentage discount
  - Example: 10% off

**Step 5: Choose Payment Method**
- ☐ Cash
- ☐ Card
- ☐ GPay

**Step 6: Complete Order**
- Click "💰 Place Order"
- Order is saved to database
- Stock updates automatically
- See success message

### Tips for Fast Billing
- Use keyboard shortcuts to search
- Start with first 2-3 letters of product
- Use product codes for exact match
- Adjust quantities before placing order

### Sample Search Examples
| What to Type | Finds |
|--------------|-------|
| shirt | Cotton T-Shirt, Casual Shirt, Short Sleeve Tee |
| SHIRT | Products with code starting with SHIRT |
| 001 | Specific product code |
| jean | Denim Jeans |

---

## Stock Management

### View Current Stock

1. Click "Stock Management" tab
2. See all products with quantities
3. Red quantities = Low stock (less than 20)

### Add Stock

1. Click "Add Stock" button
2. Select product from dropdown
3. Enter quantity to add
4. Click "Save"
5. Quantity is added to existing stock

### Update Stock

1. Find product in list
2. Click edit icon (pencil)
3. Change quantity (replaces existing, not adds)
4. Click "Save"

### Low Stock Alert
- Quantities below 20 are highlighted in red
- Plan to reorder these products

---

## Staff Management

### Add New Staff Member

1. Click "Staff Management" tab
2. Click "Add Staff" button
3. Fill in details:
   - **Name:** Full name
   - **Email:** Email address
   - **Phone:** Contact number
   - **Position:** Job title (e.g., "Sales Staff", "Manager")
   - **Salary:** Monthly salary in rupees
   - **Joining Date:** Date employee started

4. Click "Save"

### Edit Staff Information

1. Find staff member in list
2. Click edit icon (pencil)
3. Update information
4. Click "Save"

### Delete Staff Member

1. Find staff member in list
2. Click delete icon (trash)
3. Confirm deletion

### Staff List View
Shows all staff with:
- Name
- Email
- Phone
- Position
- Salary
- Joining Date

---

## Reports

### Generate Daily Report

1. Click "Reports" tab
2. Daily Report is selected by default
3. Choose date from calendar
4. Click "Generate Report"
5. View sales data for that day

**Shows:**
- Total orders placed
- Total sales amount
- Discounts given
- Payment methods used

### Generate Monthly Report

1. Click "Reports" tab
2. Select "Monthly Report"
3. Choose month from dropdown
4. Choose year
5. Click "Generate Report"
6. View daily breakdown for entire month

**Shows:**
- Each day's sales
- Trends for the month
- Total monthly revenue

### Generate Yearly Report

1. Click "Reports" tab
2. Select "Yearly Report"
3. Choose year
4. Click "Generate Report"
5. View monthly breakdown

**Shows:**
- Each month's sales
- Yearly trends
- Total annual revenue

### Export Report

1. Generate any report
2. Click "Download CSV" button
3. File downloads to computer
4. Open in Excel or Google Sheets
5. Create custom charts and analysis

### Tips for Reports
- Run daily reports at end of day
- Compare week-to-week trends
- Analyze payment methods
- Track discount patterns

---

## Tips & Tricks

### Speed Up Billing
- Remember common product codes
- Use 2-3 letter search codes
- Keep popular items on top
- Add frequently bought items together

### Manage Stock Efficiently
- Check stock levels daily
- Reorder low stock items weekly
- Track which items sell most
- Use reports to identify trends

### Monitor Sales
- Generate daily reports
- Track payment methods
- Monitor discount usage
- Compare daily totals

### Staff Management
- Keep contact info updated
- Track joining dates
- Monitor salary records
- Maintain attendance records separately

### Keyboard Shortcuts
- **Ctrl/Cmd + Z:** Browser back
- **Tab:** Move between fields
- **Enter:** Search/Submit

### Best Practices
1. Back up database regularly
2. Change admin password often
3. Create unique staff accounts
4. Verify discounts before placing order
5. Print receipts for records
6. Reconcile daily sales reports

### Common Issues

**Search not working?**
- Try exact product code
- Check spelling
- Use fewer characters

**Stock not updating?**
- Refresh page
- Check if order was placed successfully
- Verify product was in cart

**Report shows no data?**
- Check date/month/year selection
- Ensure orders were placed on that date
- Try regenerating report

---

## Important Information

### Backup Your Data
1. Database automatically saves all data
2. Create regular backups
3. Export reports as CSV periodically
4. Keep email backup of important receipts

### Security
- Change default admin password
- Don't share login credentials
- Log out when leaving desk
- Clear browser history

### Support
- Check README.md for technical details
- Review DEPLOYMENT.md for hosting help
- Check database schema in SQL file

---

## Frequently Asked Questions

**Q: How do I print receipts?**
A: Use browser print function (Ctrl+P) on order screen

**Q: Can I modify a placed order?**
A: No, but create a refund transaction with negative amount

**Q: How do I add new products?**
A: Ask backend developer or use direct database access

**Q: Can multiple people use at once?**
A: Yes! Create multiple user accounts

**Q: Where is data stored?**
A: PostgreSQL database (local or cloud)

**Q: Can I access from mobile?**
A: Yes, responsive design works on phones

---

## Quick Reference

| Tab | Function |
|-----|----------|
| Billing | Create sales, manage cart, process payments |
| Stock | Add/Update product quantities |
| Staff | Manage employee records |
| Reports | View sales analytics, export data |

---

Enjoy using Textile Billing Software! 📊💼
