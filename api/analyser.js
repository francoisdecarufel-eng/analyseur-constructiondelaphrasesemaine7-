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

  // Directives pédagogiques strictes pour la grammaire du 2e cycle du primaire au Québec
  const defaultSystemInstruction = `Tu es un expert en linguistique et en pédagogie de la grammaire rénovée (MÉQ / PFEQ - 2e cycle du primaire au Québec).

RÈGLES D'ANALYSE GRAMMATICALE STRICTES :
1. SUJET (GS) : Groupe obligatoire de qui ou quoi on parle.
   - Validation par encadrement : "C'est... qui" ou "Ce sont... qui".
   - Rôle JSON : "sujet".

2. PRÉDICAT (GV) : Contient le verbe conjugué ET ses compléments essentiels non effaçables/non déplaçables.
   - Découpage pour la manipulation : 
     * Verbe conjugué -> Rôle JSON : "verbe"
     * Groupe du nom/complément direct ou indirect -> Rôle JSON : "gn_predicat"
     * Expansion du verbe/adverbe -> Rôle JSON : "expansion_predicat"

3. COMPLÉMENT DE PHRASE (CP) : Groupe facultatif (temps, lieu, manière).
   - Validation : peut être effacé et déplacé.
   - Rôle JSON : "complement".

4. CORRECTION ORTHOGRAPHIQUE :
   - Analyse chaque mot ("text"). Si l'élève fait une faute (ex: "sitroulle", "aim"), place le mot corrigé ("citrouilles", "aiment") dans le champ "fixed".

FORMAT DE RÉPONSE : Réponds STRICTEMENT en JSON valide.`;

  const bodyData = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{ text: systemInstruction || defaultSystemInstruction }]
    }
  };

  if (isJson) {
    bodyData.generationConfig = {
      responseMimeType: "application/json",
      temperature: 0.2 // Température basse pour une précision grammaticale maximale
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
        error: data.error?.message || 'Erreur lors de la communication avec Gemini.' 
      });
    }

    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ resultat: textResult });

  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur : ' + error.message });
  }
}
