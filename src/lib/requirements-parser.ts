import { z } from "zod";

export type Requirement = {
  name: string;
  quantity: number;
  unit: string;
  variant: string | null;
};

const requirementSchema = z.object({
  name: z.string().trim().min(1).max(60),
  quantity: z.number().int().min(1).max(1000),
  unit: z.string().trim().min(1).max(24).default("piece"),
  variant: z.string().trim().max(60).nullable().optional(),
});

const numberWords: Record<string, number> = {
  a: 1, an: 1, one: 1, ek: 1, eka: 1,
  two: 2, do: 2, three: 3, teen: 3, tin: 3,
  four: 4, char: 4, chaar: 4, chaarh: 4,
  five: 5, paanch: 5, panch: 5,
  six: 6, cheh: 6, chhe: 6, saat: 7, seven: 7,
  aath: 8, eight: 8, nau: 9, nine: 9, das: 10, ten: 10,
};

const ignoredVariantWords = new Set([
  "bhai", "please", "pls", "need", "want", "get", "buy", "order", "some",
  "mujhe", "chahiye", "chaiye", "aur", "and", "or", "also", "of", "for",
  "to", "the", "a", "an", "ek", "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine", "ten", "piece", "pieces", "pack", "packs",
  "i", "me", "my", "we", "our", "can", "could", "you", "please", "add",
]);

const aliases: Array<{ alias: string; name: string }> = [
  { alias: "sticky notes", name: "sticky note" },
  { alias: "note books", name: "notebook" }, { alias: "notebooks", name: "notebook" }, { alias: "notebook", name: "notebook" },
  { alias: "highlighters", name: "highlighter" }, { alias: "highlighter", name: "highlighter" },
  { alias: "pencils", name: "pencil" }, { alias: "pencil", name: "pencil" },
  { alias: "markers", name: "marker" }, { alias: "marker", name: "marker" },
  { alias: "folders", name: "folder" }, { alias: "folder", name: "folder" },
  { alias: "erasers", name: "eraser" }, { alias: "eraser", name: "eraser" },
  { alias: "rulers", name: "ruler" }, { alias: "ruler", name: "ruler" },
  { alias: "bottles", name: "bottle" }, { alias: "bottle", name: "bottle" },
  { alias: "water bottles", name: "water bottle" }, { alias: "water bottle", name: "water bottle" },
  { alias: "chargers", name: "charger" }, { alias: "charger", name: "charger" },
  { alias: "tissues", name: "tissue" }, { alias: "tissue", name: "tissue" },
  { alias: "sanitizers", name: "sanitizer" }, { alias: "sanitizer", name: "sanitizer" },
  { alias: "notepads", name: "notepad" }, { alias: "notepad", name: "notepad" },
  { alias: "pens", name: "pen" }, { alias: "pen", name: "pen" },
  { alias: "papers", name: "paper" }, { alias: "paper", name: "paper" },
  { alias: "soaps", name: "soap" }, { alias: "soap", name: "soap" },
  { alias: "apples", name: "apple" }, { alias: "apple", name: "apple" },
  { alias: "oranges", name: "orange" }, { alias: "orange", name: "orange" },
  { alias: "bananas", name: "banana" }, { alias: "banana", name: "banana" },
  { alias: "tomatoes", name: "tomato" }, { alias: "tomato", name: "tomato" },
  { alias: "potatoes", name: "potato" }, { alias: "potato", name: "potato" },
  { alias: "onions", name: "onion" }, { alias: "onion", name: "onion" },
  { alias: "snacks", name: "snack" }, { alias: "snack", name: "snack" },
  { alias: "rice", name: "rice" }, { alias: "flour", name: "flour" }, { alias: "sugar", name: "sugar" },
  { alias: "coffee", name: "coffee" }, { alias: "tea", name: "tea" }, { alias: "water", name: "water" },
];

function unitFrom(value: string | undefined): string {
  const unit = (value ?? "piece").trim().toLowerCase();
  if (["pc", "pcs", "piece", "pieces", "item", "items"].includes(unit)) return "piece";
  if (["box", "boxes"].includes(unit)) return "box";
  if (["pack", "packs", "packet", "packets"].includes(unit)) return "pack";
  if (["kg", "kgs", "kilogram", "kilograms"].includes(unit)) return "kg";
  if (["g", "gram", "grams"].includes(unit)) return "g";
  if (["l", "litre", "litres", "liter", "liters"].includes(unit)) return "liter";
  if (["ml", "millilitre", "millilitres", "milliliter", "milliliters"].includes(unit)) return "ml";
  if (["dozen", "dozens"].includes(unit)) return "dozen";
  return /^[a-z][a-z -]{0,20}$/.test(unit) ? unit : "piece";
}

function quantityValue(token: string): number | undefined {
  if (/^\d{1,4}$/.test(token)) return Number(token);
  return numberWords[token.toLowerCase()];
}

