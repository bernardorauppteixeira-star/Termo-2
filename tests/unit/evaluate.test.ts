import { describe, expect, it } from "vitest";
import { evaluateGuess } from "../../src/domain/evaluate";

describe("evaluateGuess", () => {
  it("marks exact positions before counting repeated letters", () => {
    expect(evaluateGuess("NABABA", "BANANA", "en")).toEqual([
      "present",
      "correct",
      "present",
      "correct",
      "absent",
      "correct",
    ]);
  });

  it("does not report more occurrences than the answer contains", () => {
    expect(evaluateGuess("LLAMA", "ALLEY", "en")).toEqual([
      "present",
      "correct",
      "present",
      "absent",
      "absent",
    ]);
  });

  it("treats Portuguese diacritics and cedilla as their base letters", () => {
    expect(evaluateGuess("ACAO", "AÇÃO", "pt-BR")).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
    expect(evaluateGuess("CACA", "CAÇA", "pt-BR")).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });
});
