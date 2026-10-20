import { createInitialState, isGameActive, selectLanguage, startGame, submitGuess } from "./domain/game";
import { splitLetters } from "./domain/normalize";
import type { Game, Language, LetterResult } from "./domain/types";
import { wordLists } from "./data/wordLists";
import { buildShareText, shareResult } from "./infrastructure/share";
import { loadState, saveState, type StorageError } from "./infrastructure/storage";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("The application root element is missing.");

const strings = {
  "pt-BR": {
    language: "Português (Brasil)",
    title: "Frequência da palavra",
    subtitle: (length: number) => `PT-BR · ${length} letras · 6 tentativas`,
    pick: "Escolha o idioma e comece sua primeira partida.",
    begin: "Sintonizar",
    newGame: "Nova sintonia",
    restart: "Uma nova palavra será escolhida. Continuar?",
    guessLabel: (length: number) => `Digite seu palpite de ${length} letras`,
    placeholder: "SUA PALAVRA",
    submit: "Sintonizar",
    remaining: (count: number) => `${count} de 6 tentativas usadas.`,
    saved: "● Sinal salvo neste dispositivo",
    active: "Partida em andamento",
    won: (count: number) => `Frequência encontrada em ${count} tentativa${count === 1 ? "" : "s"}!`,
    lost: (answer: string) => `Sinal perdido. A resposta era ${answer}.`,
    invalid: {
      empty: "Digite uma palavra antes de enviar.",
      characters: "Use apenas letras, sem espaços, números ou símbolos.",
      length: (count: number) => `A palavra precisa ter exatamente ${count} letras.`,
      unknown: "Essa palavra não consta no dicionário offline de palavras aceitas.",
      finished: "Esta partida terminou. Inicie uma nova sintonia.",
    },
    legend: { correct: "Na posição", present: "Em outra posição", absent: "Não aparece" },
    guesses: "Tentativas",
    played: "Partidas",
    wins: "Vitórias",
    streak: "Sequência",
    best: "Melhor",
    stats: "Sua frequência",
    close: "Fechar",
    share: "Compartilhar resultado",
    shared: "Resultado compartilhado.",
    copied: "Sequência copiada.",
    shareFailed: "Não foi possível compartilhar. Selecione e copie o resumo manualmente.",
    saveError: "Não foi possível salvar neste dispositivo. O progresso atual ficará apenas nesta sessão.",
    saveUnavailable: "O armazenamento local está indisponível. O progresso pode não persistir.",
    recovered: "Os dados salvos estavam inválidos. Uma nova partida segura foi iniciada.",
    paused: "Partida pausada neste idioma.",
    startNew: "Começar outra partida",
    length: "letras",
    legendLabel: "Legenda das pistas",
    shareText: "Resumo para compartilhar",
    footer: "Partidas e estatísticas ficam neste dispositivo. Não há conta nem sincronização.",
    statsDistribution: "Vitórias por tentativa",
  },
  en: {
    language: "English",
    title: "Word frequency",
    subtitle: (length: number) => `EN · ${length} letters · 6 guesses`,
    pick: "Choose a language and begin your first game.",
    begin: "Tune in",
    newGame: "New signal",
    restart: "A new word will be selected. Continue?",
    guessLabel: (length: number) => `Enter your ${length}-letter guess`,
    placeholder: "YOUR WORD",
    submit: "Tune in",
    remaining: (count: number) => `${count} of 6 guesses used.`,
    saved: "● Signal saved on this device",
    active: "Game in progress",
    won: (count: number) => `Signal found in ${count} guess${count === 1 ? "" : "es"}!`,
    lost: (answer: string) => `Signal lost. The answer was ${answer}.`,
    invalid: {
      empty: "Enter a word before submitting.",
      characters: "Use letters only, without spaces, numbers, or symbols.",
      length: (count: number) => `The word must have exactly ${count} letters.`,
      unknown: "That word is not in the accepted guess list.",
      finished: "This game is over. Start a new signal.",
    },
    legend: { correct: "Correct position", present: "Different position", absent: "Not present" },
    guesses: "Guesses",
    played: "Games",
    wins: "Wins",
    streak: "Streak",
    best: "Best",
    stats: "Your frequency",
    close: "Close",
    share: "Share result",
    shared: "Result shared.",
    copied: "Pattern copied.",
    shareFailed: "Could not share. Select and copy the summary manually.",
    saveError: "Could not save on this device. Progress will remain only for this session.",
    saveUnavailable: "Local storage is unavailable. Progress may not persist.",
    recovered: "Saved data was invalid. A safe new game was started.",
    paused: "Game paused in this language.",
    startNew: "Start another game",
    length: "letters",
    legendLabel: "Clue legend",
    shareText: "Shareable summary",
    footer: "Games and statistics stay on this device. There is no account or sync.",
    statsDistribution: "Wins by guess",
  },
} as const;

