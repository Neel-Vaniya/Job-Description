exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          "GEMINI_API_KEY missing. Add it in Netlify → Environment variables → then redeploy.",
      }),
    };
  }

  let jd;
  try {
    ({ jd } = JSON.parse(event.body));
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request body." }),
    };
  }

  if (!jd || jd.trim().length < 40) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "JD too short. Paste full job description.",
      }),
    };
  }

  const prompt = `
You are a senior US IT recruitment analyst.

Return ONLY valid JSON.
No markdown.
No explanation.
No backticks.
No trailing commas.

{
  "jobTitle": "exact role title",
  "location": "location from JD or Remote",
  "duration": "contract duration or Fulltime",
  "summary": "2 sentences",
  "requiredOnly": [],
  "preferredOnly": [],
  "marketOnly": [],
  "reqAndPref": [],
  "reqAndMarket": [],
  "prefAndMarket": [],
  "allThree": [],
  "keyNotes": [
    {"title":"SHORT TITLE","detail":"insight"}
  ],
  "marketInsight": "2-3 sentences",
  "screeningChecklist": []
}

JD:
${jd}
`;

  const models = ["gemini-1.5-flash-latest"];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error:
              "Gemini API error: " +
              (data?.error?.message || "Check API key"),
          }),
        };
      }

      let raw =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!raw) continue;

      console.log("RAW GEMINI:", raw);

      // 🔥 CLEAN EVERYTHING
      raw = raw
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/^[^{]*/, "")
        .replace(/[^}]*$/, "")
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .trim();

      try {
  const parsed = JSON.parse(raw);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(parsed),
  };

} catch (err) {
  console.log("❌ JSON parse failed:", raw);

  // ✅ FALLBACK RESPONSE (prevents frontend crash)
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      jobTitle: "Analysis Failed",
      location: "N/A",
      duration: "N/A",
      summary: "AI returned an invalid format. Please try again.",
      requiredOnly: [],
      preferredOnly: [],
      marketOnly: [],
      reqAndPref: [],
      reqAndMarket: [],
      prefAndMarket: [],
      allThree: [],
      keyNotes: [
        {
          title: "Parsing Error",
          detail: "Gemini returned invalid JSON format.",
        },
      ],
      marketInsight: "Try again with a cleaner job description.",
      screeningChecklist: [],
    }),
  };
}
    } catch (e) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Server error: " + e.message,
        }),
      };
    }
  }

  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({
      error: "AI response parsing failed. Try again.",
    }),
  };
};
