import { describe, expect, it } from "vitest";
import { createInitialState, startGame, submitGuess, takeNextAnswer } from "../../src/domain/game";
import { emptyStatistics } from "../../src/domain/statistics";
import type { WordList } from "../../src/domain/types";
import { wordLists } from "../../src/data/wordLists";

describe("game flow", () => {
  it("accepts Portuguese dictionary words outside the curated guess list", () => {
    const answerList: WordList = {
      answers: ["MISTURA"],
      validGuesses: new Set(["MISTURA"]),
      minLength: 7,
      maxLength: 7,
    };
    const state = startGame(createInitialState(), "pt-BR", answerList, {
      id: () => "game-dictionary",
      now: () => 10,
      random: () => 0,
    });

    const result = submitGuess(state, "ABOBORA", wordLists["pt-BR"].validGuesses);

    expect(result.ok).toBe(true);
  });

  it("continues to reject English words outside the curated guess list", () => {
    const list: WordList = {
      answers: ["APPLE"],
      validGuesses: new Set(["APPLE"]),
      minLength: 5,
      maxLength: 5,
    };
    const state = startGame(createInitialState(), "en", list, {
      id: () => "game-english-list",
      now: () => 10,
      random: () => 0,
    });

    expect(submitGuess(state, "ZEBRA", list.validGuesses)).toEqual({
      ok: false,
      error: "unknown",
    });
  });

  it("rejects invalid guesses without using an attempt", () => {
    let state = startGame(createInitialState(), "pt-BR", wordLists["pt-BR"], {
      id: () => "game-1",
      now: () => 10,
      random: () => 0,
    });
    const initialGame = state.games["pt-BR"]!;

    expect(submitGuess(state, "AB", wordLists["pt-BR"].validGuesses)).toEqual({
      ok: false,
      error: "length",
    });
    expect(submitGuess(state, "CASA!", wordLists["pt-BR"].validGuesses)).toEqual({
      ok: false,
      error: "characters",
    });
    state = {
      ...state,
      selectedLanguage: "pt-BR",
      games: { ...state.games, "pt-BR": initialGame },
    };
    expect(state.games["pt-BR"]?.guesses).toHaveLength(0);
  });

  it("records a win once and increments the matching guess distribution", () => {
    const state = startGame(createInitialState(), "en", wordLists.en, {
      id: () => "game-win",
      now: () => 50,
      random: () => 0,
    });
    const answer = state.games.en!.answer;
    const result = submitGuess(state, answer.toLowerCase(), wordLists.en.validGuesses, () => 60);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.game.status).toBe("won");
    expect(result.state.statistics.en).toEqual({
      completedGames: 1,
      wins: 1,
      currentStreak: 1,
      bestStreak: 1,
      winsByGuessCount: [1, 0, 0, 0, 0, 0],
    });
    expect(submitGuess(result.state, answer, wordLists.en.validGuesses).ok).toBe(false);
  });

  it("ends a game after six valid misses and resets the streak", () => {
    const answers = ["APPLE", "BREAD"] as const;
    const list: WordList = {
      answers,
      validGuesses: new Set(answers),
      minLength: 5,
      maxLength: 5,
    };
    let state = createInitialState();
    state.statistics.en = { ...emptyStatistics(), currentStreak: 3, bestStreak: 4 };
    state = startGame(state, "en", list, { id: () => "game-loss", now: () => 1, random: () => 0 });
    const game = state.games.en!;
    const wrong = game.answer === "APPLE" ? "BREAD" : "APPLE";
    for (let index = 0; index < 6; index += 1) {
      const result = submitGuess(state, wrong, list.validGuesses, () => index + 2);
      expect(result.ok).toBe(true);
      if (result.ok) state = result.state;
    }

    expect(state.games.en?.status).toBe("lost");
    expect(state.statistics.en.completedGames).toBe(1);
    expect(state.statistics.en.currentStreak).toBe(0);
    expect(state.statistics.en.wins).toBe(0);
    expect(submitGuess(state, wrong, list.validGuesses).ok).toBe(false);
  });

  it("cycles through every answer before repeating and avoids the previous cycle's last word", () => {
    const list: WordList = {
      answers: ["A", "B", "C"],
      validGuesses: new Set(["A", "B", "C"]),
      minLength: 1,
      maxLength: 1,
    };
    let cycle = { remaining: [] as string[], lastAnswer: null as string | null };
    const first = takeNextAnswer(list, cycle, "en", () => 0);
    cycle = first.cycle;
    const second = takeNextAnswer(list, cycle, "en", () => 0);
    cycle = second.cycle;
    const third = takeNextAnswer(list, cycle, "en", () => 0);
    cycle = third.cycle;
    const nextCycle = takeNextAnswer(list, cycle, "en", () => 0);

    expect(new Set([first.answer, second.answer, third.answer]).size).toBe(3);
    expect(nextCycle.answer).not.toBe(third.answer);
  });
});

describe("word list integrity", () => {
  it.each([
    ["pt-BR", wordLists["pt-BR"]],
    ["en", wordLists.en],
  ] as const)("keeps %s answers unique and within configured lengths", (_, list) => {
    expect(new Set(list.answers).size).toBe(list.answers.length);
    expect(list.answers.length).toBeGreaterThan(0);
    expect(list.answers.every((word) => word.length >= list.minLength && word.length <= list.maxLength)).toBe(true);
    expect(list.answers.every((word) => list.validGuesses.has(word.normalize("NFD").replace(/\p{M}/gu, "")) || list.validGuesses.has(word))).toBe(true);
  });

  it("includes words from the offline Portuguese dictionary", () => {
    const guesses = wordLists["pt-BR"].validGuesses;

    expect(guesses.has("ABOBORA")).toBe(true);
    expect(guesses.has("XICARA")).toBe(true);
    expect(guesses.has("FOSFORO")).toBe(true);
    expect(guesses.size).toBeGreaterThan(80_000);
  });
});