const resultSymbols: Record<LetterResult, string> = {
  correct: "✓",
  present: "↗",
  absent: "—",
};

const resultLabels: Record<Language, Record<LetterResult, string>> = {
  "pt-BR": {
    correct: "na posição correta",
    present: "presente em outra posição",
    absent: "não aparece na resposta",
  },
  en: {
    correct: "in the correct position",
    present: "present in another position",
    absent: "not in the answer",
  },
};

root.innerHTML = `
  <main class="app-shell">
    <header class="topbar">
      <a class="wordmark" href="./" aria-label="Termó-2, início">TERMÓ<span>-2</span><small data-tagline>Sintonize a palavra</small></a>
      <div class="top-actions">
        <div class="language-switch" role="group" aria-label="Idioma da partida">
          <button type="button" class="language-button" data-language="pt-BR" aria-pressed="true">PT-BR</button>
          <button type="button" class="language-button" data-language="en" aria-pressed="false">EN</button>
        </div>
        <button class="icon-button header-new-game" type="button" data-header-new></button>
        <button class="icon-button stats-open" type="button" data-open-stats aria-haspopup="dialog"><span aria-hidden="true">▥</span><span data-stats-label>Estatísticas</span></button>
      </div>
    </header>

    <section class="station" aria-labelledby="game-title">
      <div class="station-heading">
        <div>
          <p class="eyebrow" data-eyebrow>ESTAÇÃO DE SINTONIA</p>
          <h1 id="game-title" data-title>Frequência da palavra</h1>
          <p class="game-meta" data-meta></p>
        </div>
        <div class="signal-status" data-save-status role="status"></div>
      </div>

      <div class="game-layout">
        <div class="play-column">
          <div class="board" data-board aria-label="Tabuleiro de tentativas"></div>
          <div class="empty-state" data-empty hidden>
            <span class="empty-dial" aria-hidden="true">◉</span>
            <p data-empty-message></p>
            <button type="button" class="primary-button" data-start> Sintonizar </button>
          </div>
          <form class="guess-form" data-guess-form>
            <label class="sr-only" data-guess-label for="guess-input">Digite seu palpite</label>
            <input id="guess-input" name="guess" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="8" aria-describedby="game-message">
            <button type="submit" class="primary-button" data-submit>Sintonizar</button>
          </form>
          <p class="game-message" id="game-message" data-message aria-live="polite" aria-atomic="true"></p>
          <div class="legend" data-legend aria-label="Legenda das pistas"></div>
          <section class="result-panel" data-result hidden aria-live="polite">
            <div class="result-copy">
              <p class="eyebrow" data-result-kicker></p>
              <h2 data-result-title tabindex="-1"></h2>
              <p data-result-answer></p>
            </div>
            <button type="button" class="secondary-button" data-share>↗ <span data-share-label></span></button>
              <label class="share-preview-label" data-share-text-label for="share-preview"></label>
            <textarea id="share-preview" class="share-preview" rows="3" readonly></textarea>
            <button type="button" class="primary-button" data-new-game></button>
          </section>
        </div>

        <aside class="frequency-card" aria-labelledby="stats-title">
          <div class="card-heading"><span class="meter-icon" aria-hidden="true">◉</span><h2 id="stats-title" data-stats-title>Sua frequência</h2></div>
          <div class="stats-grid" data-stats-grid></div>
          <p class="frequency-note" data-frequency-note></p>
        </aside>
      </div>

      <p class="storage-note" data-storage-note></p>
    </section>

    <footer class="footer-note" data-footer></footer>
  </main>

  <dialog class="stats-dialog" data-stats-dialog aria-labelledby="dialog-title">
    <div class="dialog-heading"><h2 id="dialog-title" data-dialog-title></h2><button class="icon-button" type="button" data-close-stats aria-label="Fechar">×</button></div>
    <div class="stats-grid stats-grid-large" data-dialog-stats></div>
    <h3 class="distribution-title" data-distribution-title></h3>
    <ol class="distribution" data-distribution></ol>
  </dialog>
  <div class="sr-only" data-announcer aria-live="polite" aria-atomic="true"></div>
`;