const requestFillers = new Set([
  "i", "me", "my", "we", "our", "you", "please", "pls", "bhai", "need", "want", "wanted",
  "get", "buy", "order", "add", "put", "find", "bring", "send", "give", "can", "could", "would",
  "mujhe", "chahiye", "chaiye", "mere", "liye", "ke", "liya", "do", "kardo", "karna",
  "a", "an", "the", "some", "any", "of", "for", "to", "with", "and", "or", "aur", "also", "plus",
  "pack", "packs", "packet", "packets", "box", "boxes", "piece", "pieces", "pc", "pcs", "item", "items",
  "kg", "kgs", "kilogram", "kilograms", "g", "gram", "grams", "l", "litre", "litres", "liter", "liters", "ml",
  "hello", "hi", "nothing", "anything", "everything", "something", "stuff", "thing", "things", "advice", "help", "thanks", "thank", "for", "me", "u", "no", "not", "there", "is", "are",
]);
const productModifiers = new Set([
  "red", "blue", "green", "black", "white", "yellow", "pink", "purple", "orange", "brown", "grey", "gray",
  "small", "medium", "large", "big", "mini", "extra", "xl", "xxl", "new", "old", "fresh", "ripe",
  "wireless", "wired", "waterproof", "organic", "gluten", "free", "cotton", "wooden", "metal", "stainless",
]);
const unitTokens = new Set(["pc", "pcs", "piece", "pieces", "item", "items", "box", "boxes", "pack", "packs", "packet", "packets", "kg", "kgs", "kilogram", "kilograms", "g", "gram", "grams", "l", "litre", "litres", "liter", "liters", "ml", "dozen", "dozens"]);

function singularize(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && /(ches|shes|xes|zes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

function inferUnknownProducts(text: string, matches: Array<{ start: number; end: number }>): Requirement[] {
  const clauses = text.split(/[,;\n]+|\b(?:and|or|aur|plus)\b/i);
  const results: Requirement[] = [];
  let searchFrom = 0;
  for (const clause of clauses) {
    const start = text.indexOf(clause, searchFrom);
    if (start < 0) continue;
    searchFrom = start + clause.length;
    const end = start + clause.length;
    if (matches.some((match) => match.start < end && match.end > start)) continue;

    const tokens = clause.match(/[a-z0-9]+/g) ?? [];
    let quantity = 1;
    let foundQuantity = false;
    let unit = "piece";
    for (const token of tokens) {
      const candidate = quantityValue(token);
      if (!foundQuantity && candidate !== undefined) {
        quantity = candidate;
        foundQuantity = true;
      }
      if (unitTokens.has(token)) unit = unitFrom(token);
    }
    const productWords = tokens.filter((token) =>
      quantityValue(token) === undefined &&
      !requestFillers.has(token) &&
      !productModifiers.has(token) &&
      !unitTokens.has(token) &&
      !/^\d+$/.test(token),
    );
    if (productWords.length === 0 || quantity < 1 || quantity > 1000) continue;

    const modifiers = tokens.filter((token) => productModifiers.has(token));
    const name = productWords.slice(-3).map(singularize).join(" ").slice(0, 60);
    results.push({ name, quantity, unit, variant: modifiers.length ? modifiers.join(" ").slice(0, 60) : null });
  }
  return results;
}

export function normalizeExtracted(value: unknown): Requirement[] {
  const list = Array.isArray(value)
    ? value
    : value && typeof value === "object" && "items" in value && Array.isArray((value as { items: unknown }).items)
      ? (value as { items: unknown[] }).items
      : [];
  return list.map((entry) => {
    const parsed = requirementSchema.parse(entry);
    return {
      name: parsed.name.toLowerCase().replace(/\s+/g, " "),
      quantity: parsed.quantity,
      unit: unitFrom(parsed.unit),
      variant: parsed.variant?.trim().toLowerCase() || null,
    };
  });
}

/** Deterministic, dependency-free fallback for common English and Hinglish shopping phrases. */
export function parseRequirementsFallback(message: string): Requirement[] {
  const text = message.toLowerCase().replace(/[’']/g, " ").replace(/\b(?:don|doesn|didn)\s+t\b/g, " not ");
  const found: Array<{ start: number; end: number; name: string }> = [];
  for (const { alias, name } of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-z0-9])(${escaped})(?=$|[^a-z0-9])`, "g");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      const start = match.index + match[1].length;
      found.push({ start, end: start + match[2].length, name });
    }
  }

  found.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const nonOverlapping = found.filter((entry, index) =>
    !found.slice(0, index).some((previous) => entry.start < previous.end && entry.end > previous.start),
  );

  const knownItems = nonOverlapping.map((entry, index) => {
    const previousEnd = index > 0 ? nonOverlapping[index - 1].end : 0;
    const prefix = text.slice(Math.max(previousEnd, entry.start - 100), entry.start);
    const tokens = prefix.match(/[a-z0-9]+/g) ?? [];
    let quantityIndex = -1;
    let quantity = 1;
    for (let i = tokens.length - 1; i >= Math.max(0, tokens.length - 5); i--) {
      const candidate = quantityValue(tokens[i]);
      if (candidate !== undefined) {
        quantityIndex = i;
        quantity = candidate;
        break;
      }
    }
    const variantTokens = quantityIndex >= 0 ? tokens.slice(quantityIndex + 1) : tokens.slice(-2);
    const variant = variantTokens.filter((token) => !ignoredVariantWords.has(token) && quantityValue(token) === undefined).join(" ").trim();
    return { name: entry.name, quantity, unit: "piece", variant: variant || null };
  }).filter((item) => item.quantity >= 1 && item.quantity <= 1000);
  const inferredItems = inferUnknownProducts(text, nonOverlapping);
  return [...knownItems, ...inferredItems].sort((a, b) => {
    const aIndex = text.indexOf(a.name.split(" ")[0]);
    const bIndex = text.indexOf(b.name.split(" ")[0]);
    return aIndex - bIndex;
  });
}
