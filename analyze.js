exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: "GEMINI_API_KEY not set. Add it in Netlify → Site config → Environment variables." }),
    };
  }

  let jd;
  try { ({ jd } = JSON.parse(event.body)); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request." }) }; }

  if (!jd || jd.trim().length < 40)
    return { statusCode: 400, headers, body: JSON.stringify({ error: "JD too short. Paste the full job description." }) };

  const prompt = `You are a senior US IT recruitment analyst with 15+ years of experience. Analyze the following job description and return ONLY a valid JSON object — no markdown, no code fences, no extra text whatsoever.

JSON format:
{
  "jobTitle": "exact role title from JD",
  "location": "location from JD or Remote if not specified",
  "duration": "contract duration or Fulltime if permanent",
  "summary": "2 sentences: what the client truly needs AND the recruiter challenge in sourcing this profile in current US market",
  "requiredOnly": ["skill1","skill2","skill3","skill4","skill5"],
  "preferredOnly": ["skill1","skill2","skill3","skill4","skill5"],
  "marketOnly": ["skill1","skill2","skill3"],
  "reqAndPref": ["skill1","skill2","skill3"],
  "reqAndMarket": ["skill1","skill2"],
  "prefAndMarket": ["skill1","skill2"],
  "allThree": ["skill1","skill2"],
  "keyNotes": [
    {"title":"SHORT TITLE","detail":"1-2 sentence recruiter-actionable insight — screening tip, red flag, ATS keyword, sourcing strategy, or market reality"},
    {"title":"SHORT TITLE","detail":"..."},
    {"title":"SHORT TITLE","detail":"..."},
    {"title":"SHORT TITLE","detail":"..."},
    {"title":"SHORT TITLE","detail":"..."}
  ],
  "marketInsight": "2-3 sentences: current US market demand for this role, typical C2C/W2 hourly rate range, candidate availability and pool reality, location-specific notes if applicable",
  "screeningChecklist": ["Must-have 1","Must-have 2","Must-have 3","Must-have 4","Must-have 5"]
}

Definitions:
- requiredOnly: skills ONLY in the required/must-have section
- preferredOnly: skills ONLY in the preferred/nice-to-have section
- marketOnly: skills NOT in JD but commonly expected/screened for in US market for this role type
- reqAndPref: skills that bridge both required and preferred sections
- reqAndMarket: required skills that pair with strong market demand for related unlisted tools
- prefAndMarket: preferred skills currently trending hard in US hiring for this role
- allThree: 1-2 absolute golden skills — non-negotiable across all three categories in US market

Rules:
- Keep all skill labels SHORT — max 3 words
- Max 5 items per skill array
- keyNotes must be recruiter-actionable, not generic
- screeningChecklist = top 5 yes/no questions to ask candidate on first call
- Return ONLY the JSON object, nothing else

Job Description:
${jd}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || "Gemini API error";
      return { statusCode: response.status, headers, body: JSON.stringify({ error: msg }) };
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { statusCode: 500, headers, body: JSON.stringify({ error: "AI returned unexpected format. Please try again." }) };

    return { statusCode: 200, headers, body: match[0] };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error: " + err.message }) };
  }
};