const elements = {
  langButtons: [...root.querySelectorAll<HTMLButtonElement>("[data-language]")],
  languageGroup: root.querySelector<HTMLElement>(".language-switch")!,
  headerNewGame: root.querySelector<HTMLButtonElement>("[data-header-new]")!,
  title: root.querySelector<HTMLElement>("[data-title]")!,
  meta: root.querySelector<HTMLElement>("[data-meta]")!,
  saveStatus: root.querySelector<HTMLElement>("[data-save-status]")!,
  board: root.querySelector<HTMLElement>("[data-board]")!,
  empty: root.querySelector<HTMLElement>("[data-empty]")!,
  emptyMessage: root.querySelector<HTMLElement>("[data-empty-message]")!,
  start: root.querySelector<HTMLButtonElement>("[data-start]")!,
  form: root.querySelector<HTMLFormElement>("[data-guess-form]")!,
  input: root.querySelector<HTMLInputElement>("#guess-input")!,
  guessLabel: root.querySelector<HTMLLabelElement>("[data-guess-label]")!,
  submit: root.querySelector<HTMLButtonElement>("[data-submit]")!,
  message: root.querySelector<HTMLElement>("[data-message]")!,
  legend: root.querySelector<HTMLElement>("[data-legend]")!,
  result: root.querySelector<HTMLElement>("[data-result]")!,
  resultKicker: root.querySelector<HTMLElement>("[data-result-kicker]")!,
  resultTitle: root.querySelector<HTMLElement>("[data-result-title]")!,
  resultAnswer: root.querySelector<HTMLElement>("[data-result-answer]")!,
  share: root.querySelector<HTMLButtonElement>("[data-share]")!,
  shareLabel: root.querySelector<HTMLElement>("[data-share-label]")!,
  shareTextLabel: root.querySelector<HTMLLabelElement>("[data-share-text-label]")!,
  sharePreview: root.querySelector<HTMLTextAreaElement>("#share-preview")!,
  newGame: root.querySelector<HTMLButtonElement>("[data-new-game]")!,
  statsGrid: root.querySelector<HTMLElement>("[data-stats-grid]")!,
  statsTitle: root.querySelector<HTMLElement>("[data-stats-title]")!,
  frequencyNote: root.querySelector<HTMLElement>("[data-frequency-note]")!,
  storageNote: root.querySelector<HTMLElement>("[data-storage-note]")!,
  footer: root.querySelector<HTMLElement>("[data-footer]")!,
  tagline: root.querySelector<HTMLElement>("[data-tagline]")!,
  eyebrow: root.querySelector<HTMLElement>("[data-eyebrow]")!,
  statsLabel: root.querySelector<HTMLElement>("[data-stats-label]")!,
  statsDialog: root.querySelector<HTMLDialogElement>("[data-stats-dialog]")!,
  dialogTitle: root.querySelector<HTMLElement>("[data-dialog-title]")!,
  dialogStats: root.querySelector<HTMLElement>("[data-dialog-stats]")!,
  distributionTitle: root.querySelector<HTMLElement>("[data-distribution-title]")!,
  distribution: root.querySelector<HTMLOListElement>("[data-distribution]")!,
  closeStats: root.querySelector<HTMLButtonElement>("[data-close-stats]")!,
  openStats: root.querySelector<HTMLButtonElement>("[data-open-stats]")!,
  announcer: root.querySelector<HTMLElement>("[data-announcer]")!,
};

const loaded = loadState();
let state = loaded.state;
let recoveryPending = loaded.ok && loaded.recovered;
let persistenceWarning = loaded.ok
  ? (recoveryPending ? strings[state.selectedLanguage].recovered : "")
  : messageForStorageError(loaded.error, state.selectedLanguage);

function t() {
  return strings[state.selectedLanguage];
}

function currentGame(): Game | undefined {
  return state.games[state.selectedLanguage];
}

function persist(): boolean {
  if (recoveryPending) return false;
  const result = saveState(state);
  persistenceWarning = result.ok ? "" : messageForStorageError(result.error, state.selectedLanguage);
  return result.ok;
}

function messageForStorageError(error: StorageError, language: Language): string {
  return error === "unavailable" ? strings[language].saveUnavailable : strings[language].saveError;
}

