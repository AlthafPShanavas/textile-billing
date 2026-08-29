const { Pool } = require('pg');
require('dotenv').config();

// Supports two modes:
// - Local dev: discrete DB_* env vars (see .env.example), plain TCP connection.
// - Hosted (e.g. Supabase): a single DATABASE_URL connection string over SSL.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'textile_billing',
    });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
