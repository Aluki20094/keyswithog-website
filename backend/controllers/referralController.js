const Referral = require('../models/Referral');

// Utility to sanitize and build referral code (matching frontend logic)
function buildReferralCode(firstName, lastName) {
  const sanitize = (str) => str.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const f = sanitize(firstName).substring(0, 4).padEnd(4, 'X');
  const l = sanitize(lastName).substring(0, 3).padEnd(3, 'X');
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${f}${l}${num}`;
}

class ReferralController {
  /**
   * Generate or retrieve referral code for email
   */
  static async generateReferralCode(req, res) {
    try {
      const { first_name, last_name, email } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !email) {
        return res.status(400).json({
          success: false,
          error: 'Please provide first name, last name, and email',
        });
      }

      // Check if referral already exists for this email
      let referral = await Referral.getByEmail(email);

      if (!referral) {
        // Generate new code
        const referralCode = buildReferralCode(first_name, last_name);
        referral = await Referral.create(first_name, last_name, email, referralCode);
      }

      return res.status(201).json({
        success: true,
        data: {
          referral_code: referral.referral_code,
          email: referral.email,
          referral_count: referral.referral_count,
          payout_total: referral.payout_total,
        },
      });
    } catch (error) {
      console.error('Error generating referral code:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate referral code',
      });
    }
  }

  /**
   * Get referral details by code
   */
  static async getReferralByCode(req, res) {
    try {
      const { code } = req.params;

      const referral = await Referral.getByCode(code);
      if (!referral) {
        return res.status(404).json({
          success: false,
          error: 'Referral code not found',
        });
      }

      return res.json({
        success: true,
        data: {
          referral_code: referral.referral_code,
          name: `${referral.first_name} ${referral.last_name}`,
          email: referral.email,
          referral_count: referral.referral_count,
          payout_total: referral.payout_total,
          created_at: referral.created_at,
        },
      });
    } catch (error) {
      console.error('Error fetching referral:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch referral',
      });
    }
  }

  /**
   * Get all referrals (admin only)
   */
  static async getAllReferrals(req, res) {
    try {
      const limit = req.query.limit || 50;
      const offset = req.query.offset || 0;

      const referrals = await Referral.getAll(limit, offset);
      const stats = await Referral.getStats();

      return res.json({
        success: true,
        data: referrals.map(ref => ({
          id: ref.id,
          referral_code: ref.referral_code,
          name: `${ref.first_name} ${ref.last_name}`,
          email: ref.email,
          referral_count: ref.referral_count,
          payout_total: ref.payout_total,
          submission_count: parseInt(ref.submission_count || 0, 10),
          validated_count: parseInt(ref.validated_count || 0, 10),
          created_at: ref.created_at,
        })),
        stats: {
          total_referrers: stats.total_referrers,
          total_referrals: stats.total_referrals,
          total_payouts: stats.total_payouts,
          avg_referrals_per_person: parseFloat(stats.avg_referrals_per_person || 0).toFixed(2),
          pending_payouts: parseInt(stats.pending_payouts || 0, 10),
        },
        pagination: {
          limit,
          offset,
          total: parseInt(stats.total_referrers, 10),
        },
      });
    } catch (error) {
      console.error('Error fetching referrals:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch referrals',
      });
    }
  }

  /**
   * Get referral stats (for admin)
   */
  static async getReferralStats(req, res) {
    try {
      const stats = await Referral.getStats();

      return res.json({
        success: true,
        data: {
          total_referrers: stats.total_referrers,
          total_referrals: stats.total_referrals || 0,
          total_payouts: parseFloat(stats.total_payouts || 0).toFixed(2),
          avg_referrals_per_person: parseFloat(stats.avg_referrals_per_person || 0).toFixed(2),
          pending_payouts: parseInt(stats.pending_payouts || 0, 10),
        },
      });
    } catch (error) {
      console.error('Error fetching referral stats:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch referral stats',
      });
    }
  }

  /**
   * Get referral submissions by code (admin only)
   */
  static async getReferralSubmissions(req, res) {
    try {
      const { code } = req.params;

      const referral = await Referral.getByCode(code);
      if (!referral) {
        return res.status(404).json({
          success: false,
          error: 'Referral code not found',
        });
      }

      const submissions = await Referral.getSubmissionsByCode(code);

      return res.json({
        success: true,
        data: submissions,
        count: submissions.length,
      });
    } catch (error) {
      console.error('Error fetching referral submissions:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch referral submissions',
      });
    }
  }

  /**
   * Validate a referral submission (admin only)
   */
  static async validateReferralSubmission(req, res) {
    try {
      const { id } = req.params;
      const submission = await Referral.setSubmissionValidated(id, true);

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: 'Referral submission not found',
        });
      }

      return res.json({
        success: true,
        data: submission,
      });
    } catch (error) {
      console.error('Error validating referral submission:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate referral submission',
      });
    }
  }

  /**
   * Unvalidate a referral submission (admin only)
   */
  static async unvalidateReferralSubmission(req, res) {
    try {
      const { id } = req.params;
      const submission = await Referral.setSubmissionValidated(id, false);

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: 'Referral submission not found',
        });
      }

      return res.json({
        success: true,
        data: submission,
      });
    } catch (error) {
      console.error('Error unvalidating referral submission:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to unvalidate referral submission',
      });
    }
  }

  /**
   * Update referral submission notes or payout amount (admin only)
   */
  static async updateReferralSubmissionNotes(req, res) {
    try {
      const { id } = req.params;
      const { notes, payout_amount } = req.body;

      if (typeof notes === 'undefined' && typeof payout_amount === 'undefined') {
        return res.status(400).json({
          success: false,
          error: 'Provide notes or payout amount to update',
        });
      }

      let payoutAmount = null;
      if (typeof payout_amount !== 'undefined') {
        payoutAmount = parseFloat(payout_amount);
        if (Number.isNaN(payoutAmount)) {
          return res.status(400).json({
            success: false,
            error: 'Payout amount must be a valid number',
          });
        }
      }

      const submission = await Referral.updateSubmissionNotes(
        id,
        typeof notes === 'undefined' ? null : notes,
        payoutAmount
      );

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: 'Referral submission not found',
        });
      }

      return res.json({
        success: true,
        data: submission,
      });
    } catch (error) {
      console.error('Error updating referral submission notes:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to update referral submission',
      });
    }
  }
}

module.exports = ReferralController;
