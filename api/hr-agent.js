// api/hr-agent.js
export default async function handler(req, res) {
    const { messages } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;
  
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
    res.status(200).json(data);
  }