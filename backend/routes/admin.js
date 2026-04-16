const express = require('express');
const router = express.Router();
const path = require('path');
const { parse: csvParse } = require('csv-parse/sync');
const SubmissionController = require('../controllers/submissionController');
const ReferralController = require('../controllers/referralController');
const InventoryController = require('../controllers/inventoryController');
const Inventory = require('../models/Inventory');

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

router.get('/api/inventory', InventoryController.getInventory);
router.post('/api/inventory/sync', requireAdminPassword, InventoryController.syncInventory);
router.post('/api/inventory', requireAdminPassword, InventoryController.addVehicle);
router.put('/api/inventory/:id', requireAdminPassword, InventoryController.updateVehicle);
router.delete('/api/inventory/:id', requireAdminPassword, InventoryController.deleteVehicle);

/**
 * POST /admin/api/inventory/import
 *
 * Bulk-import vehicles from a JSON array or a CSV file upload.
 *
 * JSON body  (Content-Type: application/json):
 *   { "vehicles": [ { vehicle_name, vehicle_type, price, tagline, highlights, image_url }, … ] }
 *
 * CSV body   (Content-Type: text/csv  OR  application/json with csv_data field):
 *   { "csv_data": "<csv string>" }
 *   Expected CSV columns (case-insensitive):
 *     vehicle_name (or name), vehicle_type (or type), price, tagline, highlights, image_url
 *   The "highlights" column may be a semicolon-separated list of features.
 *
 * Optional: { "replace_all": true } — clears existing inventory first (defaults to false).
 */
router.post('/api/inventory/import', requireAdminPassword, async (req, res) => {
  try {
    const { vehicles: jsonVehicles, csv_data, replace_all } = req.body;

    let toImport = [];

    if (csv_data) {
      // ── Parse CSV ──
      let records;
      try {
        records = csvParse(csv_data, {
          columns: true,          // first row = headers
          skip_empty_lines: true,
          trim: true,
        });
      } catch (parseErr) {
        return res.status(400).json({
          success: false,
          error: `CSV parse error: ${parseErr.message}`,
        });
      }

      toImport = records.map(row => {
        // Normalise all header names to lowercase once for case-insensitive lookup
        const lowerRow = Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, '_'), v])
        );
        const get = (...keys) => {
          for (const k of keys) {
            const val = lowerRow[k.toLowerCase().replace(/\s+/g, '_')];
            if (val && val.trim()) return val.trim();
          }
          return '';
        };

        const rawHighlights = get('highlights', 'features', 'Highlights');
        const highlights = rawHighlights
          ? rawHighlights.split(';').map(h => h.trim()).filter(Boolean)
          : [];

        return {
          vehicle_name: get('vehicle_name', 'name', 'Vehicle Name'),
          vehicle_type: get('vehicle_type', 'type', 'Vehicle Type') || 'suv',
          price: get('price', 'Price'),
          tagline: get('tagline', 'Tagline', 'description', 'Description'),
          highlights,
          image_url: get('image_url', 'image', 'Image URL'),
          source: 'csv-import',
        };
      }).filter(v => v.vehicle_name); // require at least a name

    } else if (Array.isArray(jsonVehicles)) {
      // ── JSON array ──
      toImport = jsonVehicles.map(v => ({
        vehicle_name: v.vehicle_name || v.name || '',
        vehicle_type: v.vehicle_type || v.type || 'suv',
        price: v.price || '',
        tagline: v.tagline || v.description || '',
        highlights: Array.isArray(v.highlights) ? v.highlights : [],
        image_url: v.image_url || v.image || '',
        source: 'json-import',
      })).filter(v => v.vehicle_name);

    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide either "vehicles" (JSON array) or "csv_data" (CSV string) in the request body.',
      });
    }

    if (toImport.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid vehicles found in the import data.',
      });
    }

    if (replace_all) {
      await Inventory.clearAndSync(toImport);
    } else {
      await Promise.all(toImport.map(vehicle => Inventory.create(vehicle)));
    }

    return res.json({
      success: true,
      message: `✅ Imported ${toImport.length} vehicle(s) successfully`,
      count: toImport.length,
    });
  } catch (error) {
    console.error('Error importing inventory:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to import inventory',
      details: error.message,
    });
  }
});

module.exports = router;
