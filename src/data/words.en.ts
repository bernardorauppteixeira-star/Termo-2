import { normalizeWord } from "../domain/normalize";
import type { WordList } from "../domain/types";

const answers = [
  "ABLE", "BAKE", "CALM", "CARD", "CLUE", "DUSK", "FARM", "GAME", "HOPE", "LAMP", "MIND",
  "MOON", "OPEN", "PLAY", "RAIN", "ROAD", "STAR", "WAVE", "WIND", "WOOD",
  "APPLE", "BEACH", "BREAD", "CHAIR", "CLOUD", "DREAM", "EARTH", "FLAME", "GRAPE", "LIGHT",
  "PLANT", "QUIET", "RIVER", "SMILE", "SOUND", "STONE", "TABLE", "TRAIL", "WORLD",
  "BRIGHT", "CIRCLE", "FOREST", "GARDEN", "LETTER", "ORANGE", "PLANET", "PUZZLE", "ROCKET",
  "SIGNAL", "STREAM", "SUMMER", "WINDOW", "YELLOW", "BLANKET", "FREEDOM", "KITCHEN",
  "LANTERN", "MORNING", "RAINBOW", "SILENCE", "STATION", "TEACHER", "THUNDER", "VICTORY",
  "WHISPER",
] as const;

const extraGuesses = [
  "ABLE", "ALSO", "BIRD", "BLUE", "BOOK", "COLD", "DARK", "EACH", "FISH", "GOLD", "HARD",
  "KIND", "MANY", "NEAR", "PLAY", "SING", "TIME", "TREE", "WARM", "YEAR", "AFTER", "ALONE",
  "BRAIN", "BRAVE", "CANDY", "CLEAN", "DANCE", "ENJOY", "FRESH", "GREEN", "HEART", "LEARN",
  "MUSIC", "NIGHT", "OCEAN", "PEACE", "PLACE", "SHARE", "SWEET", "THINK", "TRUST", "VOICE",
  "ANOTHER", "ANCIENT", "CAPTAIN", "COUNTRY", "EVENING", "FAMILY", "JOURNEY", "PICTURE",
] as const;

export const englishWords: WordList = {
  answers,
  validGuesses: new Set([...answers, ...extraGuesses].map((word) => normalizeWord(word, "en"))),
  minLength: 4,
  maxLength: 7,
};