function renderStats(target: HTMLElement) {
  const stats = state.statistics[state.selectedLanguage];
  const labels = t();
  const items = [
    [String(stats.completedGames), labels.played],
    [String(stats.wins), labels.wins],
    [String(stats.currentStreak), labels.streak],
    [String(stats.bestStreak), labels.best],
  ];
  target.replaceChildren();
  for (const [value, label] of items) {
    const item = document.createElement("div");
    item.className = "stat-item";
    const number = document.createElement("strong");
    number.textContent = value;
    const caption = document.createElement("span");
    caption.textContent = label;
    item.append(number, caption);
    target.append(item);
  }
}

function renderLegend() {
  const labels = t();
  const entries: [LetterResult, string][] = [
    ["correct", labels.legend.correct],
    ["present", labels.legend.present],
    ["absent", labels.legend.absent],
  ];
  elements.legend.replaceChildren();
  elements.legend.setAttribute("aria-label", labels.legendLabel);
  for (const [result, label] of entries) {
    const item = document.createElement("span");
    item.className = `legend-item ${result}`;
    const symbol = document.createElement("span");
    symbol.className = "legend-mark";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = resultSymbols[result];
    const caption = document.createElement("span");
    caption.textContent = label;
    item.append(symbol, caption);
    elements.legend.append(item);
  }
}

function renderBoard(game: Game | undefined) {
  elements.board.replaceChildren();
  if (!game) return;
  elements.board.style.setProperty("--word-length", String(game.wordLength));
  elements.board.setAttribute(
    "aria-label",
    state.selectedLanguage === "pt-BR" ? "Tabuleiro de tentativas" : "Guess board",
  );

  for (let rowIndex = 0; rowIndex < 6; rowIndex += 1) {
    const row = document.createElement("div");
    row.className = "guess-row";
    row.setAttribute("role", "group");
    row.setAttribute(
      "aria-label",
      state.selectedLanguage === "pt-BR" ? `Tentativa ${rowIndex + 1}` : `Guess ${rowIndex + 1}`,
    );
    const guess = game.guesses[rowIndex];
    const letters = guess ? splitLetters(guess.value) : [];
    for (let column = 0; column < game.wordLength; column += 1) {
      const tile = document.createElement("span");
      tile.className = "tile";
      if (guess) {
        const result = guess.results[column];
        tile.classList.add(result);
        tile.setAttribute("aria-label", `${letters[column]}, ${resultLabels[state.selectedLanguage][result]}`);
        tile.textContent = letters[column];
        const mark = document.createElement("span");
        mark.className = "tile-mark";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = resultSymbols[result];
        tile.append(mark);
      } else {
        tile.setAttribute("aria-hidden", "true");
      }
      row.append(tile);
    }
    elements.board.append(row);
  }
}

function renderDistribution() {
  const stats = state.statistics[state.selectedLanguage];
  elements.distribution.replaceChildren();
  for (let index = 0; index < 6; index += 1) {
    const row = document.createElement("li");
    row.className = "distribution-row";
    const count = document.createElement("span");
    count.textContent = String(index + 1);
    const bar = document.createElement("span");
    bar.className = "distribution-bar";
    const maxCount = Math.max(1, ...stats.winsByGuessCount);
    bar.style.width = `${Math.max(4, (stats.winsByGuessCount[index] / maxCount) * 100)}%`;
    bar.textContent = String(stats.winsByGuessCount[index]);
    bar.setAttribute("aria-label", `${stats.winsByGuessCount[index]} ${t().wins}`);
    row.append(count, bar);
    elements.distribution.append(row);
  }
}

