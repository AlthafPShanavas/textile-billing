# Quick Start Guide - Textile Billing Software

## Fastest Way to Get Started (5 minutes)

### Prerequisites
- Install Docker Desktop from https://www.docker.com/products/docker-desktop

### Steps

1. **Download Project**
   - You already have it! Navigate to the Billing software folder

2. **Start Application**
   ```bash
   cd "Billing software"
   docker-compose up --build
   ```

3. **Wait for Setup** (2-3 minutes)
   - Docker will download images and setup database
   - Wait for "ready to accept connections" message

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

5. **Login**
   - Username: `admin`
   - Password: `admin`

6. **Done!** 🎉
   - Start using the billing system immediately

## Without Docker (Manual Setup)

### Backend
```bash
cd backend
npm install
npm start
```

### Database
```bash
# Create PostgreSQL database
createdb textile_billing

# Import initial data
psql -U postgres -d textile_billing -f database/init.sql
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## First Steps

1. **Add Products** (Optional - sample data included)
   - Go to Stock Management
   - Click "Add Stock"
   - Select product and quantity

2. **Start Billing**
   - Go to Billing tab
   - Search for products
   - Add to cart
   - Set payment method
   - Place order

3. **Check Reports**
   - Go to Reports tab
   - Generate daily/monthly reports
   - Export as CSV

## Need Help?

- Check README.md for complete documentation
- Database starts with sample products and staff
- All credentials are in .env.example

Enjoy! 📱
