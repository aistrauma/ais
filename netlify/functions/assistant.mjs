/* Serverless proxy to the Gemini API. The GOOGLE_AI_KEY lives in Netlify
   environment variables and never reaches the browser. */

const SYSTEM = `You are the built-in assistant of the "AIS 2008 Trauma Reference", a coding and documentation reference used by trauma surgeons and residents.

Scope — you help with:
- Example operative/procedure notes for trauma and general surgery procedures (chest tubes, central lines, ex-lap, trach, etc.)
- AIS 2008 coding questions (codes, severity, OIS grade mapping, coding rules)
- TQIP/NTDS documentation phrasing (PECs, RAVs, PMEs, comorbidity wording that earns registry credit)
- Trauma H&P, review of systems, and physical exam documentation

Rules:
- Produce GENERIC educational examples. Never invent or repeat patient identifiers; if the user includes what looks like PHI (names, MRNs, dates of birth), do not repeat it — use placeholders like [PATIENT] and remind them not to submit PHI.
- Use bracketed placeholders for variables: [side], [size Fr], [indication], [EBL].
- Be concise and use plain formatting: short headers, line breaks, no markdown tables. Notes should look like real EMR notes.
- For AIS coding answers, cite the code and severity (e.g. 450203.3, AIS 3) and remind the user to confirm against the source page in this app.
- If asked something outside trauma/surgical documentation and coding, say briefly that you're scoped to trauma documentation and suggest what you can help with.
- End procedure note examples with one line: "Example only — verify against your institution's requirements."`;

/* The site is also served from GitHub Pages, which calls this function cross-origin. */
const ALLOWED_ORIGINS = ["https://aistrauma.github.io"];
const corsHeaders = (req) => {
  const origin = req.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(origin)
    ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type" }
    : {};
};

const json = (obj, status, cors) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...cors } });

/* Best-effort per-instance rate limit (resets on cold start). */
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60_000);
  if (arr.length >= 8) return true;
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

export default async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405, cors);

  // GOOGLE_AI_KEY is Zach's own key (aistudio.google.com). We deliberately avoid the
  // GEMINI_API_KEY name because Netlify's AI Gateway auto-injects a value there that
  // doesn't work against the Google API directly.
  const key = process.env.GOOGLE_AI_KEY;
  if (!key) {
    return json({ error: "The AI assistant isn't configured yet — a GOOGLE_AI_KEY needs to be added in the Netlify environment settings." }, 503, cors);
  }

  const ip = req.headers.get("x-nf-client-connection-ip") || "unknown";
  if (limited(ip)) return json({ error: "Slow down a little — max 8 requests per minute." }, 429, cors);

  let prompt = "";
  try {
    const body = await req.json();
    prompt = String(body.prompt || "").slice(0, 4000);
  } catch (e) { /* fall through */ }
  if (!prompt.trim()) return json({ error: "Empty prompt" }, 400, cors);

  const upstream = await fetch(
    // "gemini-flash-latest" is Google's evergreen alias for the current stable Flash
    // model — pinned versions get retired for new API keys (2.5-flash already was).
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
      })
    }
  );

  const data = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const msg = data?.error?.message || `Upstream AI error (${upstream.status})`;
    const friendly = upstream.status === 429
      ? "The free AI quota is used up for now — try again in a minute (per-minute limit) or tomorrow (daily limit)."
      : msg;
    return json({ error: friendly }, 502, cors);
  }

  const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
  if (!text) return json({ error: "The model returned an empty response — try rephrasing." }, 502, cors);
  return json({ text }, 200, cors);
};
