const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * Inventory scraping has been removed in favor of the embedded dealership iframe.
 */
async function fetchDealershipInventory() {
  throw new Error('Inventory scraping is no longer supported.');
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
