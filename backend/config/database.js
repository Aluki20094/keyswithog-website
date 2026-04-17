const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize database tables on startup
async function initializeDatabase() {
  try {
    // Create submissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        interest VARCHAR(100),
        credit_situation VARCHAR(100),
        message TEXT,
        referral_code VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        email_sent BOOLEAN DEFAULT FALSE,
        email_sent_at TIMESTAMP,
        notes VARCHAR(500)
      );
    `);

    // Create referrals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referral_code VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        referred_emails TEXT[],
        referral_count INT DEFAULT 0,
        payout_total DECIMAL(10, 2) DEFAULT 0.00
      );
    `);

    // Create referral submissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referral_submissions (
        id SERIAL PRIMARY KEY,
        referral_code VARCHAR(20) NOT NULL REFERENCES referrals(referral_code) ON DELETE CASCADE,
        referred_email VARCHAR(100) NOT NULL,
        submitted_at TIMESTAMP DEFAULT NOW(),
        validated BOOLEAN DEFAULT FALSE,
        validated_at TIMESTAMP,
        payout_amount DECIMAL(10, 2) DEFAULT 100.00,
        notes TEXT,
        UNIQUE(referral_code, referred_email)
      );
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  }
}

// Export pool and initialization function
module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initializeDatabase,
};
