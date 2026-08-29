# Textile Billing Software

A billing, stock and customer management system built for a men's wear textile shop — POS billing with GST invoices, size/color product variants, stock tracking, a customer directory, staff management and sales reports.

## Features

- **Billing (POS)** — search the catalog, pick a size/color, add to cart, apply a discount, take payment (Cash/Card/UPI), print a GST invoice. A Sale/Estimate toggle lets you print a non-binding quote without touching stock. **Send to WhatsApp** and **Download PDF** work right away via a free `wa.me` link + hosted PDF (see [DEPLOYMENT.md](DEPLOYMENT.md) for upgrading to the WhatsApp Cloud API for fully automatic sending).
- **Products** — full catalog management: create/edit/delete products, manage size & color variants and per-variant SKUs, optional product photo.
- **Stock** — quantity is tracked per variant (e.g. "Shirt — M / Blue"), with low-stock badges driven by a configurable threshold.
- **Customers** — a searchable directory with per-customer purchase history; new customers can be captured right at the POS.
- **Staff** — team records: contact info, position, salary, joining date.
- **Reports** — daily/monthly/yearly sales, GST collected, CSV export, and a Home dashboard with today's sales, a 7-day trend chart, low-stock alerts and top products.
- **Settings** — shop name/logo, address, GSTIN, default GST rate, invoice number prefix, low-stock threshold.
- Role-based access: `staff` can only bill; `admin`/`superadmin` also see Products/Stock/Customers/Staff/Reports; only `superadmin` can change Settings.

## Tech stack

- **Frontend:** React 18, React Router 6, Tailwind CSS, Recharts, Axios
- **Backend:** Node.js, Express, PostgreSQL (`pg`), JWT auth, bcryptjs
- **File storage:** Supabase Storage (shop logo + product photos)

## Run it locally

### Option A — Docker Compose (easiest)

Requires [Docker](https://docs.docker.com/get-docker/) installed.

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Postgres: localhost:5432 (user/pass `postgres`/`postgres`, db `textile_billing`) — the schema in `database/init.sql` is applied automatically on first start.

Login with **admin / admin** (or **staff1 / admin** for a limited staff account).

### Option B — Run backend and frontend manually

You'll need Node.js 18+ and a local PostgreSQL instance.

**1. Database**
```bash
createdb textile_billing
psql -U postgres -d textile_billing -f database/init.sql
```

**2. Backend**
```bash
cd backend
cp .env.example .env   # edit DB_* values to match your local Postgres
npm install
npm run dev             # nodemon, auto-reloads
```

**3. Frontend** (in a second terminal)
```bash
cd frontend
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm install
npm start
```

The app opens at http://localhost:3000.

> Product photo / shop logo uploads only work if you also set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` (see [DEPLOYMENT.md](DEPLOYMENT.md)). Without them, everything else works fine — uploads are just skipped.

## Deploying for free

See [DEPLOYMENT.md](DEPLOYMENT.md) for a step-by-step guide to hosting this for free on **Supabase (database + file storage) + Render (backend) + Vercel (frontend)**.

## Project structure

```
backend/            Express API (routes/, middleware/, db.js, server.js)
frontend/            React app (src/components — pages + a small ui/ kit, src/api.js, src/context/)
database/init.sql    Full schema + demo seed data
docker-compose.yml    Local Postgres + backend + frontend, wired together
DEPLOYMENT.md         Free hosting guide (Supabase + Render + Vercel)
USER_MANUAL.md        Day-to-day usage guide for shop staff
```

## Demo credentials

| Username | Password | Role |
|---|---|---|
| `admin`  | `admin` | superadmin (full access) |
| `staff1` | `admin` | staff (billing only) |

**Change these before going live** — see the Security section in [DEPLOYMENT.md](DEPLOYMENT.md).
