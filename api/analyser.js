export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { prompt, systemInstruction, isJson } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "La clé API GEMINI_API_KEY n'est pas configurée dans Vercel." });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (isJson) {
      payload.generationConfig = { responseMimeType: "application/json" };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      return res.status(500).json({ error: "Réponse invalide reçue de Gemini", details: data });
    }

    const resultat = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ resultat });

  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur lors de la communication avec l'API Gemini." });
  }
}
