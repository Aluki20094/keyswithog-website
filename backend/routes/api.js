const express = require('express');
const router = express.Router();
const SubmissionController = require('../controllers/submissionController');
const ReferralController = require('../controllers/referralController');
const InventoryController = require('../controllers/inventoryController');

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

// ── Inventory ──
router.get('/inventory', InventoryController.getInventory);
router.get('/inventory/types', InventoryController.getVehicleTypes);
router.get('/inventory/:id', InventoryController.getVehicleById);
router.post('/sync-inventory', InventoryController.syncInventory); // admin - requires password
router.post('/inventory', InventoryController.addVehicle); // admin
router.put('/inventory/:id', InventoryController.updateVehicle); // admin
router.delete('/inventory/:id', InventoryController.deleteVehicle); // admin

module.exports = router;
