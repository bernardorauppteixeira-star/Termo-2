import type { Language } from "./types";

export function normalizeWord(value: string, language: Language): string {
  const locale = language === "pt-BR" ? "pt-BR" : "en";
  const upper = value.normalize("NFC").toLocaleUpperCase(locale);

  if (language === "en") return upper;

  return upper.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
}

export function splitLettersFallback(value: string): string[] {
  return value.match(/\P{M}\p{M}*/gu) ?? [];
}

export function splitLetters(value: string): string[] {
  if (typeof Intl.Segmenter !== "function") return splitLettersFallback(value);
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return [...segmenter.segment(value)].map(({ segment }) => segment);
}

export function isAlphabeticWord(value: string): boolean {
  return /^\p{Script=Latin}+$/u.test(value);
}
