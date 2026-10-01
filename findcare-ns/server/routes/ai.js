const express = require('express');
const router  = express.Router();

// POST /api/ai/search
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        max_tokens: 1000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role:    'system',
            content: 'You are a daycare search assistant for Nova Scotia, Canada. Return valid JSON only with exactly these fields: city (Nova Scotia city name or null), ageRange ("infant", "toddler", "preschool", or null), language ("English", "French", or null), maxPrice (monthly CAD number or null), features (comma-separated string or null), availableOnly (boolean; true only when availability is explicitly requested), and summary (one sentence). Use null for unspecified or ambiguous values. Do not invent requirements.'
          },
          {
            role:    'user',
            content: `Parse this natural language search query and extract search filters. Use the exact fields and types specified in the system instructions. The features value should contain only relevant program or facility keywords, excluding location, age, language, price, and availability.

Query: "${query}"`
          }
        ]
      })
    });

    const data = await response.json();
    console.log('Groq response:', JSON.stringify(data, null, 2));

    // Check for errors
    if (data.error) {
      console.error('Groq API error:', data.error);
      return res.status(500).json({ error: 'AI service error: ' + data.error.message });
    }

    const text    = data.choices[0].message.content;
    const cleaned = text.replace(/```json|```/g, '').trim();
    const filters = JSON.parse(cleaned);
    filters.availableOnly = /\b(?:available|availability|open spots?|spots? open|openings?|has space|accepting (?:new )?(?:children|kids|enrolments?|enrollments?))\b/i.test(query);

    res.json({ filters });

  } catch (err) {
    console.error('AI search error:', err);
    res.status(500).json({ error: 'AI search failed' });
  }
});

module.exports = router;