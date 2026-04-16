const Inventory = require('../models/Inventory');
const { fetchDealershipInventory } = require('../config/claude');

class InventoryController {
  /**
   * Get all inventory, optionally filtered by type
   */
  static async getInventory(req, res) {
    try {
      const { type } = req.query;

      let vehicles;
      if (type) {
        vehicles = await Inventory.getByType(type);
      } else {
        vehicles = await Inventory.getAll();
      }

      // Format for frontend consumption
      const formattedVehicles = vehicles.map(v => ({
        id: v.id,
        name: v.vehicle_name,
        type: v.vehicle_type,
        tagline: v.tagline,
        description: v.description,
        highlights: v.highlights || [],
        price: v.price,
        image_url: v.image_url,
        created_at: v.created_at,
        updated_at: v.updated_at,
      }));

      return res.json({
        success: true,
        data: formattedVehicles,
        count: formattedVehicles.length,
      });
    } catch (error) {
      console.error('Error fetching inventory:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory',
      });
    }
  }

  /**
   * Get vehicle by ID
   */
  static async getVehicleById(req, res) {
    try {
      const { id } = req.params;

      const vehicle = await Inventory.getById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found',
        });
      }

      return res.json({
        success: true,
        data: {
          id: vehicle.id,
          name: vehicle.vehicle_name,
          type: vehicle.vehicle_type,
          tagline: vehicle.tagline,
          description: vehicle.description,
          highlights: vehicle.highlights || [],
          price: vehicle.price,
          image_url: vehicle.image_url,
        },
      });
    } catch (error) {
      console.error('Error fetching vehicle:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vehicle',
      });
    }
  }

  /**
   * Get vehicle types available
   */
  static async getVehicleTypes(req, res) {
    try {
      const types = await Inventory.getTypes();

      return res.json({
        success: true,
        data: types || [],
      });
    } catch (error) {
      console.error('Error fetching vehicle types:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch vehicle types',
      });
    }
  }

  /**
   * Sync inventory from dealership website using Claude
   */
  static async syncInventory(req, res) {
    try {
      const { password } = req.body;

      // Simple password check for triggering sync
      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      console.log('🔄 Starting inventory sync...');

      // Fetch inventory from dealership using Claude
      const fetchedInventory = await fetchDealershipInventory();

      if (fetchedInventory.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch inventory from dealership. Claude may have encountered an issue accessing the website.',
          hint: 'Try again later, or manually add vehicles.',
        });
      }

      // Clear old inventory and load new
      const count = await Inventory.clearAndSync(fetchedInventory);

      return res.json({
        success: true,
        message: `✅ Synced ${count} vehicles from AT Price Chevrolet`,
        count: count,
      });
    } catch (error) {
      console.error('Error syncing inventory:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to sync inventory',
        details: error.message,
      });
    }
  }

  /**
   * Manually add a vehicle (admin only)
   */
  static async addVehicle(req, res) {
    try {
      const { vehicle_name, vehicle_type, description, tagline, highlights, price, image_url } = req.body;

      if (!vehicle_name || !vehicle_type || !price) {
        return res.status(400).json({
          success: false,
          error: 'Please provide vehicle_name, vehicle_type, and price',
        });
      }

      const vehicle = await Inventory.create({
        vehicle_name,
        vehicle_type,
        description,
        tagline,
        highlights: Array.isArray(highlights) ? highlights : [],
        price,
        image_url,
        source: 'manual',
      });

      return res.status(201).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      console.error('Error adding vehicle:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to add vehicle',
      });
    }
  }

  /**
   * Update a vehicle (admin only)
   */
  static async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vehicle = await Inventory.update(id, updateData);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found',
        });
      }

      return res.json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      console.error('Error updating vehicle:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to update vehicle',
      });
    }
  }

  /**
   * Delete a vehicle (admin only)
   */
  static async deleteVehicle(req, res) {
    try {
      const { id } = req.params;

      const vehicle = await Inventory.delete(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found',
        });
      }

      return res.json({
        success: true,
        message: 'Vehicle deleted',
        data: vehicle,
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete vehicle',
      });
    }
  }
}

module.exports = InventoryController;
