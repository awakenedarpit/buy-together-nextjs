import { describe, expect, it } from "vitest";
import { extractRequirements, parseRequirementsFallback } from "./requirements";

describe("purchase requirement extraction fallback", () => {
  it("parses the primary Hinglish hackathon demo exactly", () => {
    expect(parseRequirementsFallback("bhai 2 notebook aur ek blue pen")).toEqual([
      { name: "notebook", quantity: 2, unit: "piece", variant: null },
      { name: "pen", quantity: 1, unit: "piece", variant: "blue" },
    ]);
  });

  it("parses English quantities, size/color variants, and plural item names", () => {
    expect(parseRequirementsFallback("Need 5 A4 notebooks and 3 black pens")).toEqual([
      { name: "notebook", quantity: 5, unit: "piece", variant: "a4" },
      { name: "pen", quantity: 3, unit: "piece", variant: "black" },
    ]);
  });

  it("understands common Hindi number words and defaults omitted quantities to one", () => {
    expect(parseRequirementsFallback("mujhe do notebook aur chaar pencil chahiye")).toEqual([
      { name: "notebook", quantity: 2, unit: "piece", variant: null },
      { name: "pencil", quantity: 4, unit: "piece", variant: null },
    ]);
    expect(parseRequirementsFallback("blue pen")).toEqual([
      { name: "pen", quantity: 1, unit: "piece", variant: "blue" },
    ]);
  });

  it("ignores unsupported text and invalid quantities", () => {
    expect(parseRequirementsFallback("hello, nothing to buy")).toEqual([]);
    expect(parseRequirementsFallback("0 notebooks and 1001 pens")).toEqual([]);
  });

  it("infers products outside the curated alias list", () => {
    expect(parseRequirementsFallback("please get 2 laptops and 1 wireless mouse")).toEqual([
      { name: "laptop", quantity: 2, unit: "piece", variant: null },
      { name: "mouse", quantity: 1, unit: "piece", variant: "wireless" },
    ]);
    expect(parseRequirementsFallback("mujhe do yoga mats aur ek red suitcase chahiye")).toEqual([
      { name: "yoga mat", quantity: 2, unit: "piece", variant: null },
      { name: "suitcase", quantity: 1, unit: "piece", variant: "red" },
    ]);
    expect(parseRequirementsFallback("2 packs of socks")).toEqual([
      { name: "sock", quantity: 2, unit: "pack", variant: null },
    ]);
  });

  it("does not turn a generic greeting or empty shopping intent into an item", () => {
    expect(parseRequirementsFallback("Hello, I don't need anything")).toEqual([]);
    expect(parseRequirementsFallback("Can you help me please?")).toEqual([]);
  });

  it("keeps the provider path operational without an API key", async () => {
    const previous = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      expect(await extractRequirements("3 notebook")).toEqual([
        { name: "notebook", quantity: 3, unit: "piece", variant: null },
      ]);
    } finally {
      if (previous) process.env.GEMINI_API_KEY = previous;
    }
  });
});
