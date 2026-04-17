const Submission = require('../models/Submission');
const Referral = require('../models/Referral');
const { sendCustomerConfirmation, sendOscarNotification, sendReferrerNotification } = require('../config/email');

class SubmissionController {
  /**
   * Handle new contact form submission
   */
  static async submitContactForm(req, res) {
    try {
      const { first_name, last_name, phone, email, interest, credit_situation, message, referral_code } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !phone || !email) {
        return res.status(400).json({
          success: false,
          error: 'Please provide first name, last name, phone, and email',
        });
      }

      // Create submission in database
      const submission = await Submission.create({
        first_name,
        last_name,
        phone,
        email,
        interest,
        credit_situation,
        message,
        referral_code,
      });

      // If referral code was used, track it and notify the referrer
      if (referral_code) {
        try {
          await Referral.addReferredSubmission(referral_code, email);
          // Look up referrer and send notification if they have a real email
          const referrer = await Referral.getByCode(referral_code);
          if (referrer && referrer.email && !referrer.email.endsWith('@referral.keysog')) {
            await sendReferrerNotification(referrer.email, referrer.first_name, first_name);
          }
        } catch (refError) {
          console.warn('Warning: Could not track referral:', refError.message);
        }
      }

      // Send confirmation email to customer
      const emailSent = await sendCustomerConfirmation(first_name, email, interest);
      if (emailSent) {
        await Submission.updateEmailStatus(submission.id, true);
      }

      // Send notification to Oscar
      await sendOscarNotification(submission);

      return res.status(201).json({
        success: true,
        message: 'Your information has been submitted! Oscar will reach out within the hour.',
        submissionId: submission.id,
      });
    } catch (error) {
      console.error('Error in submitContactForm:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to submit your information. Please try again.',
      });
    }
  }

  /**
   * Get all submissions (admin only)
   */
  static async getAllSubmissions(req, res) {
    try {
      const limit = req.query.limit || 50;
      const offset = req.query.offset || 0;

      const submissions = await Submission.getAll(limit, offset);
      const count = await Submission.getCount();

      return res.json({
        success: true,
        data: submissions,
        pagination: {
          limit,
          offset,
          total: count,
        },
      });
    } catch (error) {
      console.error('Error fetching submissions:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch submissions',
      });
    }
  }

  /**
   * Get single submission by ID (admin only)
   */
  static async getSubmissionById(req, res) {
    try {
      const { id } = req.params;

      const submission = await Submission.getById(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          error: 'Submission not found',
        });
      }

      return res.json({
        success: true,
        data: submission,
      });
    } catch (error) {
      console.error('Error fetching submission:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch submission',
      });
    }
  }

  /**
   * Add notes to submission (admin only)
   */
  static async addNotes(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      if (!notes) {
        return res.status(400).json({
          success: false,
          error: 'Please provide notes',
        });
      }

      const submission = await Submission.addNote(id, notes);

      return res.json({
        success: true,
        data: submission,
      });
    } catch (error) {
      console.error('Error adding notes:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to add notes',
      });
    }
  }

  /**
   * Get submissions by referral code
   */
  static async getByReferralCode(req, res) {
    try {
      const { referralCode } = req.params;

      const submissions = await Submission.getByReferralCode(referralCode);

      return res.json({
        success: true,
        data: submissions,
        count: submissions.length,
      });
    } catch (error) {
      console.error('Error fetching submissions by referral code:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch submissions',
      });
    }
  }
}

module.exports = SubmissionController;
