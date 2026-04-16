const db = require('../config/database');

class Inventory {
  /**
   * Create a new vehicle listing
   */
  static async create(vehicleData) {
    const query = `
      INSERT INTO inventory
      (vehicle_name, vehicle_type, description, tagline, highlights, price, image_url, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      vehicleData.vehicle_name || vehicleData.name,
      vehicleData.vehicle_type || vehicleData.type,
      vehicleData.description,
      vehicleData.tagline,
      vehicleData.highlights || [],
      vehicleData.price,
      vehicleData.image_url,
      vehicleData.source || 'at-price-chevy',
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating inventory item:', error.message);
      throw error;
    }
  }

  /**
   * Get all inventory
   */
  static async getAll(filter = null) {
    let query = 'SELECT * FROM inventory ORDER BY updated_at DESC;';
    const values = [];

    if (filter && filter.type) {
      query = 'SELECT * FROM inventory WHERE vehicle_type = $1 ORDER BY updated_at DESC;';
      values.push(filter.type);
    }

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error fetching inventory:', error.message);
      throw error;
    }
  }

  /**
   * Get vehicle by ID
   */
  static async getById(id) {
    const query = 'SELECT * FROM inventory WHERE id = $1;';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching vehicle:', error.message);
      throw error;
    }
  }

  /**
   * Get vehicles by type (truck, suv, etc.)
   */
  static async getByType(type) {
    const query = 'SELECT * FROM inventory WHERE vehicle_type = $1 ORDER BY updated_at DESC;';

    try {
      const result = await db.query(query, [type]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching vehicles by type:', error.message);
      throw error;
    }
  }

  /**
   * Update a vehicle listing
   */
  static async update(id, vehicleData) {
    const query = `
      UPDATE inventory
      SET
        vehicle_name = COALESCE($1, vehicle_name),
        vehicle_type = COALESCE($2, vehicle_type),
        description = COALESCE($3, description),
        tagline = COALESCE($4, tagline),
        highlights = COALESCE($5, highlights),
        price = COALESCE($6, price),
        image_url = COALESCE($7, image_url),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `;

    const values = [
      vehicleData.vehicle_name || null,
      vehicleData.vehicle_type || null,
      vehicleData.description || null,
      vehicleData.tagline || null,
      vehicleData.highlights || null,
      vehicleData.price || null,
      vehicleData.image_url || null,
      id,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating vehicle:', error.message);
      throw error;
    }
  }

  /**
   * Delete a vehicle listing
   */
  static async delete(id) {
    const query = 'DELETE FROM inventory WHERE id = $1 RETURNING *;';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting vehicle:', error.message);
      throw error;
    }
  }

  /**
   * Clear all inventory and load fresh
   */
  static async clearAndSync(newInventory) {
    try {
      // Delete all existing inventory
      await db.query('DELETE FROM inventory;');

      // Insert new inventory
      for (const vehicle of newInventory) {
        await this.create(vehicle);
      }

      console.log(`✅ Synced ${newInventory.length} vehicles`);
      return newInventory.length;
    } catch (error) {
      console.error('Error syncing inventory:', error.message);
      throw error;
    }
  }

  /**
   * Get count of inventory
   */
  static async getCount() {
    const query = 'SELECT COUNT(*) FROM inventory;';

    try {
      const result = await db.query(query);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Error getting inventory count:', error.message);
      throw error;
    }
  }

  /**
   * Get vehicle types available
   */
  static async getTypes() {
    const query = 'SELECT DISTINCT vehicle_type FROM inventory WHERE vehicle_type IS NOT NULL;';

    try {
      const result = await db.query(query);
      return result.rows.map(row => row.vehicle_type);
    } catch (error) {
      console.error('Error fetching vehicle types:', error.message);
      throw error;
    }
  }
}

module.exports = Inventory;
