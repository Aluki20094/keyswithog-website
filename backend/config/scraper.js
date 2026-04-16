const axios = require('axios');
const cheerio = require('cheerio');

const DEALERSHIP_URL = 'https://www.pricechevy.com/searchnew.aspx';

// Maps common model keywords to the inventory vehicle_type values used by the site
const TYPE_MAP = [
  { keywords: ['silverado', 'colorado', 'canyon', 'pickup', 'truck'], type: 'truck' },
  { keywords: ['tahoe', 'suburban', 'yukon', 'escalade', 'navigator', 'expedition'], type: 'suv-full' },
  { keywords: ['equinox', 'traverse', 'blazer', 'trailblazer', 'terrain', 'suv', 'explorer', 'pilot'], type: 'suv' },
  { keywords: ['trax', 'encore', 'spark', 'sonic', 'hatchback', 'crossover', 'compact'], type: 'compact' },
  { keywords: ['malibu', 'impala', 'camaro', 'corvette', 'sedan', 'coupe'], type: 'sedan' },
];

/**
 * Infer vehicle type from its name
 */
function inferVehicleType(name) {
  const lower = name.toLowerCase();
  for (const entry of TYPE_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.type;
    }
  }
  return 'suv'; // fallback
}

/**
 * Normalize a price string to "From $XX,XXX" format.
 * Input may be "$36,900", "36900", "MSRP $36,900", etc.
 */
function normalizePrice(raw) {
  if (!raw) return null;
  const match = raw.replace(/,/g, '').match(/\d+/);
  if (!match) return raw.trim();
  const num = parseInt(match[0], 10);
  if (num < 1000) return raw.trim(); // not a real price
  return `From $${num.toLocaleString('en-US')}`;
}

/**
 * Fetch and parse inventory from AT Price Chevrolet.
 * Returns an array compatible with the Inventory model schema.
 */
async function fetchDealershipInventory() {
  console.log('🌐 Fetching inventory from AT Price Chevrolet...');

  let html;
  try {
    const response = await axios.get(DEALERSHIP_URL, {
      timeout: 30000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    html = response.data;
  } catch (err) {
    console.error('❌ Failed to fetch dealership page:', err.message);
    return [];
  }

  const $ = cheerio.load(html);
  const vehicles = [];

  // ── Strategy 1: structured vehicle card containers ──
  // Many dealership sites wrap each vehicle in an element with class names
  // like "vehicle-card", "inventory-item", "srp-item", "vehicle-tile", etc.
  const cardSelectors = [
    '.vehicle-card',
    '.inventory-item',
    '.srp-item',
    '.srp-list-item',
    '.vehicle-tile',
    '.inventory-listing',
    '.listing-item',
    '.vehicle',
    '[data-vehicle]',
    '[data-vin]',
    '.item-card',
  ];

  let found = false;
  for (const selector of cardSelectors) {
    const cards = $(selector);
    if (cards.length > 0) {
      console.log(`✅ Found ${cards.length} vehicles using selector: "${selector}"`);

      cards.each((_, el) => {
        const card = $(el);

        // Name — try common elements
        const nameEl =
          card.find('.vehicle-title, .title, h2, h3, h4, [class*="title"], [class*="name"]').first();
        const name =
          nameEl.text().trim() ||
          card.attr('data-title') ||
          card.attr('data-name') ||
          '';

        if (!name) return; // skip cards without a name

        // Price
        const priceEl = card.find(
          '.price, [class*="price"], [class*="msrp"], [class*="final-price"]'
        ).first();
        const rawPrice =
          priceEl.text().trim() || card.attr('data-price') || '';
        const price = normalizePrice(rawPrice) || 'Call for Pricing';

        // Image
        const imgEl = card.find('img').first();
        const imageUrl =
          imgEl.attr('data-src') ||
          imgEl.attr('src') ||
          card.attr('data-image') ||
          '';

        // Description / tagline
        const descEl = card.find(
          '.description, [class*="desc"], .tagline, [class*="tagline"]'
        ).first();
        const tagline = descEl.text().trim() || '';

        // Highlights — look for feature lists
        const highlights = [];
        card.find('ul li, .feature, [class*="feature"], [class*="highlight"]').each((_, li) => {
          const text = $(li).text().trim();
          if (text && highlights.length < 5) highlights.push(text);
        });

        vehicles.push({
          name,
          type: inferVehicleType(name),
          price,
          tagline: tagline || `${name} — available now at AT Price Chevrolet`,
          highlights,
          image_url: imageUrl,
          source: 'at-price-chevy',
        });
      });

      if (vehicles.length > 0) {
        found = true;
        break;
      }
    }
  }

  // ── Strategy 2: look for JSON-LD or embedded JSON inventory data ──
  if (!found) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const items = Array.isArray(data) ? data : [data];
        items.forEach(item => {
          if (item['@type'] === 'Car' || item['@type'] === 'Vehicle') {
            const name = item.name || '';
            if (!name) return;
            vehicles.push({
              name,
              type: inferVehicleType(name),
              price: normalizePrice(String(item.price || item.offers?.price || '')) || 'Call for Pricing',
              tagline: item.description || `${name} — available at AT Price Chevrolet`,
              highlights: [],
              image_url: item.image || item.offers?.image || '',
              source: 'at-price-chevy',
            });
          }
        });
      } catch (_) {
        // ignore parse errors
      }
    });
    if (vehicles.length > 0) found = true;
  }

  // ── Strategy 3: look for window.__INITIAL_STATE__ or similar JS data blobs ──
  if (!found) {
    $('script:not([src])').each((_, el) => {
      const src = $(el).html() || '';
      // Look for JSON arrays that contain vehicle-like objects
      const match = src.match(/window\.__[A-Z_]+\s*=\s*(\{[\s\S]*?\});/) ||
                    src.match(/var\s+inventoryData\s*=\s*(\[[\s\S]*?\]);/);
      if (!match) return;
      try {
        const data = JSON.parse(match[1]);
        const list = Array.isArray(data) ? data : (data.vehicles || data.inventory || []);
        list.forEach(item => {
          const name = item.name || item.title || item.vehicleName || '';
          if (!name) return;
          vehicles.push({
            name,
            type: inferVehicleType(name),
            price: normalizePrice(String(item.price || item.msrp || '')) || 'Call for Pricing',
            tagline: item.tagline || item.description || `${name} — available at AT Price Chevrolet`,
            highlights: item.highlights || item.features || [],
            image_url: item.image || item.imageUrl || item.image_url || '',
            source: 'at-price-chevy',
          });
        });
      } catch (_) {
        // ignore
      }
    });
  }

  console.log(`✅ Scraped ${vehicles.length} vehicles from AT Price Chevrolet`);
  return vehicles;
}

module.exports = { fetchDealershipInventory };
