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
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [
          {
            role:    'system',
            content: 'You are a daycare search assistant for Nova Scotia, Canada. Always respond with valid JSON only — no explanation, no markdown, just raw JSON.'
          },
          {
            role:    'user',
            content: `Parse this natural language search query and extract search filters.
Respond ONLY with a JSON object with these fields:
- city (string — Nova Scotia city name)
- ageGroup (string — "infant", "toddler", or "preschool")
- language (string — "English" or "French")
- maxPrice (number — monthly price ceiling in CAD)
- openBefore (string — opening time e.g. "7:30am")
- features (string — any special features mentioned)
- summary (string — one sentence summary of what was searched)

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

    res.json({ filters });

  } catch (err) {
    console.error('AI search error:', err);
    res.status(500).json({ error: 'AI search failed' });
  }
});

module.exports = router;