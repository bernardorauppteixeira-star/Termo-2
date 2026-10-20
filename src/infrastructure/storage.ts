import { createInitialState } from "../domain/game";
import { evaluateGuess } from "../domain/evaluate";
import { isAlphabeticWord, normalizeWord, splitLetters } from "../domain/normalize";
import type {
  Game,
  Language,
  LanguageStatistics,
  LetterResult,
  PersistedState,
  WordCycle,
} from "../domain/types";

const STORAGE_KEY = "termo2.state";
const languages: Language[] = ["pt-BR", "en"];
const statuses = new Set(["in-progress", "won", "lost"]);
const results = new Set<LetterResult>(["correct", "present", "absent"]);

export type StorageError = "unavailable" | "quota" | "unknown";
export type LoadResult =
  | { ok: true; state: PersistedState; hadData: boolean; recovered: boolean }
  | { ok: false; error: StorageError; state: PersistedState };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLanguage(value: unknown): value is Language {
  return value === "pt-BR" || value === "en";
}

function isStatistics(value: unknown): value is LanguageStatistics {
  return (
    isRecord(value) &&
    Number.isInteger(value.completedGames) && (value.completedGames as number) >= 0 &&
    Number.isInteger(value.wins) && (value.wins as number) >= 0 && (value.wins as number) <= (value.completedGames as number) &&
    Number.isInteger(value.currentStreak) && (value.currentStreak as number) >= 0 &&
    Number.isInteger(value.bestStreak) &&
    (value.bestStreak as number) >= (value.currentStreak as number) &&
    (value.bestStreak as number) <= (value.wins as number) &&
    (value.currentStreak as number) <= (value.wins as number) &&
    Array.isArray(value.winsByGuessCount) &&
    value.winsByGuessCount.length === 6 &&
    value.winsByGuessCount.every((count: unknown) => Number.isInteger(count) && (count as number) >= 0) &&
    value.winsByGuessCount.reduce((sum: number, count: number) => sum + count, 0) === value.wins
  );
}

function isCycle(value: unknown): value is WordCycle {
  return (
    isRecord(value) &&
    Array.isArray(value.remaining) &&
    value.remaining.every((word) => typeof word === "string") &&
    new Set(value.remaining).size === value.remaining.length &&
    (value.lastAnswer === null || typeof value.lastAnswer === "string") &&
    (value.lastAnswer === null || !value.remaining.includes(value.lastAnswer))
  );
}

function isGame(value: unknown, language: Language): value is Game {
  if (!isRecord(value)) return false;
  const maximumLength = language === "pt-BR" ? 8 : 7;
  if (
    value.language !== language ||
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    typeof value.answer !== "string" ||
    !Number.isInteger(value.wordLength) ||
    (value.wordLength as number) < 4 ||
    (value.wordLength as number) > maximumLength ||
    !isAlphabeticWord(value.answer.normalize("NFC")) ||
    splitLetters(normalizeWord(value.answer, language)).length !== value.wordLength ||
    !Array.isArray(value.guesses) ||
    value.guesses.length > 6 ||
    typeof value.startedAt !== "number" ||
    !Number.isFinite(value.startedAt) ||
    !statuses.has(String(value.status))
  ) return false;

  for (const guess of value.guesses) {
    if (
      !isRecord(guess) ||
      typeof guess.value !== "string" ||
      !isAlphabeticWord(guess.value.normalize("NFC")) ||
      splitLetters(normalizeWord(guess.value, language)).length !== value.wordLength ||
      typeof guess.submittedAt !== "number" ||
      !Number.isFinite(guess.submittedAt)
    ) {
      return false;
    }
    if (
      !Array.isArray(guess.results) ||
      guess.results.length !== value.wordLength ||
      !guess.results.every((result: unknown) => results.has(result as LetterResult)) ||
      JSON.stringify(guess.results) !== JSON.stringify(evaluateGuess(guess.value, value.answer, language))
    ) return false;
  }

  if (value.status === "in-progress" && value.guesses.length >= 6) return false;
  if (value.status === "won") {
    const lastGuess = value.guesses.at(-1);
    if (
      !isRecord(lastGuess) ||
      typeof lastGuess.value !== "string" ||
      !Array.isArray(lastGuess.results) ||
      !lastGuess.results.every((result: unknown) => result === "correct") ||
      normalizeWord(lastGuess.value, language) !== normalizeWord(value.answer, language)
    ) return false;
    if (value.guesses.slice(0, -1).some((guess) => guess.results.every((result: unknown) => result === "correct"))) {
      return false;
    }
  }
  if (
    value.status === "lost" &&
    (value.guesses.length !== 6 || value.guesses.some((guess) => guess.results.every((result: unknown) => result === "correct")))
  ) return false;
  if (value.status === "in-progress" && value.guesses.some((guess) => guess.results.every((result: unknown) => result === "correct"))) {
    return false;
  }
  if (value.status !== "in-progress" && (typeof value.completedAt !== "number" || !Number.isFinite(value.completedAt))) {
    return false;
  }
  return true;
}

export function parsePersistedState(value: unknown): PersistedState | null {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isLanguage(value.selectedLanguage)) return null;
  if (!isRecord(value.games) || !isRecord(value.statistics) || !isRecord(value.wordCycles)) return null;

  const state = createInitialState();
  for (const language of languages) {
    const game = value.games[language];
    if (game !== undefined) {
      if (!isGame(game, language)) return null;
      state.games[language] = game;
    }
    if (!isStatistics(value.statistics[language]) || !isCycle(value.wordCycles[language])) return null;
    state.statistics[language] = value.statistics[language];
    state.wordCycles[language] = value.wordCycles[language];
  }
  state.selectedLanguage = value.selectedLanguage;
  return state;
}

function storageError(error: unknown): StorageError {
  if (error instanceof DOMException && error.name === "QuotaExceededError") return "quota";
  if (error instanceof DOMException && error.name === "SecurityError") return "unavailable";
  return "unknown";
}

export function loadState(): LoadResult {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { ok: true, state: createInitialState(), hadData: false, recovered: false };
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: true, state: createInitialState(), hadData: true, recovered: true };
    }
    const state = parsePersistedState(parsed);
    return state
      ? { ok: true, state, hadData: true, recovered: false }
      : { ok: true, state: createInitialState(), hadData: true, recovered: true };
  } catch (error) {
    return { ok: false, error: storageError(error), state: createInitialState() };
  }
}

export function saveState(state: PersistedState): { ok: true } | { ok: false; error: StorageError } {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: storageError(error) };
  }
}

export function isSupportedLanguage(value: unknown): value is Language {
  return isLanguage(value);
}
