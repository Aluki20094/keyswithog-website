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
          created_at: ref.created_at,
        })),
        stats: {
          total_referrers: stats.total_referrers,
          total_referrals: stats.total_referrals,
          total_payouts: stats.total_payouts,
          avg_referrals_per_person: parseFloat(stats.avg_referrals_per_person || 0).toFixed(2),
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
}

module.exports = ReferralController;
