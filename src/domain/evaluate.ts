import type { Language, LetterResult } from "./types";
import { normalizeWord, splitLetters } from "./normalize";

export function evaluateGuess(
  guess: string,
  answer: string,
  language: Language,
): LetterResult[] {
  const guessLetters = splitLetters(normalizeWord(guess, language));
  const answerLetters = splitLetters(normalizeWord(answer, language));
  const results: LetterResult[] = Array(guessLetters.length).fill("absent");
  const remaining = new Map<string, number>();

  for (let index = 0; index < answerLetters.length; index += 1) {
    if (guessLetters[index] === answerLetters[index]) {
      results[index] = "correct";
    } else {
      const letter = answerLetters[index];
      remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
    }
  }

  for (let index = 0; index < guessLetters.length; index += 1) {
    if (results[index] === "correct") continue;
    const count = remaining.get(guessLetters[index]) ?? 0;
    if (count > 0) {
      results[index] = "present";
      remaining.set(guessLetters[index], count - 1);
    }
  }

  return results;
}
