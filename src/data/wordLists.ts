import { englishWords } from "./words.en";
import { portugueseWords } from "./words.pt-BR";
import type { Language, WordList } from "../domain/types";

export const wordLists: Record<Language, WordList> = {
  "pt-BR": portugueseWords,
  en: englishWords,
};
