import { evaluateGuess } from "./evaluate";
import { isAlphabeticWord, normalizeWord, splitLetters } from "./normalize";
import { recordCompletedGame } from "./statistics";
import type {
  Game,
  Guess,
  Language,
  PersistedState,
  WordCycle,
  WordList,
} from "./types";

export const MAX_ATTEMPTS = 6;

export function createInitialState(): PersistedState {
  return {
    schemaVersion: 1,
    selectedLanguage: "pt-BR",
    games: {},
    statistics: {
      "pt-BR": {
        completedGames: 0,
        wins: 0,
        currentStreak: 0,
        bestStreak: 0,
        winsByGuessCount: [0, 0, 0, 0, 0, 0],
      },
      en: {
        completedGames: 0,
        wins: 0,
        currentStreak: 0,
        bestStreak: 0,
        winsByGuessCount: [0, 0, 0, 0, 0, 0],
      },
    },
    wordCycles: {
      "pt-BR": { remaining: [], lastAnswer: null },
      en: { remaining: [], lastAnswer: null },
    },
  };
}

export type GuessError = "finished" | "empty" | "characters" | "length" | "unknown";

export type SubmitGuessResult =
  | { ok: true; state: PersistedState; game: Game }
  | { ok: false; error: GuessError };

function shuffled(values: readonly string[], random: () => number): string[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function takeNextAnswer(
  list: WordList,
  cycle: WordCycle,
  language: Language,
  random: () => number = Math.random,
): { answer: string; cycle: WordCycle } {
  const available = new Set(list.answers);
  let remaining = cycle.remaining.filter((word) => available.has(word));
  let lastAnswer = cycle.lastAnswer && available.has(cycle.lastAnswer) ? cycle.lastAnswer : null;

  if (remaining.length === 0) {
    remaining = shuffled(list.answers, random);
    if (remaining.length > 1 && remaining.at(-1) === lastAnswer) {
      [remaining[0], remaining[remaining.length - 1]] = [
        remaining[remaining.length - 1],
        remaining[0],
      ];
    }
  }

  const answer = remaining.pop();
  if (!answer) throw new Error(`No answer words configured for ${language}.`);

  lastAnswer = answer;
  return {
    answer,
    cycle: { remaining, lastAnswer },
  };
}

export function startGame(
  state: PersistedState,
  language: Language,
  list: WordList,
  options: { random?: () => number; now?: () => number; id?: () => string } = {},
): PersistedState {
  const selection = takeNextAnswer(
    list,
    state.wordCycles[language],
    language,
    options.random,
  );
  const game: Game = {
    id: options.id?.() ?? crypto.randomUUID(),
    language,
    answer: selection.answer,
    wordLength: splitLetters(selection.answer).length,
    guesses: [],
    status: "in-progress",
    startedAt: options.now?.() ?? Date.now(),
  };

  return {
    ...state,
    selectedLanguage: language,
    games: { ...state.games, [language]: game },
    wordCycles: { ...state.wordCycles, [language]: selection.cycle },
  };
}

export function selectLanguage(
  state: PersistedState,
  language: Language,
): PersistedState {
  return { ...state, selectedLanguage: language };
}

export function submitGuess(
  state: PersistedState,
  rawGuess: string,
  validGuesses: ReadonlySet<string>,
  now: () => number = Date.now,
): SubmitGuessResult {
  const language = state.selectedLanguage;
  const game = state.games[language];
  if (!game || game.status !== "in-progress") return { ok: false, error: "finished" };

  const entered = rawGuess.normalize("NFC");
  if (!entered) return { ok: false, error: "empty" };
  if (!isAlphabeticWord(entered)) return { ok: false, error: "characters" };

  const normalized = normalizeWord(entered, language);
  if (splitLetters(normalized).length !== game.wordLength) {
    return { ok: false, error: "length" };
  }
  if (!validGuesses.has(normalized)) return { ok: false, error: "unknown" };

  const guess: Guess = {
    value: entered.toLocaleUpperCase(language === "pt-BR" ? "pt-BR" : "en"),
    results: evaluateGuess(entered, game.answer, language),
    submittedAt: now(),
  };
  const guesses = [...game.guesses, guess];
  const correct = guess.results.every((result) => result === "correct");
  const status = correct ? "won" : guesses.length === MAX_ATTEMPTS ? "lost" : "in-progress";
  const nextGame: Game = {
    ...game,
    guesses,
    status,
    ...(status === "in-progress" ? {} : { completedAt: now() }),
  };
  const nextState: PersistedState = {
    ...state,
    games: { ...state.games, [language]: nextGame },
    statistics:
      status === "in-progress"
        ? state.statistics
        : {
            ...state.statistics,
            [language]: recordCompletedGame(state.statistics[language], nextGame),
          },
  };

  return { ok: true, state: nextState, game: nextGame };
}

export function isGameActive(state: PersistedState, language: Language): boolean {
  return state.games[language]?.status === "in-progress";
}
