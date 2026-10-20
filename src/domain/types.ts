export type Language = "pt-BR" | "en";
export type LetterResult = "correct" | "present" | "absent";
export type GameStatus = "in-progress" | "won" | "lost";

export interface Guess {
  value: string;
  results: LetterResult[];
  submittedAt: number;
}

export interface Game {
  id: string;
  language: Language;
  answer: string;
  wordLength: number;
  guesses: Guess[];
  status: GameStatus;
  startedAt: number;
  completedAt?: number;
}

export interface LanguageStatistics {
  completedGames: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  winsByGuessCount: number[];
}

export interface WordCycle {
  remaining: string[];
  lastAnswer: string | null;
}

export interface PersistedState {
  schemaVersion: 1;
  selectedLanguage: Language;
  games: Partial<Record<Language, Game>>;
  statistics: Record<Language, LanguageStatistics>;
  wordCycles: Record<Language, WordCycle>;
}

export interface WordList {
  readonly answers: readonly string[];
  readonly validGuesses: ReadonlySet<string>;
  readonly minLength: number;
  readonly maxLength: number;
}
