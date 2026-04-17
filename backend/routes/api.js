const express = require('express');
const router = express.Router();
const SubmissionController = require('../controllers/submissionController');
const ReferralController = require('../controllers/referralController');

// ── Contact Form Submissions ──
router.post('/submit-contact', SubmissionController.submitContactForm);
router.get('/submissions', SubmissionController.getAllSubmissions); // admin
router.get('/submissions/:id', SubmissionController.getSubmissionById); // admin
router.post('/submissions/:id/note', SubmissionController.addNotes); // admin
router.get('/submissions/referral/:referralCode', SubmissionController.getByReferralCode); // admin

// ── Referral Codes ──
router.post('/generate-referral', ReferralController.generateReferralCode);
router.get('/referral/:code', ReferralController.getReferralByCode);
router.get('/referrals', ReferralController.getAllReferrals); // admin
router.get('/referrals/stats', ReferralController.getReferralStats); // admin

module.exports = router;
