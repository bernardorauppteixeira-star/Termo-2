import { normalizeWord } from "../domain/normalize";
import type { WordList } from "../domain/types";

const answers = [
  "AMOR", "ARTE", "CASA", "CAMA", "DADO", "FATO", "GATO", "LAGO", "MATO", "RATO", "VIDA",
  "AMIGO", "BANHO", "BARCO", "CAMPO", "CANTO", "CARTA", "CHAVE", "CLARO", "FRUTA", "LIVRO",
  "MUNDO", "NUVEM", "PEDRA", "PORTA", "PRATO", "TERMO", "TERRA", "VERDE", "SONHO",
  "ABRIGO", "AMIZADE", "CAMINHO", "CIDADE", "CORAGEM", "ESCOLA", "ESTRELA", "FAMÍLIA",
  "JANELA", "JARDIM", "MÚSICA", "PESSOA", "SAÚDE", "ALEGRIA", "COZINHA", "FOGUETE",
  "MENINA", "PALAVRA", "SORRISO", "TRABALHO", "NATUREZA", "TELEFONE", "SURPRESA",
] as const;

const extraGuesses = [
  "ABRIR", "AGORA", "BOLSA", "BRISA", "CALMA", "DANÇA", "FELIZ", "FOLHA", "FORTE", "GENTE",
  "HOMEM", "IDEIA", "JOVEM", "LIMÃO", "LUGAR", "NOITE", "OLHAR", "PAPEL", "PRAIA", "TEMPO",
  "VALOR", "ANIMAL", "BELEZA", "BRINCO", "CANÇÃO", "CEREJA", "DENTRO", "FAMÍLIA", "FLORES",
  "FUTURO", "GARRAFA", "HISTÓRIA", "INVERNO", "LARANJA", "MANHÃ", "MELHOR", "PASSADO",
  "PRESENTE", "RAPAZ", "RESPOSTA", "SILÊNCIO", "VITÓRIA",
] as const;

export const portugueseWords: WordList = {
  answers,
  validGuesses: new Set([...answers, ...extraGuesses].map((word) => normalizeWord(word, "pt-BR"))),
  minLength: 4,
  maxLength: 8,
};
