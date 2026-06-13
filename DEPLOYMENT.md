# Deployment Guide - Textile Billing Software

## Free Hosting Options Comparison

| Platform | Pros | Cons | Free Tier |
|----------|------|------|-----------|
| **Railway** | Easy deployment, good UI, built-in PostgreSQL | Limited free credits | $5 credit/month |
| **Render** | Generous free tier, good for this app | Slower free tier | Fully free |
| **Fly.io** | Good performance, worldwide deployment | Limited free resources | Free tier available |
| **DigitalOcean** | Cheap VPS, more control | Need Linux knowledge | $4/month |
| **Oracle Cloud** | Truly free forever tier | Complex setup | Free tier forever |

## Recommended: Railway.app (Easiest)

### Step-by-Step Deployment

1. **Prepare GitHub Repository**
   ```bash
   cd "Billing software"
   git init
   git add .
   git commit -m "Initial textile billing system"
   git remote add origin https://github.com/YOUR_USERNAME/textile-billing.git
   git push -u origin main
   ```

2. **Create Railway Account**
   - Visit https://railway.app
   - Click "Start for free"
   - Sign up with GitHub

3. **Create New Project**
   - Dashboard → New Project
   - Select "Deploy from GitHub repo"
   - Choose your textile-billing repository
   - Click "Deploy now"

4. **Wait for Initial Setup**
   - Railway detects Node.js automatically
   - Initial build takes 2-3 minutes

5. **Add PostgreSQL Database**
   - Click "Add service" → Add Plugin
   - Select PostgreSQL
   - Railway auto-connects to backend

6. **Configure Environment Variables**
   - Go to Backend service settings
   - Add environment variables:
     ```
     DB_USER=postgres
     DB_PASSWORD=<Railway generates this>
     DB_HOST=<Railway provides this>
     DB_PORT=5432
     DB_NAME=textile_billing
     JWT_SECRET=your-secret-key-here
     NODE_ENV=production
     ```

7. **Initialize Database**
   - Railway provides a terminal
   - Run: `psql $DATABASE_URL < database/init.sql`

8. **Deploy Frontend**
   - Create new service → Deploy from GitHub
   - Point to same repository
   - Select frontend folder in settings
   - Add build command: `npm run build`
   - Add start command: `npm install && npm start`

9. **Get Your URLs**
   - Railway provides domain URLs
   - Backend: `https://your-app.up.railway.app`
   - Frontend: `https://your-app-frontend.up.railway.app`

10. **Update Frontend Config**
    - Set environment variable in frontend service:
      ```
      REACT_APP_API_URL=https://your-app.up.railway.app/api
      ```

11. **Done!** 🚀
    - Visit your frontend URL
    - Use credentials: admin / admin

---

## Alternative: Render.com (Most Generous Free Tier)

### Step-by-Step

1. **Sign Up**
   - Visit https://render.com
   - Sign up with GitHub

2. **Create Backend Service**
   - New → Web Service
   - Connect GitHub repository
   - Configuration:
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Environment: Node

3. **Create Database**
   - New → PostgreSQL
   - Keep defaults
   - Copy connection string

4. **Add Environment Variables to Backend**
   ```
   DATABASE_URL=<connection string from PostgreSQL>
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

5. **Create Frontend Service**
   - New → Static Site
   - Connect GitHub
   - Build Command: `npm run build`
   - Publish Directory: `build`

6. **Add Backend URL to Frontend**
   - Go to frontend settings
   - Environment: `REACT_APP_API_URL=https://your-backend.onrender.com/api`

7. **Access Application**
   - Use the provided Render URL
   - Ready to use!

---

## Self-Hosted: DigitalOcean ($4/month)

### Step-by-Step

1. **Create Droplet**
   - Visit https://digitalocean.com
   - Create new Droplet
   - Select Ubuntu 22.04 LTS
   - Choose $4/month plan
   - Add your SSH key

2. **Connect to Server**
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```

3. **Install Docker**
   ```bash
   apt update && apt install -y docker.io docker-compose
   systemctl start docker
   systemctl enable docker
   usermod -aG docker root
   ```

4. **Clone Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/textile-billing.git
   cd textile-billing
   ```

5. **Setup Environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your details
   nano backend/.env
   ```

6. **Start Services**
   ```bash
   docker-compose up -d
   ```

7. **Setup SSL Certificate (Free)**
   ```bash
   apt install certbot python3-certbot-nginx -y
   certbot certonly --standalone -d yourdomain.com
   ```

8. **Configure Nginx Reverse Proxy**
   ```bash
   apt install nginx -y
   # Create nginx config...
   systemctl start nginx
   ```

9. **Access Your App**
   - Visit `http://YOUR_DROPLET_IP:3000`
   - Use credentials: admin / admin

---

## Oracle Cloud Always Free Tier

### Step-by-Step

1. **Sign Up for Oracle Cloud**
   - Visit https://www.oracle.com/cloud/free
   - Sign up (always free tier)

2. **Create VM Instance**
   - Compute → Instances
   - Create Instance
   - Choose Ubuntu 22.04
   - Keep defaults (always free eligible)

3. **Follow DigitalOcean Steps Above**
   - Install Docker
   - Clone repo
   - Run docker-compose

4. **Configure Firewall**
   - Allow ports 80, 443, 5000, 3000
   - In Instance Details → Security Lists

5. **Point Domain (Optional)**
   - Use free domain from Freenom.com
   - Point to your Oracle IP

---

## Free Domain Names

- **Freenom.com** - Free .tk, .ml, .ga, .cf domains
- **DuckDNS.org** - Free dynamic DNS
- **No-IP.com** - Free dynamic DNS

---

## Production Checklist

Before deploying to production:

- [ ] Change admin password
- [ ] Set strong JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Configure email notifications
- [ ] Test all features
- [ ] Set up logging
- [ ] Plan disaster recovery

---

## Monitoring & Maintenance

### Regular Backups
```bash
# Backup PostgreSQL database
pg_dump postgresql://user:password@host:5432/textile_billing > backup.sql

# Restore from backup
psql postgresql://user:password@host:5432/textile_billing < backup.sql
```

### Monitor Application
```bash
# Check logs
docker-compose logs -f

# Monitor resource usage
docker stats
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

---

## Troubleshooting Deployment

### Application won't start
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Check database connection
4. Ensure ports are not in use

### Database connection fails
1. Check DATABASE_URL format
2. Verify database exists
3. Run init script: `psql $DATABASE_URL < database/init.sql`
4. Check firewall rules

### Frontend can't reach backend
1. Check REACT_APP_API_URL
2. Verify backend is running
3. Check CORS settings
4. Test API directly in browser

### Out of free credits
- Switch to Render (more generous)
- Move to self-hosted VPS
- Check Railway usage dashboard

---

## Cost Comparison (Annual)

| Platform | Annual Cost |
|----------|-------------|
| Railway | $60 (with free credit) |
| Render | $0-60 (if stays in free tier) |
| DigitalOcean | $48 ($4/month) |
| Linode | $60 ($5/month) |
| Oracle Cloud | $0 (always free) |
| Home Server | ~$50 (electricity) |

---

## Getting Help

- **Railway Support:** https://railway.app/support
- **Render Support:** https://render.com/docs
- **Docker Docs:** https://docs.docker.com
- **Node.js Docs:** https://nodejs.org/docs

---

Happy Deploying! 🚀
