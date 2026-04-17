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
      SELECT
        r.*,
        COALESCE(COUNT(rs.id), 0) AS submission_count,
        COALESCE(SUM(CASE WHEN rs.validated THEN 1 ELSE 0 END), 0) AS validated_count
      FROM referrals r
      LEFT JOIN referral_submissions rs ON r.referral_code = rs.referral_code
      GROUP BY r.id
      ORDER BY r.referral_count DESC, r.created_at DESC
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

      await db.query(
        `
          INSERT INTO referral_submissions (referral_code, referred_email)
          VALUES ($1, $2)
          ON CONFLICT (referral_code, referred_email) DO NOTHING;
        `,
        [referralCode, referredEmail]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error adding referred submission:', error.message);
      throw error;
    }
  }

  /**
   * Get referral submissions by code
   */
  static async getSubmissionsByCode(referralCode) {
    const query = `
      SELECT
        id,
        referral_code,
        referred_email,
        submitted_at,
        validated,
        validated_at,
        payout_amount,
        notes
      FROM referral_submissions
      WHERE referral_code = $1
      ORDER BY submitted_at DESC;
    `;

    try {
      const result = await db.query(query, [referralCode]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching referral submissions:', error.message);
      throw error;
    }
  }

  /**
   * Set referral submission validation status
   */
  static async setSubmissionValidated(id, validated) {
    const query = `
      UPDATE referral_submissions
      SET validated = $2,
          validated_at = CASE WHEN $2 THEN NOW() ELSE NULL END
      WHERE id = $1
      RETURNING *;
    `;

    try {
      const result = await db.query(query, [id, validated]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating referral submission validation:', error.message);
      throw error;
    }
  }

  /**
   * Update referral submission notes or payout amount
   */
  static async updateSubmissionNotes(id, notes, payoutAmount) {
    const updates = [];
    const values = [id];

    if (notes !== undefined) {
      values.push(notes);
      updates.push(`notes = $${values.length}`);
    }

    if (payoutAmount !== undefined) {
      values.push(payoutAmount);
      updates.push(`payout_amount = $${values.length}`);
    }

    try {
      if (updates.length === 0) {
        const result = await db.query(
          `
            SELECT *
            FROM referral_submissions
            WHERE id = $1;
          `,
          [id]
        );
        return result.rows[0];
      }

      const query = `
        UPDATE referral_submissions
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *;
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating referral submission notes:', error.message);
      throw error;
    }
  }

  /**
        (SELECT COUNT(*) FROM referral_submissions WHERE validated = FALSE) as pending_submissions_count
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
        AVG(referral_count) as avg_referrals_per_person,
        (SELECT COUNT(*) FROM referral_submissions WHERE validated = FALSE) as pending_payouts
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