function render() {
  const language = state.selectedLanguage;
  const labels = t();
  const game = currentGame();
  document.documentElement.lang = language;
  document.title = language === "pt-BR" ? "Termó-2 — Sintonize a palavra" : "Termó-2 — Tune in to a word";
  elements.title.textContent = labels.title;
  elements.tagline.textContent = language === "pt-BR" ? "Sintonize a palavra" : "Tune in to a word";
  elements.eyebrow.textContent = language === "pt-BR" ? "ESTAÇÃO DE SINTONIA" : "TUNING STATION";
  elements.statsLabel.textContent = language === "pt-BR" ? "Estatísticas" : "Statistics";
  elements.statsTitle.textContent = labels.stats;
  elements.headerNewGame.textContent = labels.newGame;
  elements.headerNewGame.setAttribute("aria-label", labels.newGame);
  elements.headerNewGame.title = labels.newGame;
  elements.frequencyNote.textContent = language === "pt-BR"
    ? "Troque de idioma para pausar e retomar outra frequência."
    : "Switch languages to pause and resume another frequency.";
  elements.footer.textContent = labels.footer;
  elements.languageGroup.setAttribute("aria-label", language === "pt-BR" ? "Idioma da partida" : "Game language");
  elements.closeStats.setAttribute("aria-label", labels.close);
  elements.saveStatus.replaceChildren(document.createTextNode(persistenceWarning || (recoveryPending ? labels.recovered : labels.saved)));
  if (recoveryPending) {
    const recoverButton = document.createElement("button");
    recoverButton.type = "button";
    recoverButton.className = "recovery-button";
    recoverButton.textContent = language === "pt-BR" ? "Reiniciar progresso" : "Reset progress";
    recoverButton.addEventListener("click", () => {
      state = createInitialState();
      recoveryPending = false;
      persistenceWarning = "";
      persist();
      render();
    });
    elements.saveStatus.append(recoverButton);
  }
  elements.saveStatus.classList.toggle("warning", Boolean(persistenceWarning || recoveryPending));
  elements.saveStatus.setAttribute("role", persistenceWarning || recoveryPending ? "alert" : "status");
  elements.langButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.language === language));
  });
  renderStats(elements.statsGrid);
  renderStats(elements.dialogStats);
  elements.dialogTitle.textContent = labels.stats;
  elements.distributionTitle.textContent = labels.statsDistribution;
  renderDistribution();
  renderLegend();
  renderBoard(game);

  const hasGame = Boolean(game);
  const inProgress = game?.status === "in-progress";
  elements.empty.hidden = hasGame;
  elements.headerNewGame.hidden = !hasGame;
  elements.board.hidden = !hasGame;
  elements.form.hidden = !inProgress;
  elements.legend.hidden = !hasGame;
  elements.emptyMessage.textContent = labels.pick;
  elements.start.textContent = labels.begin;
  elements.submit.textContent = labels.submit;
  elements.input.placeholder = labels.placeholder;
  elements.input.maxLength = game ? game.wordLength : wordLists[language].maxLength;
  elements.guessLabel.textContent = labels.guessLabel(game?.wordLength ?? wordLists[language].minLength);
  elements.meta.textContent = game
    ? game.status !== "in-progress"
      ? language === "pt-BR"
        ? `${labels.language} · ${game.wordLength} letras · ${game.guesses.length} de 6 tentativas`
        : `${labels.language} · ${game.wordLength} letters · ${game.guesses.length} of 6 guesses`
      : language === "pt-BR"
        ? `${labels.language} · palavra de ${game.wordLength} letras · ${6 - game.guesses.length} tentativas restantes`
        : `${labels.language} · ${game.wordLength} letters · ${6 - game.guesses.length} guesses remaining`
    : labels.pick;
  elements.message.textContent = game
    ? game.status === "won"
      ? labels.won(game.guesses.length)
      : game.status === "lost"
        ? labels.lost(game.answer)
        : labels.remaining(game.guesses.length)
    : "";
  elements.result.hidden = !game || game.status === "in-progress";
  if (game && game.status !== "in-progress") renderResult(game);
  elements.storageNote.textContent = persistenceWarning || labels.footer;
}

function renderResult(game: Game) {
  const labels = t();
  const won = game.status === "won";
  elements.resultKicker.textContent = won
    ? (state.selectedLanguage === "pt-BR" ? "SINAL ENCONTRADO" : "SIGNAL FOUND")
    : (state.selectedLanguage === "pt-BR" ? "FIM DA TRANSMISSÃO" : "END OF TRANSMISSION");
  elements.resultTitle.textContent = won
    ? (state.selectedLanguage === "pt-BR" ? "Frequência encontrada" : "Frequency found")
    : (state.selectedLanguage === "pt-BR" ? "A sintonia escapou" : "The signal faded");
  elements.resultAnswer.textContent = state.selectedLanguage === "pt-BR"
    ? `A palavra era ${game.answer}.`
    : `The word was ${game.answer}.`;
  elements.shareLabel.textContent = labels.share;
  elements.shareTextLabel.textContent = labels.shareText;
  elements.sharePreview.value = buildShareText(game, game.language);
  elements.newGame.textContent = labels.newGame;
}

