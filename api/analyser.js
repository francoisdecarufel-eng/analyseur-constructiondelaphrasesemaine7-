export default async function handler(req, res) {
  // Accepter uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prompt, systemInstruction, isJson } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'La clé GEMINI_API_KEY n\'est pas configurée dans Vercel.' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Le champ prompt est requis.' });
  }

  // Préparation du corps de la requête vers Gemini API
  const bodyData = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  // Ajout de la consigne système si présente
  if (systemInstruction) {
    bodyData.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  // Demande de réponse au format JSON si spécifié
  if (isJson) {
    bodyData.generationConfig = {
      responseMimeType: "application/json"
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'Erreur lors de la communication avec l\'API Gemini.' 
      });
    }

    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Envoi du résultat attendu par index.html
    return res.status(200).json({ resultat: textResult });

  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur : ' + error.message });
  }
}
