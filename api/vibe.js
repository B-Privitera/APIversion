import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const { vibeText } = req.body || {};
  if (!vibeText || vibeText.trim().length < 3) {
    return res.status(400).json({ error: "Missing or invalid vibeText" });
  }

  const prompt = `
You convert a music vibe description into recommendation settings for a demo song recommender app.

Return ONLY valid JSON with EXACT keys:
wBeat, wLyrics, wArtist, wGenre, obscurity

Rules:
- wBeat, wLyrics, wArtist, wGenre are integers from 0 to 100
- The four weights should sum to 100 (do your best)
- obscurity is an integer from 0 to 100
- No extra keys
- No commentary
- No markdown

Vibe: ${vibeText}
`;

  try {
    const response = await client.responses.create({
      model: "gpt-5",
      reasoning: { effort: "low" },
      input: prompt,
    });

    // Grab the raw text the model returned
    const text = response.output_text;

    let settings;
    try {
      settings = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text,
      });
    }

    return res.status(200).json({ settings });
  } catch (err) {
    return res.status(500).json({
      error: "AI request failed",
      details: String(err?.message || err),
    });
  }
}