function startNewGame() {
  const language = state.selectedLanguage;
  const replacingActiveGame = isGameActive(state, language);
  const candidate = startGame(state, language, wordLists[language]);
  const nextGame = candidate.games[language]!;
  const prompt = replacingActiveGame
    ? `${t().restart}\n\n${language === "pt-BR" ? "A nova palavra terá" : "The new word will have"} ${nextGame.wordLength} ${language === "pt-BR" ? "letras." : "letters."}`
    : language === "pt-BR"
      ? `A palavra terá ${nextGame.wordLength} letras. Começar?`
      : `The word will have ${nextGame.wordLength} letters. Begin?`;
  if (!window.confirm(prompt)) return;
  state = candidate;
  persist();
  render();
  elements.input.focus();
}

function updateLanguage(language: Language) {
  if (state.selectedLanguage === language) return;
  state = selectLanguage(state, language);
  elements.input.value = "";
  elements.input.removeAttribute("aria-invalid");
  persist();
  render();
  if (currentGame()?.status === "in-progress") elements.announcer.textContent = t().paused;
}

function invalidMessage(error: Exclude<ReturnType<typeof submitGuess>, { ok: true }>["error"]): string {
  const stringsForLanguage = t();
  switch (error) {
    case "empty": return stringsForLanguage.invalid.empty;
    case "characters": return stringsForLanguage.invalid.characters;
    case "length": return stringsForLanguage.invalid.length(currentGame()?.wordLength ?? 0);
    case "unknown": return stringsForLanguage.invalid.unknown;
    case "finished": return stringsForLanguage.invalid.finished;
  }
}

elements.langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const language = button.dataset.language;
    if (language === "pt-BR" || language === "en") updateLanguage(language);
  });
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = submitGuess(state, elements.input.value, wordLists[state.selectedLanguage].validGuesses);
  if (!result.ok) {
    elements.message.textContent = invalidMessage(result.error);
    elements.input.setAttribute("aria-invalid", "true");
    elements.input.focus();
    return;
  }
  state = result.state;
  elements.input.value = "";
  elements.input.removeAttribute("aria-invalid");
  persist();
  render();
  const game = currentGame();
  if (game) {
    const guess = game.guesses.at(-1)!;
    const counts = {
      correct: guess.results.filter((item) => item === "correct").length,
      present: guess.results.filter((item) => item === "present").length,
      absent: guess.results.filter((item) => item === "absent").length,
    };
    elements.announcer.textContent = state.selectedLanguage === "pt-BR"
      ? `Tentativa ${game.guesses.length} de 6. ${counts.correct} na posição correta, ${counts.present} em outra posição, ${counts.absent} ausentes.`
      : `Guess ${game.guesses.length} of 6. ${counts.correct} correct position, ${counts.present} different position, ${counts.absent} absent.`;
  }
  if (currentGame()?.status === "in-progress") elements.input.focus();
  else elements.resultTitle.focus();
});

elements.start.addEventListener("click", startNewGame);
elements.headerNewGame.addEventListener("click", startNewGame);
root.querySelectorAll<HTMLButtonElement>("[data-new-game]").forEach((button) => {
  button.addEventListener("click", startNewGame);
});

elements.share.addEventListener("click", async () => {
  const game = currentGame();
  if (!game || game.status === "in-progress") return;
  const result = await shareResult(buildShareText(game, game.language));
  elements.message.textContent =
    result === "shared" ? t().shared : result === "copied" ? t().copied : t().shareFailed;
});

elements.openStats.addEventListener("click", () => {
  elements.statsDialog.showModal();
  elements.closeStats.focus();
});
elements.closeStats.addEventListener("click", () => elements.statsDialog.close());
elements.statsDialog.addEventListener("click", (event) => {
  if (event.target === elements.statsDialog) elements.statsDialog.close();
});
elements.statsDialog.addEventListener("close", () => elements.openStats.focus());

window.addEventListener("storage", (event) => {
  if (event.key !== "termo2.state" || !event.newValue) return;
  const refreshed = loadState();
  if (refreshed.ok) {
    state = refreshed.state;
    recoveryPending = refreshed.recovered;
    persistenceWarning = recoveryPending ? strings[state.selectedLanguage].recovered : "";
    render();
  }
});

if (loaded.ok && !loaded.hadData) persist();
render();
