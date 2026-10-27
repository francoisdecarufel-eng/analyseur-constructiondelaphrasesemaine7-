export default async function handler(req, res) {
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

  // Directives avancées avec EXEMPLE D'APPRENTISSAGE (Few-Shot) pour forcer la correction
  const defaultSystemInstruction = `Tu es un spécialiste en orthographe et en linguistique (programme de grammaire rénovée du 2e cycle du primaire au Québec - MÉQ).

TA MISSION PRINCIPALE :
1. Analyser chaque mot de la phrase fournie.
2. Détecter TOUTES les fautes d'orthographe, d'accord (genre/nombre) ou de conjugaison.
3. Placer la version PARFAITEMENT CORRIGÉE de chaque mot dans le champ "fixed".
4. Attribuer le bon rôle syntaxique pour la manipulation : "sujet", "verbe", "gn_predicat", "expansion_predicat", "complement".

EXEMPLE EXPLICITE DE CORRECTION :
Si l'entrée est : "Les enfant aim les sitroulle"
Tu dois retourner :
{
  "tokens": [
    { "text": "Les", "fixed": "Les", "syntaxRole": "sujet" },
    { "text": "enfant", "fixed": "enfants", "syntaxRole": "sujet" },
    { "text": "aim", "fixed": "aiment", "syntaxRole": "verbe" },
    { "text": "les", "fixed": "les", "syntaxRole": "gn_predicat" },
    { "text": "sitroulle", "fixed": "citrouilles", "syntaxRole": "gn_predicat" }
  ],
  "missingElement": "none",
  "missingExplanation": null,
  "suggestions": null,
  "complementLogique": { "texte": "dans le potager", "explication": "Ajout d'un complément de lieu." },
  "optionsEmbellissement": [
    { "texte": "charnues et orangées", "type": "expansion" },
    { "texte": "avec grand plaisir", "type": "complement" }
  ]
}

Réponds STRICTEMENT sous forme d'objet JSON valide.`;

  const bodyData = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{ text: systemInstruction || defaultSystemInstruction }]
    }
  };

  if (isJson) {
    bodyData.generationConfig = {
      responseMimeType: "application/json",
      temperature: 0.1 // Température très basse pour garantir la rigueur orthographique
    };
  }

  try {
    // Utilisation de gemini-1.5-pro au lieu de gemini-1.5-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'Erreur lors de la communication avec Gemini.' 
      });
    }

    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ resultat: textResult });

  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur : ' + error.message });
  }
}
