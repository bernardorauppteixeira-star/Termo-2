import type { Game, Language } from "../domain/types";

const shareSymbols: Record<string, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
};

export function buildShareText(game: Game, language: Language): string {
  const languageLabel = language === "pt-BR" ? "PT-BR" : "EN";
  const outcome = game.status === "won" ? `${game.guesses.length}/6` : "X/6";
  const rows = game.guesses
    .map((guess) => guess.results.map((result) => shareSymbols[result]).join(""))
    .join("\n");

  return `Termó-2 · ${languageLabel}\n${outcome}\n${rows}`;
}

export type ShareResult = "shared" | "copied" | "failed";

export async function shareResult(text: string): Promise<ShareResult> {
  try {
    if (navigator.share) {
      await navigator.share({ title: "Termó-2", text });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "failed";
  }

  try {
    if (!navigator.clipboard?.writeText) return "failed";
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
