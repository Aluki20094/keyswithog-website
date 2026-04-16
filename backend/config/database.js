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

    // Create inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        vehicle_name VARCHAR(100) NOT NULL,
        vehicle_type VARCHAR(50),
        description TEXT,
        tagline VARCHAR(200),
        highlights TEXT[],
        price VARCHAR(50),
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        source VARCHAR(50)
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
