import type { Game, LanguageStatistics } from "./types";

export function emptyStatistics(): LanguageStatistics {
  return {
    completedGames: 0,
    wins: 0,
    currentStreak: 0,
    bestStreak: 0,
    winsByGuessCount: [0, 0, 0, 0, 0, 0],
  };
}

export function recordCompletedGame(
  statistics: LanguageStatistics,
  game: Game,
): LanguageStatistics {
  if (game.status === "in-progress") return statistics;

  const next: LanguageStatistics = {
    ...statistics,
    completedGames: statistics.completedGames + 1,
    winsByGuessCount: [...statistics.winsByGuessCount],
  };

  if (game.status === "won") {
    next.wins += 1;
    next.currentStreak += 1;
    next.bestStreak = Math.max(next.bestStreak, next.currentStreak);
    next.winsByGuessCount[game.guesses.length - 1] += 1;
  } else {
    next.currentStreak = 0;
  }

  return next;
}
