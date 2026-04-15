exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
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
        error: "Missing GEMINI_API_KEY in Netlify environment variables",
      }),
    };
  }

  let jd = "";

  try {
    const body =
      typeof event.body === "string"
        ? JSON.parse(event.body)
        : event.body;

    jd = body.jd || "";
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  if (!jd || jd.length < 30) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Please provide a valid job description",
      }),
    };
  }

  const prompt = `
Return ONLY valid JSON. No explanation. No markdown. No extra text.

{
  "jobTitle": "",
  "location": "",
  "duration": "",
  "summary": "",
  "requiredOnly": [],
  "preferredOnly": [],
  "marketOnly": [],
  "reqAndPref": [],
  "reqAndMarket": [],
  "prefAndMarket": [],
  "allThree": [],
  "keyNotes": [{"title":"","detail":""}],
  "marketInsight": "",
  "screeningChecklist": []
}

JD:
${jd}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );

    const data = await response.json();

    let raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("RAW GEMINI:", raw);

    // 🔥 CLEAN RESPONSE
    raw = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/^[^{]*/, "")
      .replace(/[^}]*$/, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      try {
        // 🛠 auto-fix common issues
        const fixed = raw
          .replace(/(\w+):/g, '"$1":')
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]");

        parsed = JSON.parse(fixed);
      } catch {
        // ✅ FINAL SAFE FALLBACK
        parsed = {
          jobTitle: "Analysis Failed",
          location: "N/A",
          duration: "N/A",
          summary:
            "AI returned an invalid format. Please try again.",
          requiredOnly: [],
          preferredOnly: [],
          marketOnly: [],
          reqAndPref: [],
          reqAndMarket: [],
          prefAndMarket: [],
          allThree: [],
          keyNotes: [
            {
              title: "Error",
              detail:
                "Gemini response could not be parsed into JSON.",
            },
          ],
          marketInsight: "",
          screeningChecklist: [],
        };
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Server error: " + err.message,
      }),
    };
  }
};
