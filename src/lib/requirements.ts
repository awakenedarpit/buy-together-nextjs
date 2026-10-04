import type { Requirement } from "./requirements-parser";
import { normalizeExtracted, parseRequirementsFallback } from "./requirements-parser";

export type { Requirement } from "./requirements-parser";
export { parseRequirementsFallback } from "./requirements-parser";

async function extractWithGemini(message: string): Promise<Requirement[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("AI provider is not configured");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(8_000),
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `Extract purchase requirements from this message. Understand English and Hinglish. Return only JSON as an array with objects {"name":"lowercase singular item name","quantity":1,"unit":"piece","variant":null}. Use a positive integer quantity (default 1), singular units when possible, and null for no variant. Do not invent items. Message: ${JSON.stringify(message)}` }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    }),
  });
  if (!response.ok) throw new Error(`AI service returned ${response.status}`);
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!raw) throw new Error("AI response was empty");
  const json = raw.startsWith("[") || raw.startsWith("{") ? raw : raw.match(/[\[{][\s\S]*[\]}]/)?.[0];
  if (!json) throw new Error("AI response was not structured JSON");
  return normalizeExtracted(JSON.parse(json));
}

/** Provider abstraction: try Gemini when configured, and always fall back to the local parser. */
export async function extractRequirements(message: string): Promise<Requirement[]> {
  const clean = message.trim();
  if (!clean) return [];
  if (process.env.GEMINI_API_KEY) {
    try {
      const items = await extractWithGemini(clean);
      if (items.length > 0) return items;
    } catch {
      // AI is best-effort: preserve the always-available local demo path.
    }
  }
  return parseRequirementsFallback(clean);
}
