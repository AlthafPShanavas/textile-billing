# Textile Billing Software - Complete Guide

## Overview
A complete billing and stock management system for textile shops with POS, staff management, and reporting features.

## Features

### 1. **Billing System (POS)**
- Search products by:
  - Product name
  - Product code/ID
  - Starting letters
- Add items to cart with quantity management
- Discount management (fixed amount or percentage)
- Multiple payment methods (Cash, Card, GPay)
- Real-time inventory updates
- Order history

### 2. **Stock Management**
- Add/Update product quantities
- Low stock alerts
- Bulk stock management
- Track product details (name, code, category, price)

### 3. **Staff Management**
- Add staff details
- Track salary information
- Joining dates
- Contact information
- Edit/Delete staff records

### 4. **Reports**
- Daily sales reports
- Monthly sales reports
- Yearly sales reports
- Payment method breakdown
- Discount tracking
- CSV export functionality

### 5. **User Management**
- Admin and staff roles
- Secure login system
- JWT authentication

## Technology Stack

**Frontend:**
- React 18
- React Router
- Axios
- React Icons
- CSS3

**Backend:**
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing

**Database:**
- PostgreSQL (Open Source & Free)

**Deployment:**
- Docker & Docker Compose
- Free hosting options (Railway, Render, or self-hosted)

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (or use Docker)
- Docker & Docker Compose (recommended)

### Option 1: Using Docker (Recommended)

1. **Clone/Navigate to project directory:**
```bash
cd "Billing software"
```

2. **Build and run with Docker Compose:**
```bash
docker-compose up --build
```

3. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Default credentials:
  - Username: admin
  - Password: admin

### Option 2: Manual Setup

#### Backend Setup:

1. **Navigate to backend:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
```

4. **Update .env with your database credentials:**
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=textile_billing
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

5. **Setup PostgreSQL Database:**
```bash
# Create database
createdb textile_billing

# Run SQL init script
psql -U postgres -d textile_billing -f ../database/init.sql
```

6. **Start backend server:**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

#### Frontend Setup:

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. **Start frontend:**
```bash
npm start
```

The frontend will open at http://localhost:3000

## Database Schema

### Users Table
- Stores login credentials for admin and staff
- Hashed passwords using bcryptjs
- Roles: admin, staff

### Products Table
- Product information
- Product code (unique identifier)
- Category
- Price

### Stock Table
- Tracks quantity for each product
- Updates automatically on billing
- Last updated timestamp

### Orders Table
- Billing transactions
- Subtotal, discounts, total
- Payment method
- Order date/time

### Order Items Table
- Individual items in an order
- Links to products and orders
- Quantity and price at time of order

### Staff Table
- Staff member information
- Position, salary, joining date
- Contact details

### Payments Table
- Payment records
- Payment method
- Reference numbers for tracking

## API Documentation

### Authentication
**POST** `/api/auth/login`
```json
{
  "username": "admin",
  "password": "admin"
}
```

### Products
- **GET** `/api/products` - Get all products (with search)
- **POST** `/api/products` - Add new product (auth required)
- **GET** `/api/products/:id` - Get product by ID
- **PUT** `/api/products/:id` - Update product (auth required)
- **DELETE** `/api/products/:id` - Delete product (auth required)

### Stock
- **GET** `/api/stock` - Get all stock
- **POST** `/api/stock` - Add stock (auth required)
- **GET** `/api/stock/:productId` - Get stock by product ID
- **PUT** `/api/stock/:productId` - Update stock (auth required)

### Billing
- **POST** `/api/billing/create` - Create order (auth required)
- **GET** `/api/billing` - Get all orders (auth required)
- **GET** `/api/billing/:id` - Get order details (auth required)

### Staff
- **GET** `/api/staff` - Get all staff (auth required)
- **POST** `/api/staff` - Add staff (auth required)
- **PUT** `/api/staff/:id` - Update staff (auth required)
- **DELETE** `/api/staff/:id` - Delete staff (auth required)

### Reports
- **GET** `/api/reports/daily/:date` - Daily report
- **GET** `/api/reports/monthly/:year/:month` - Monthly report
- **GET** `/api/reports/yearly/:year` - Yearly report
- **GET** `/api/reports/stats/summary` - Summary statistics

## How to Use

### Login
1. Open http://localhost:3000
2. Enter username: `admin`
3. Enter password: `admin`
4. Click Login

### Billing (POS)
1. Click "Billing" tab
2. Search products by name, code, or starting letters
3. Click product to add to cart
4. Adjust quantity using the input field
5. Set discount (amount or percentage)
6. Select payment method
7. Click "Place Order"
8. Print receipt (if needed)

### Stock Management
1. Click "Stock Management" tab
2. Click "Add Stock" to add new quantities
3. Select product and enter quantity
4. Edit existing stock by clicking the edit icon
5. Low stock items are highlighted in red

### Staff Management
1. Click "Staff Management" tab
2. Click "Add Staff" to add new employee
3. Fill in details (name, email, phone, position, salary, joining date)
4. Edit staff by clicking edit icon
5. Delete staff by clicking delete icon

### Reports
1. Click "Reports" tab
2. Select report type (Daily/Monthly/Yearly)
3. Set filters (date, month, year)
4. Click "Generate Report"
5. Click "Download CSV" to export

## Free Hosting Options

### Option 1: Railway (Recommended)
1. Sign up at https://railway.app
2. Connect your GitHub repository
3. Create services for:
   - Backend (Node.js)
   - Frontend (Static/Next.js)
   - PostgreSQL (built-in)
4. Railway provides free tier with generous limits

### Option 2: Render
1. Sign up at https://render.com
2. Create Web Service for Backend
3. Create Static Site for Frontend
4. Add PostgreSQL database
5. Connect GitHub for auto-deployment

### Option 3: Self-Hosted (VPS)
1. Get cheap VPS from:
   - Linode (starts ~$5/month)
   - DigitalOcean ($4/month)
   - AWS Free Tier
   - Oracle Cloud Always Free

2. Install Docker and Docker Compose
3. Clone repository and run docker-compose up
4. Setup Nginx reverse proxy
5. Setup SSL certificate with Let's Encrypt (free)

### Option 4: Fly.io
1. Sign up at https://fly.io
2. Install Fly CLI
3. Run `flyctl launch` in project root
4. Deploy with `flyctl deploy`
5. Free tier includes resources for this app

## Deployment Steps (Railway Example)

1. **Push code to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/textile-billing.git
git push -u origin main
```

