const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * Fetch and parse inventory from AT Price Chevrolet website
 */
async function fetchDealershipInventory() {
  try {
    console.log('🤖 Claude is visiting AT Price Chevrolet website...');

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a web scraper. Visit https://www.pricechevy.com/searchnew.aspx and extract the current vehicle inventory.

For each vehicle listed, extract:
1. Vehicle name (e.g., "2025 Chevrolet Silverado 1500")
2. Vehicle type (truck, suv, suv-full, compact, or sedan)
3. Price (in format "From $XX,XXX")
4. Short tagline/description
5. Key features/highlights (3-5 bullet points)
6. Image URL if available

Return the data as a JSON array with this structure:
[
  {
    "name": "Vehicle Name",
    "type": "truck|suv|suv-full|compact|sedan",
    "price": "From $36,900",
    "tagline": "Short description",
    "highlights": ["Feature 1", "Feature 2", "Feature 3"],
    "image_url": "https://..."
  }
]

Only return the JSON array, no other text. If you cannot access the website, return an empty array [].`,
        },
      ],
    });

    // Extract the text content
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) {
      throw new Error('No text response from Claude');
    }

    // Parse the JSON response
    let inventory;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        inventory = JSON.parse(jsonMatch[0]);
      } else {
        inventory = JSON.parse(textContent.text);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', textContent.text);
      return [];
    }

    console.log(`✅ Fetched ${inventory.length} vehicles from dealership`);
    return inventory;
  } catch (error) {
    console.error('❌ Error fetching inventory from Claude:', error.message);
    return [];
  }
}

/**
 * Generate a detailed vehicle description using Claude
 */
async function generateVehicleDescription(vehicleName, baseDescription) {
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Write a compelling 2-3 sentence marketing description for a ${vehicleName}.
          Keep it concise, friendly, and highlight what makes this vehicle special.
          Base description: ${baseDescription}
          Only return the description text, nothing else.`,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent ? textContent.text.trim() : baseDescription;
  } catch (error) {
    console.error('Error generating description:', error.message);
    return baseDescription;
  }
}

module.exports = {
  fetchDealershipInventory,
  generateVehicleDescription,
  client,
};
