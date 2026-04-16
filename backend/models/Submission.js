const db = require('../config/database');

class Submission {
  /**
   * Create a new submission
   */
  static async create(submissionData) {
    const query = `
      INSERT INTO submissions
      (first_name, last_name, phone, email, interest, credit_situation, message, referral_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      submissionData.first_name,
      submissionData.last_name,
      submissionData.phone,
      submissionData.email,
      submissionData.interest || null,
      submissionData.credit_situation || null,
      submissionData.message || null,
      submissionData.referral_code || null,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating submission:', error.message);
      throw error;
    }
  }

  /**
   * Get all submissions (for admin dashboard)
   */
  static async getAll(limit = 50, offset = 0) {
    const query = `
      SELECT * FROM submissions
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    try {
      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching submissions:', error.message);
      throw error;
    }
  }

  /**
   * Get a single submission by ID
   */
  static async getById(id) {
    const query = 'SELECT * FROM submissions WHERE id = $1;';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching submission:', error.message);
      throw error;
    }
  }

  /**
   * Update submission email status
   */
  static async updateEmailStatus(id, sent = true) {
    const query = `
      UPDATE submissions
      SET email_sent = $1, email_sent_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    try {
      const result = await db.query(query, [sent, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating email status:', error.message);
      throw error;
    }
  }

  /**
   * Add notes to a submission
   */
  static async addNote(id, notes) {
    const query = `
      UPDATE submissions
      SET notes = $1
      WHERE id = $2
      RETURNING *;
    `;

    try {
      const result = await db.query(query, [notes, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding notes:', error.message);
      throw error;
    }
  }

  /**
   * Get count of submissions
   */
  static async getCount() {
    const query = 'SELECT COUNT(*) FROM submissions;';

    try {
      const result = await db.query(query);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Error getting submission count:', error.message);
      throw error;
    }
  }

  /**
   * Get submissions by referral code
   */
  static async getByReferralCode(referralCode) {
    const query = 'SELECT * FROM submissions WHERE referral_code = $1;';

    try {
      const result = await db.query(query, [referralCode]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching submissions by referral code:', error.message);
      throw error;
    }
  }
}

module.exports = Submission;
