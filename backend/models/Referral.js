const db = require('../config/database');

class Referral {
  /**
   * Create a new referral code
   */
  static async create(firstName, lastName, email, referralCode) {
    const query = `
      INSERT INTO referrals
      (first_name, last_name, email, referral_code, referred_emails, referral_count)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE
      SET referral_code = EXCLUDED.referral_code
      RETURNING *;
    `;

    const values = [
      firstName,
      lastName,
      email,
      referralCode,
      [],           // empty array for referred emails
      0,            // zero referrals initially
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating referral:', error.message);
      throw error;
    }
  }

  /**
   * Get referral by code
   */
  static async getByCode(referralCode) {
    const query = 'SELECT * FROM referrals WHERE referral_code = $1;';

    try {
      const result = await db.query(query, [referralCode]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching referral:', error.message);
      throw error;
    }
  }

  /**
   * Get referral by email
   */
  static async getByEmail(email) {
    const query = 'SELECT * FROM referrals WHERE email = $1;';

    try {
      const result = await db.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching referral by email:', error.message);
      throw error;
    }
  }

  /**
   * Get all referrals (for admin dashboard)
   */
  static async getAll(limit = 50, offset = 0) {
    const query = `
      SELECT * FROM referrals
      ORDER BY referral_count DESC, created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    try {
      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching all referrals:', error.message);
      throw error;
    }
  }

  /**
   * Add a referral submission (someone used a referral code)
   */
  static async addReferredSubmission(referralCode, referredEmail) {
    try {
      // Get current referral
      const referral = await this.getByCode(referralCode);
      if (!referral) {
        throw new Error('Referral code not found');
      }

      // Update referred emails and count
      const updatedEmails = referral.referred_emails || [];
      if (!updatedEmails.includes(referredEmail)) {
        updatedEmails.push(referredEmail);
      }

      const newCount = updatedEmails.length;
      const newPayout = newCount * 100; // $100 per referral

      const query = `
        UPDATE referrals
        SET referred_emails = $1, referral_count = $2, payout_total = $3
        WHERE referral_code = $4
        RETURNING *;
      `;

      const result = await db.query(query, [updatedEmails, newCount, newPayout, referralCode]);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding referred submission:', error.message);
      throw error;
    }
  }

  /**
   * Get count of all referrals
   */
  static async getCount() {
    const query = 'SELECT COUNT(*) FROM referrals;';

    try {
      const result = await db.query(query);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Error getting referral count:', error.message);
      throw error;
    }
  }

  /**
   * Get referral statistics
   */
  static async getStats() {
    const query = `
      SELECT
        COUNT(*) as total_referrers,
        SUM(referral_count) as total_referrals,
        SUM(payout_total) as total_payouts,
        AVG(referral_count) as avg_referrals_per_person
      FROM referrals;
    `;

    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting referral stats:', error.message);
      throw error;
    }
  }
}

module.exports = Referral;
