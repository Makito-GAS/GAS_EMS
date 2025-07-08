// api/hr-agent.js
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/hr-agent', async (req, res) => {
  const { messages } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY; // Store your key in .env

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "google/gemini-2.5-pro",
      "messages": messages
    })
  });

  const data = await response.json();
  res.json(data);
});

export default router;