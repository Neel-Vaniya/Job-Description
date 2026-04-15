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
      body: JSON.stringify({ error: "GEMINI_API_KEY missing. Go to Netlify → Site configuration → Environment variables → add GEMINI_API_KEY then redeploy." }),
    };
  }

  let jd;
  try { ({ jd } = JSON.parse(event.body)); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request body." }) }; }

  if (!jd || jd.trim().length < 40)
    return { statusCode: 400, headers, body: JSON.stringify({ error: "JD too short. Paste the full job description." }) };

  const prompt = `You are a senior US IT recruitment analyst. Analyze the job description below.
Return ONLY a raw JSON object. No markdown. No backticks. No code fences. No explanation before or after. Start your response with { and end with }.

{
  "jobTitle": "exact role title",
  "location": "location from JD or Remote",
  "duration": "contract duration or Fulltime",
  "summary": "2 sentences: what client needs AND recruiter sourcing challenge",
  "requiredOnly": ["max 5 skills from required section only, max 3 words each"],
  "preferredOnly": ["max 5 skills from preferred section only, max 3 words each"],
  "marketOnly": ["max 3 skills NOT in JD but expected in US market for this role"],
  "reqAndPref": ["max 3 skills bridging both required and preferred"],
  "reqAndMarket": ["max 2 required skills that pair strongly with market demand"],
  "prefAndMarket": ["max 2 preferred skills trending in US market for this role"],
  "allThree": ["1-2 golden skills non-negotiable across all three categories"],
  "keyNotes": [
    {"title":"SHORT TITLE","detail":"recruiter-actionable insight"},
    {"title":"SHORT TITLE","detail":"recruiter-actionable insight"},
    {"title":"SHORT TITLE","detail":"recruiter-actionable insight"},
    {"title":"SHORT TITLE","detail":"recruiter-actionable insight"},
    {"title":"SHORT TITLE","detail":"recruiter-actionable insight"}
  ],
  "marketInsight": "2-3 sentences: US demand, C2C/W2 rate range, candidate pool reality",
  "screeningChecklist": ["Question 1?","Question 2?","Question 3?","Question 4?","Question 5?"]
}

JD to analyze:
${jd}`;

  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.0-pro"];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (model === models[models.length - 1]) {
          return { statusCode: 500, headers, body: JSON.stringify({ error: "Gemini API error: " + (data?.error?.message || "Check your API key.") }) };
        }
        continue;
      }

      let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!raw) continue;

      raw = raw.trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) continue;

      try {
        JSON.parse(match[0]);
        return { statusCode: 200, headers, body: match[0] };
      } catch { continue; }

    } catch (e) {
      if (model === models[models.length - 1]) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error: " + e.message }) };
      }
    }
  }

  return { statusCode: 500, headers, body: JSON.stringify({ error: "All models failed. Please check your GEMINI_API_KEY in Netlify environment variables." }) };
};
