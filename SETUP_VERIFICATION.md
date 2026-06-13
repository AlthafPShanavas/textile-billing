# SETUP VERIFICATION CHECKLIST

## ✅ Pre-Setup Verification

Before starting, verify you have:

- [ ] Node.js installed (check: `node --version`)
- [ ] Docker installed (check: `docker --version`)
- [ ] Git installed (check: `git --version`)
- [ ] Internet connection
- [ ] 4GB+ RAM available
- [ ] 2GB+ disk space available

## 🚀 Quick Start Commands

### Method 1: Docker (RECOMMENDED)
```bash
cd "Billing software"
docker-compose up --build
```
✅ Wait 2-3 minutes for setup
✅ Open http://localhost:3000
✅ Login: admin / admin

### Method 2: Manual Setup
```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Database (only if PostgreSQL installed)
psql -U postgres -d textile_billing -f ../database/init.sql

# Terminal 3 - Frontend  
cd frontend
npm install
npm start
```

## 📍 Where Everything Runs

| Component | URL | Port |
|-----------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:5000 | 5000 |
| Database | localhost | 5432 |
| PostgreSQL | (Docker container) | 5432 |

## 🔍 Verify It's Working

### Frontend Working? ✅
- [ ] Can see login page
- [ ] Page is styled with colors
- [ ] Can type in username field

### Backend Running? ✅
- [ ] Visit http://localhost:5000/api/health
- [ ] Should see: `{"status":"Server running","timestamp":"..."}`

### Database Connected? ✅
- [ ] Login successful
- [ ] Can see "Billing" tab
- [ ] No database errors in browser console

## 🐛 Common Issues & Fixes

### Issue: "Cannot connect to server"
**Fix:**
```bash
# Restart Docker
docker-compose down
docker-compose up --build
```

### Issue: "Port already in use"
**Fix:**
```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Issue: "Cannot find PostgreSQL"
**Fix:**
```bash
# Check if Docker is running
docker ps

# If not, restart Docker
docker-compose restart postgres
```

### Issue: "Login fails"
**Fix:**
```bash
# Check backend logs
docker-compose logs backend

# Restart all services
docker-compose down
docker-compose up --build
```

### Issue: "Page not loading"
**Fix:**
```bash
# Check browser console (F12)
# Clear cache: Ctrl+Shift+Delete
# Refresh page: Ctrl+F5

# Check if frontend is running
curl http://localhost:3000
```

## 📊 Health Check

Run this after setup:

```bash
# Check frontend
curl -I http://localhost:3000
# Should return: HTTP/1.0 200 OK

# Check backend
curl -I http://localhost:5000/api/health  
# Should return: HTTP/1.1 200 OK

# Check database
docker-compose exec postgres psql -U postgres -d textile_billing -c "SELECT COUNT(*) FROM products;"
# Should return: 4 products
```

## 🔐 Security Setup (After Getting Started)

**IMPORTANT: Change these immediately!**

1. **Change Admin Password**
   - Ask developer to update in database
   - Or create new admin account

2. **Change JWT Secret**
   - Edit `backend/.env`
   - Change `JWT_SECRET` to something random

3. **Change Database Password**
   - Edit `backend/.env`
   - Change `DB_PASSWORD`

4. **Backup First Backup**
   ```bash
   docker-compose exec postgres pg_dump \
     -U postgres textile_billing > first_backup.sql
   ```

## 📱 Testing the System

### Test 1: Add Product to Cart
1. Click "Billing"
2. Search for "shirt"
3. Click first result
4. Should appear in cart
5. **✅ PASS if: Item is in cart**

### Test 2: Place Order
1. Adjust quantity to 5
2. Select "Cash" payment
3. Click "Place Order"
4. Should see success message
5. **✅ PASS if: Green success message appears**

### Test 3: Check Stock Reduced
1. Click "Stock Management"
2. Find same product
3. Quantity should be reduced
4. **✅ PASS if: Quantity decreased**

### Test 4: View Report
1. Click "Reports"
2. Daily Report selected
3. Click "Generate Report"
4. Should show today's order
5. **✅ PASS if: Report shows your order**

### Test 5: Add Staff
1. Click "Staff Management"
2. Click "Add Staff"
3. Fill in details
4. Click "Save"
5. **✅ PASS if: Staff appears in list**

## 📈 Performance Check

### Expected Performance
- Frontend load: < 3 seconds
- Search results: < 1 second
- Order placement: < 2 seconds
- Reports generation: < 5 seconds

### If Slow:
```bash
# Check system resources
docker stats

# Restart services
docker-compose restart

# Check database size
docker-compose exec postgres psql -U postgres -d textile_billing -c "\dt+"
```

## 🌐 Before Deploying Online

**Checklist:**

- [ ] Admin password changed
- [ ] JWT secret updated
- [ ] Database backed up
- [ ] All features tested
- [ ] Staff trained on system
- [ ] Read DEPLOYMENT.md
- [ ] Chosen hosting provider
- [ ] Created accounts (Railway/Render)
- [ ] Domain ready (optional)

## 📞 Support Quick Links

| Issue | File | Section |
|-------|------|---------|
| "How do I use this?" | USER_MANUAL.md | Each feature |
| "How do I deploy?" | DEPLOYMENT.md | Choose platform |
| "I'm stuck" | README.md | Troubleshooting |
| "Quick setup?" | QUICKSTART.md | 5 minutes |

## ✨ Optimization Tips

### Faster Backend Response
```bash
# Check if using SSD
df -h

# Optimize database
docker-compose exec postgres psql -U postgres -d textile_billing -c "VACUUM ANALYZE;"
```

### Faster Frontend Load
- Clear browser cache: Ctrl+Shift+Delete
- Disable browser extensions
- Use Chrome/Firefox (faster than Safari)

### Better Performance
- Close other apps
- Check internet speed
- Use wired connection (not WiFi)
- Use latest browser version

## 📊 System Monitoring

### Watch Logs in Real-time
```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend  
docker-compose logs -f frontend

# Just database
docker-compose logs -f postgres
```

### Check Service Status
```bash
# Are all services running?
docker-compose ps

# Output should show 3 services UP
```

### Check Resource Usage
```bash
# How much CPU/RAM?
docker stats

# Helps identify bottlenecks
```

## 🎯 Next Steps

### If Everything Works ✅
1. Read USER_MANUAL.md
2. Add your products
3. Train your staff
4. Prepare for deployment

### If Something Doesn't Work ❌
1. Check this file again
2. Google the error message
3. Check Docker logs
4. Try restarting

### Ready to Go Live? 🚀
1. Read DEPLOYMENT.md
2. Choose hosting provider
3. Follow deployment steps
4. Point domain (optional)

## 📝 Notes Section

Write your issues/solutions here:

```
Issue:
Solution:
Date:
---

Issue:
Solution:
Date:
```

## 🎉 All Set!

When you see this:

```
textiles-billing-frontend  | webpack compiled with 3 warnings
textiles-billing-backend   | Server running on port 5000
```

You're ready to go!

Open: http://localhost:3000
Login: admin/admin

**Success! 🎊**

---

*Remember: Read the docs in this order:*
1. **GETTING_STARTED.md** (this file) ← Start here
2. **QUICKSTART.md** ← 5 minute setup
3. **USER_MANUAL.md** ← How to use
4. **DEPLOYMENT.md** ← Go live
5. **README.md** ← Everything in detail
