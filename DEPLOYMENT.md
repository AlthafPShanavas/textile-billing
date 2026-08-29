# Deployment Guide — Free Hosting

Recommended stack (all free tiers, no credit card required for Supabase/Vercel; Render asks for one but doesn't charge on the free plan):

| Layer | Service | Why |
|---|---|---|
| Database + file storage | **[Supabase](https://supabase.com)** | Free Postgres project + the storage bucket already used for the shop logo/product photos — one account covers both. |
| Backend API | **[Render](https://render.com)** | Free Web Service tier, deploys straight from GitHub. |
| Frontend | **[Vercel](https://vercel.com)** | Free, generous, ideal for a Create React App build. |

Push this repo to GitHub first — all three services deploy from a GitHub repo.

```bash
git init   # if not already a git repo
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## 1. Database — Supabase

1. Create a project at https://supabase.com/dashboard (pick a region close to your shop/customers).
2. Open **SQL Editor** → paste the full contents of [`database/init.sql`](database/init.sql) → **Run**. This creates all tables and seeds demo data (including the `admin`/`admin` login).
3. Open **Project Settings → Database** → copy the **Connection string** (URI form, "Connection pooling" tab, port 6543 works well for a small app, or the direct 5432 string). This is your `DATABASE_URL`.
4. Open **Storage** → create a new **public** bucket named `uploads` (used for the shop logo and product photos).
5. Open **Project Settings → API** → copy the **Project URL** (`SUPABASE_URL`) and the **`service_role` secret key** (`SUPABASE_SERVICE_ROLE_KEY`). Keep the service role key secret — it belongs on the backend only, never in the frontend.

> Free Supabase projects auto-pause after 7 days with zero activity. The next request just takes a few seconds longer while it wakes up — no data is lost.

## 2. Backend — Render

1. https://render.com → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Add environment variables (Render → your service → **Environment**):
   ```
   DATABASE_URL=<Supabase connection string from step 1.3>
   JWT_SECRET=<generate a long random string>
   NODE_ENV=production
   SUPABASE_URL=<from step 1.5>
   SUPABASE_SERVICE_ROLE_KEY=<from step 1.5>
   CORS_ORIGIN=https://<your-app>.vercel.app
   ```
   (You can fill in `CORS_ORIGIN` after step 3 once you know the Vercel URL, then redeploy.)
4. Deploy. Render gives you a URL like `https://textile-billing-backend.onrender.com`. Confirm it's alive: `https://<that-url>/api/health`.

> **Free tier spins down after ~15 minutes idle.** The first request after a quiet period takes 30–50 seconds while it restarts — normal for the free tier, not a bug. If that delay matters for your shop's opening rush, either upgrade the Render plan or ping the health endpoint from a free uptime monitor (e.g. UptimeRobot) every 10 minutes to keep it warm.

## 3. Frontend — Vercel

1. https://vercel.com → **Add New → Project** → import the same GitHub repo.
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Create React App (auto-detected)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `build` (default)
3. Environment variable:
   ```
   REACT_APP_API_URL=https://<your-render-backend>.onrender.com/api
   ```
4. Deploy. Vercel gives you a URL like `https://textile-billing.vercel.app`.
5. Go back to Render and set `CORS_ORIGIN` to this exact Vercel URL (no trailing slash), then trigger a redeploy so the backend accepts requests from it.

Visit the Vercel URL — that's your live app.

## 4. WhatsApp invoices (optional)

The **Send to WhatsApp** button on the Billing page works out of the box in two tiers:

**Tier 1 — free `wa.me` link (works today, no setup beyond step 1's Supabase Storage bucket).**
The backend generates a PDF invoice, uploads it to the `uploads` bucket in Supabase Storage, and the frontend opens `https://wa.me/<phone>?text=...` with an itemized summary **and a link to that PDF**. The cashier's WhatsApp opens with the message ready to send — no Meta account needed. If Supabase Storage isn't configured, it still opens WhatsApp with a text-only summary (no PDF link).

**Tier 2 — WhatsApp Cloud API (sends automatically, no manual "tap send" step, and the PDF arrives as a real attachment rather than a link).** Requires a Meta developer setup:

1. Go to https://developers.facebook.com → create an app → add the **WhatsApp** product.
2. Under **WhatsApp → API Setup** you get a temporary access token and a **Phone Number ID** immediately — good enough for testing (Meta lets you message up to 5 verified numbers with the temporary token, no approval needed yet).
3. For real production use (messaging any customer, not just 5 test numbers), you need a **permanent access token** (System User token under Business Settings → System Users) and your business **must be verified**.
4. Because a shop messages the customer *first* (they haven't messaged you), Meta requires an **approved message template** for anything beyond the 24-hour test window. Create one under **WhatsApp Manager → Message Templates**: category "Utility", with a **Document header** and one body variable for the invoice number. Approval usually takes a few hours to a couple of days.
5. Add to Render's environment variables:
   ```
   WHATSAPP_TOKEN=<permanent access token>
   WHATSAPP_PHONE_NUMBER_ID=<from step 2>
   WHATSAPP_TEMPLATE_NAME=<your approved template's name>
   WHATSAPP_TEMPLATE_LANG=en_US
   ```
6. Once these are set, **Send to WhatsApp** sends the invoice directly through the Cloud API instead of opening the wa.me link. If a send ever fails (e.g. template mismatch, un-opted-in number), the app automatically falls back to opening the wa.me link so billing never gets blocked by a WhatsApp API issue.

You don't need to do any of this to use the app — Tier 1 works immediately.

## Updating a live deployment

Both Render and Vercel auto-deploy on every push to `main`. Just `git push`.

If you change `database/init.sql` after go-live, don't re-run the whole file (it starts with `DROP TABLE` — that erases live data). Write a small migration SQL snippet instead and run it once in the Supabase SQL editor.

## Before going live — security checklist

- [ ] Change the `admin` and `staff1` passwords (or delete the demo accounts and create real ones) — see `backend/routes/auth.js` `/register` endpoint, or update directly in Supabase.
- [ ] Set a long, random `JWT_SECRET` on Render (not the placeholder from `.env.example`).
- [ ] Set `CORS_ORIGIN` on the backend to your real Vercel URL — don't leave it open (`*`) in production.
- [ ] Double-check the Supabase `uploads` bucket is the only public one; keep the `service_role` key out of any frontend code or public repo.

## Alternative: self-hosted with Docker Compose

If you'd rather run this on your own VPS (DigitalOcean, Oracle Cloud Free Tier, etc.) instead of the free-tier stack above:

```bash
git clone <your-repo-url>
cd <repo>
docker-compose up -d --build
```

Then put a reverse proxy (Nginx/Caddy) with a free Let's Encrypt certificate in front of ports 3000 (frontend) and 5000 (backend), and update `frontend`'s `REACT_APP_API_URL` build arg in `docker-compose.yml` to your real domain before rebuilding.

## Troubleshooting

- **Frontend loads but API calls fail (network error):** check `REACT_APP_API_URL` on Vercel matches the Render URL exactly, and that `CORS_ORIGIN` on Render matches the Vercel URL exactly (including `https://`, no trailing slash).
- **Backend fails to start / DB connection errors:** confirm `DATABASE_URL` is the full Supabase connection string including `?sslmode=require` if Supabase provided one, and that `database/init.sql` was run successfully in the SQL editor.
- **Logo/product photo uploads silently do nothing:** `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` aren't set on Render, or the `uploads` bucket isn't public.
- **First request after a while is very slow:** expected on Render's free tier (cold start) — see the note in step 2.