2. **Create Railway Account:**
   - Visit https://railway.app
   - Sign up with GitHub

3. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your textile-billing repository

4. **Add Services:**
   - PostgreSQL (add plugin)
   - Backend (Node.js from repository)
   - Frontend (Static from repository)

5. **Configure Environment Variables:**
   - Set DB credentials
   - Set JWT secret
   - Set API URL for frontend

6. **Deploy:**
   - Push code to main branch
   - Railway auto-deploys

## Security Tips

1. **Change default credentials:**
   - Update admin password immediately
   - Create individual staff accounts

2. **Environment Variables:**
   - Never commit .env files
   - Use strong JWT secret
   - Change default DB passwords

3. **Database:**
   - Regular backups
   - Use strong passwords
   - Restrict database access

4. **API:**
   - Use HTTPS in production
   - Rate limiting
   - Input validation

5. **SSL Certificate:**
   - Use Let's Encrypt (free)
   - Auto-renew certificates

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000
# Kill process if needed
kill -9 <PID>

# Check database connection
psql -U postgres -h localhost
```

### Frontend can't connect to backend
- Check REACT_APP_API_URL in .env
- Ensure backend is running
- Check CORS configuration
- Check network tab in browser dev tools

### Database connection error
- Verify PostgreSQL is running
- Check credentials in .env
- Run SQL init script
- Check database exists

### Docker issues
```bash
# Clean up Docker
docker system prune

# Rebuild containers
docker-compose down
docker-compose up --build

# Check logs
docker-compose logs -f
```

## File Structure

```
Billing software/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── stock.js
│   │   ├── billing.js
│   │   ├── staff.js
│   │   ├── reports.js
│   │   └── payments.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Billing.jsx
│   │   │   ├── Stock.jsx
│   │   │   ├── Staff.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── *.css
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── App.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── database/
│   └── init.sql
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Future Enhancements

- Barcode generation and scanning
- Email receipts
- Inventory alerts
- Customer database
- Multi-store support
- Advanced analytics
- Mobile app
- Payment gateway integration
- Invoice printing
- Tax calculation

## Support

For issues or questions:
1. Check troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Check backend logs

## License

Open source - Free to use and modify

## Demo Credentials

**Username:** admin  
**Password:** admin

---

**Happy Billing! 🎉**
