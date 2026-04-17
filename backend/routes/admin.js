const express = require('express');
const router = express.Router();
const path = require('path');
const SubmissionController = require('../controllers/submissionController');
const ReferralController = require('../controllers/referralController');

// Middleware to check admin password
function requireAdminPassword(req, res, next) {
  const password = req.query.password || req.body.password || req.headers['x-admin-password'];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - invalid admin password',
    });
  }

  next();
}

// Public endpoint to verify admin password (used by frontend login modal)
router.post('/verify-password', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.json({ success: false, error: 'Password required' });
  }

  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true, message: 'Password verified' });
  } else {
    return res.json({ success: false, error: 'Invalid password' });
  }
});

// Serve admin dashboard HTML
router.get('/dashboard', requireAdminPassword, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Admin API endpoints for dashboard
router.get('/api/submissions', requireAdminPassword, SubmissionController.getAllSubmissions);
router.get('/api/submissions/:id', requireAdminPassword, SubmissionController.getSubmissionById);
router.post('/api/submissions/:id/note', requireAdminPassword, SubmissionController.addNotes);

router.get('/api/referrals', requireAdminPassword, ReferralController.getAllReferrals);
router.get('/api/referrals/stats', requireAdminPassword, ReferralController.getReferralStats);
router.get('/api/referrals/:code/submissions', requireAdminPassword, ReferralController.getReferralSubmissions);
router.post('/api/referral-submissions/:id/validate', requireAdminPassword, ReferralController.validateReferralSubmission);
router.post('/api/referral-submissions/:id/unvalidate', requireAdminPassword, ReferralController.unvalidateReferralSubmission);
router.put('/api/referral-submissions/:id/notes', requireAdminPassword, ReferralController.updateReferralSubmissionNotes);

module.exports = router;
