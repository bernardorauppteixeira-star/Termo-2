# Projeto técnico — Termó-2

**Produto:** jogo casual de adivinhação de palavras  
**Design de referência:** conceito 3 — “Estação de sintonia”  
**Documento de origem:** [PRD.md](./PRD.md)  
**Estado:** proposta técnica para o MVP; as escolhas de stack abaixo são recomendações, pois o repositório ainda não possui uma aplicação ou stack definidos.

## 1. Resumo executivo

Implementar uma aplicação web estática, responsiva e executada no navegador, sem backend, contas, anúncios ou telemetria no MVP. A interface terá o ambiente escuro e a identidade de estação de rádio do conceito 3, mantendo o tabuleiro, os controles e as pistas acessíveis por teclado, toque, símbolos e nomes acessíveis.

### Stack recomendada

- **TypeScript** para regras de domínio, estado, persistência e interação.
- **Vite** para desenvolvimento local e geração de arquivos estáticos.
- **HTML semântico, CSS e TypeScript sem framework de UI** para reduzir dependências e adequar a complexidade do MVP. O jogo tem uma tela principal, dois idiomas e estado pequeno; um framework pode ser adotado depois se a aplicação crescer.
- **Vitest** para testes unitários e de integração do domínio.
- **Playwright** para testes de fluxos completos em navegador e tamanhos de viewport.
- **LocalStorage** para partidas, estatísticas e estado de seleção no mesmo navegador.

As escolhas são recomendações e não implicam que esses pacotes já estejam instalados. Antes da implementação, criar os manifests e scripts de acordo com o padrão que o responsável pelo projeto aprovar.

## 2. Escopo técnico

### Incluído no MVP

- Aplicação de página única com partida em português do Brasil ou inglês.
- Uma partida em andamento por idioma, persistida localmente e retomável.
- Palavras de 4–8 letras em português e 4–7 letras em inglês.
- Seis tentativas válidas por partida.
- Validação com listas distintas para palpites e respostas.
- Avaliação correta de letras repetidas, acentos e cedilha.
- Estatísticas locais separadas por idioma.
- Resumo de resultado compartilhável sem letras ou resposta secreta.
- Interface responsiva com a direção visual “Estação de sintonia”.
- Acessibilidade para teclado, leitores de tela, baixa visão e redução de movimento.

### Fora do MVP

- Backend, contas, ranking, sincronização entre dispositivos e modo multiplayer.
- Desafios diários sincronizados.
- Instalação como PWA, notificações e funcionamento offline explicitamente garantido.
- Análise comportamental remota.
- Editor de vocabulário ou painel administrativo.

## 3. Princípios e decisões arquiteturais

1. **Domínio independente da interface:** a lógica de palavras e partidas não depende do DOM, CSS ou APIs do navegador.
2. **Estado explícito:** vitória, derrota e partida em andamento são estados distintos; não deduzir o resultado apenas pela quantidade de linhas renderizadas.
3. **Persistência honesta:** só mostrar “salvo” depois que uma operação de armazenamento terminar sem erro.
4. **Sem segredo de servidor:** como o produto não tem backend, a resposta selecionada pode ser inspecionada no armazenamento local ou nos recursos entregues ao navegador. O MVP não promete resistência a trapaças.
5. **Acessibilidade desde a estrutura:** controles HTML nativos, foco visível, mensagens anunciadas e pista em mais de um formato.
6. **Vocabulário revisável:** listas de palavras ficam em dados separados da lógica; cada lista deve ter origem e licença verificáveis.
7. **Sem dependência de rede em runtime:** fontes, bibliotecas ou recursos remotos não são necessários para iniciar uma partida.

## 4. Arquitetura de alto nível

```text
┌──────────────────────────────────────────────────────┐
│ Interface web                                         │
│ Cabeçalho · seletor de idioma · tabuleiro · entrada  │
│ pistas/legenda · estado final · estatísticas          │
└────────────────────────┬─────────────────────────────┘
                         │ eventos e modelos de tela
┌────────────────────────▼─────────────────────────────┐
│ Aplicação                                             │
│ iniciar · enviar palpite · trocar idioma · reiniciar  │
│ compartilhar · carregar e gravar estado               │
└───────────────┬─────────────────────┬────────────────┘
                │                     │
┌───────────────▼───────────────┐ ┌───▼────────────────┐
│ Domínio puro                  │ │ Adaptadores         │
│ normalização · validação      │ │ LocalStorage        │
│ avaliação · ciclo de palavras │ │ Clipboard/Web Share │
│ transições · estatísticas     │ │ relógio aleatório   │
└───────────────┬───────────────┘ └────────────────────┘
                │
┌───────────────▼──────────────────────────────────────┐
│ Dados estáticos de vocabulário por idioma             │
│ respostas curadas · palpites válidos · versão da lista│
└──────────────────────────────────────────────────────┘
```

### Fluxo de uma partida

1. Inicializar aplicação e validar o estado persistido.
2. Exibir o idioma selecionado anteriormente; se não houver preferência válida, iniciar em português do Brasil.
3. Carregar ou iniciar a partida ativa daquele idioma.
4. Validar o palpite e, se válido, avaliá-lo no domínio.
5. Atualizar estado e estatísticas se a partida terminou.
6. Persistir o estado completo antes de informar sucesso de gravação.
7. Renderizar a interface a partir do estado resultante.

## 5. Estrutura de código proposta

```text
src/
  main.ts
  app/
    createApp.ts
    actions.ts
    render.ts
    messages.ts
  domain/
    game.ts
    guess.ts
    normalize.ts
    evaluate.ts
    statistics.ts
    wordCycle.ts
    types.ts
  data/
    words.pt-BR.ts
    words.en.ts
    wordLists.ts
  infrastructure/
    storage.ts
    share.ts
    random.ts
  styles/
    tokens.css
    base.css
    layout.css
    components.css
tests/
  unit/
    normalize.test.ts
    evaluate.test.ts
    game.test.ts
    statistics.test.ts
    wordCycle.test.ts
  integration/
    storage.test.ts
    actions.test.ts
  e2e/
    game.spec.ts
    accessibility.spec.ts
index.html
```

Se o conjunto de código permanecer muito pequeno, os arquivos podem ser agrupados sem alterar as fronteiras de responsabilidade. Evitar criar abstrações genéricas de UI ou gerenciamento de estado sem uma necessidade concreta.

## 6. Modelos de domínio

Exemplos abaixo descrevem a forma lógica dos dados em TypeScript, não um contrato já implementado:

```ts
type Language = "pt-BR" | "en";
type LetterResult = "correct" | "present" | "absent";
type GameStatus = "in-progress" | "won" | "lost";

interface Guess {
  value: string;                // grafia digitada, preservada para exibição
  results: LetterResult[];      // uma entrada por letra normalizada
  submittedAt: number;           // timestamp Unix, usado para auditoria local
}

interface ActiveGame {
  id: string;
  language: Language;
  answer: string;                // grafia original da resposta
  guesses: Guess[];
  status: GameStatus;
  wordListVersion: string;
  startedAt: number;
  completedAt?: number;
}

interface LanguageStatistics {
  completedGames: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  winsByGuessCount: [number, number, number, number, number, number];
}

interface PersistedState {
  schemaVersion: 1;
  selectedLanguage: Language;
  activeGames: Partial<Record<Language, ActiveGame>>;
  statistics: Record<Language, LanguageStatistics>;
  wordCycles: Record<Language, WordCycleState>;
}
```

`wordCycles` guarda as respostas já consumidas e a última resposta de cada idioma, permitindo cumprir a regra de não repetir antes do fim de um ciclo. `ActiveGame.answer` é dado local, não uma chave protegida. Não incluir na carga útil de compartilhamento.

### Invariantes do domínio

- Uma partida tem entre zero e seis palpites válidos.
- Cada palpite guardado tem a quantidade de letras esperada para o idioma/partida.
- O resultado de cada letra tem apenas os valores definidos em `LetterResult`.
- Uma partida `won` tem pelo menos um palpite integralmente correto.
- Uma partida `lost` tem seis palpites e nenhum integralmente correto.
- Uma partida concluída tem `completedAt`; uma partida ativa não atualiza estatísticas.
- Estatísticas de cada idioma são independentes.
- `winsByGuessCount[i]` representa vitórias resolvidas em `i + 1` palpites.

## 7. Regras de idioma, letras e validação

### 7.1 Comprimento e unidade de contagem

Contar **letras percebidas pelo usuário**, não unidades UTF-16. Usar `Intl.Segmenter` com granularidade `grapheme` onde disponível. Como fallback, segmentar após normalização Unicode com uma função testada que preserve letras-base e marcas combinantes. Nunca usar diretamente `string.length` como regra de validação de comprimento.

Normalizar primeiro para NFC para armazenar/exibir consistentemente. Para comparar:

- Converter a entrada em maiúsculas sem alterar idioma escolhido.
- Em português, remover marcas diacríticas Unicode e tratar `Ç` como `C`, conforme o PRD.
- Em inglês, comparar letras sem distinção de caixa e aceitar apenas entradas da lista inglesa.
- Preservar a grafia original da resposta para exibição, mesmo quando a equivalência normalizada for usada na comparação.
- Não aceitar espaços, hífens, apóstrofos, dígitos ou símbolos nos palpites.

A regra de equivalência de acentos se aplica ao feedback e comparação da solução. A lista de palpites deve definir explicitamente quais grafias são válidas. Para o MVP, recomenda-se incluir variantes sem acento aceitas no português quando correspondam a palavras válidas, sem transformar qualquer sequência normalizada em um palpite válido automaticamente.

### 7.2 Validação de palpite

Na ordem abaixo:

1. Se a partida terminou, rejeitar ação e manter estado inalterado.
2. Normalizar e segmentar a entrada.
3. Rejeitar vazio, pontuação ou caracteres não permitidos.
4. Validar comprimento em graphemes para aquela partida.
5. Verificar associação à lista de palpites do idioma.
6. Se válido, acrescentar uma linha de tentativa e avaliar as letras.
7. Se correto, marcar vitória; se for a sexta tentativa, marcar derrota; caso contrário, manter em andamento.

Respostas de validação devem ser mensagens específicas e legíveis; palpites inválidos não contam como tentativa. Evitar dar pistas que revelem diretamente a resposta em mensagens de erro.

### 7.3 Avaliação com letras repetidas

Implementar função pura `evaluateGuess(guess, answer): LetterResult[]`:

1. Normalizar ambas as palavras e segmentar em letras.
2. Marcar primeiro as posições que coincidem exatamente como `correct`.
3. Contar as letras da resposta que não foram consumidas pelas posições corretas.
4. Percorrer as demais letras do palpite: se houver ocorrência restante, marcar `present` e decrementar a contagem; caso contrário, `absent`.

Complexidade: O(n), onde n é o tamanho máximo da palavra (no MVP, oito letras).

## 8. Seleção de respostas sem repetição

- Manter ciclo independente por idioma.
- No começo de ciclo, criar uma permutação aleatória das respostas elegíveis e salvar a fila/consumo no estado local.
- Selecionar a próxima resposta ainda não usada; não selecionar imediatamente a última resposta do ciclo anterior.
- Tornar a função aleatória injetável para que os testes sejam determinísticos.
- Impedir respostas duplicadas após normalização dentro da mesma lista.
- Se só existir uma resposta elegível, permitir repetição após o ciclo — é um limite da lista, não uma falha do sorteio.
- Se o ciclo persistido tiver palavras que não existem mais na versão ativa, descartá-las e refazer o restante; nunca invalidar uma partida já em andamento por mudança de lista.

O sorteio e o histórico local não fornecem resistência a manipulação pelo usuário. Isso é aceitável para o modo casual sem ranking. Não utilizar estatísticas compartilhadas para alegações competitivas.

## 9. Vocabulário e licenças

Cada idioma deve exportar uma configuração independente:

```ts
interface WordList {
  language: Language;
  version: string;
  minLength: number;
  maxLength: number;
  answers: readonly string[];
  validGuesses: ReadonlySet<string>;
}
```

### Requisitos para os dados

- Respostas em listas curadas; validação pode usar conjunto maior.
- Remover nomes próprios, siglas, abreviações, hifenização, apóstrofos e vocabulário impróprio/raro conforme política editorial do PRD.
- Verificar comprimento, caracteres, duplicatas normalizadas e associação ao idioma em um script/teste automatizado.
- Guardar documentação interna da origem e licença de cada conjunto. Não copiar lista de outro produto nem assumir que um dicionário permite redistribuição.
- Se as listas completas forem grandes, carregar listas do mesmo idioma sob demanda. Não buscar dicionário externo em runtime.
- Falta de configuração ou lista vazia deve produzir erro de desenvolvimento/lançamento identificável, não uma palavra placeholder nem uma partida falsa.

**Bloqueio de lançamento:** confirmar a origem, licença e revisão humana das listas PT-BR e EN antes de publicar.

## 10. Persistência local

### 10.1 Armazenamento

Usar uma chave namespaced, por exemplo `termo2.state`, com JSON contendo `schemaVersion`. Toda leitura deve validar o formato e os invariantes antes de confiar nos dados. Toda escrita deve serializar um snapshot completo.

Operações da camada de armazenamento:

- `loadState(): Result<PersistedState, StorageError>`
- `saveState(state): Result<void, StorageError>`
- `clearProgress(): Result<void, StorageError>` (somente se futuramente existir ação de apagar dados)

O tipo `StorageError` deve distinguir armazenamento indisponível, quota excedida e dados corrompidos. A interface deve apresentar aviso persistente de progresso não salvo e manter a sessão em memória quando a gravação falhar. Não exibir confirmação de salvamento após falha.

### 10.2 Migração e recuperação

- Validar `schemaVersion` no carregamento.
- Implementar migração explícita quando o formato mudar; manter dados desconhecidos não é uma migração válida.
- Se JSON estiver corrompido ou não satisfizer invariantes, não interpretá-lo como partida válida. Mostrar aviso e oferecer reinício seguro do progresso.
- Não apagar progresso automaticamente sem consentimento, exceto se uma recuperação segura claramente exigir substituí-lo após aviso.
- Testar modo privado/armazenamento bloqueado e erros de quota no adaptador.

### 10.3 Troca de idioma e nova partida

- Seleção do idioma é persistida.
- Cada idioma conserva sua própria partida ativa e estatísticas.
- Trocar idioma apenas altera `selectedLanguage`; não finaliza nem modifica outra partida ativa.
- Iniciar uma partida nova quando já existir partida ativa com tentativas pede confirmação acessível antes de substituir.
- Se não houver palpite, pode permitir reiniciar sem confirmação, conforme fluxo de produto.
- Se a partida existente estiver concluída, removê-la do slot de partida ativa quando a pessoa iniciar outra; manter seus dados nas estatísticas.

`localStorage` não sincroniza dispositivos. Se houver duas abas abertas, ouvir o evento `storage`, validar o estado externo e atualizar a UI para refletir a última gravação. Em caso de conflito concorrente, a última gravação prevalece no MVP; não prometer resolução transacional entre abas.

## 11. Estatísticas

Atualizar estatísticas **uma única vez**, na transição `in-progress` → `won` ou `lost`:

- `completedGames += 1`.
- Na vitória: `wins += 1`, `currentStreak += 1`, `bestStreak = max(bestStreak, currentStreak)` e incrementar a posição correspondente em `winsByGuessCount`.
- Na derrota: `currentStreak = 0`.
- Troca de idioma, partida pausada, palpite inválido ou substituição não atualizam estatísticas.

Para evitar contagem dupla após recarregamento, o estado terminal e as estatísticas devem ser atualizados no mesmo objeto antes de gravar um único snapshot. Uma partida terminal não deve voltar à rotina de conclusão em cada render.

## 12. Compartilhamento

Criar um gerador puro `buildShareText(game, language)` que recebe apenas dados de resultado necessários. Formato indicativo:

```text
Termó-2 · PT-BR
Resolvido em 4/6
⬛🟨⬛🟩🟩
```

O formato definitivo pode ser ajustado visualmente, mas:

- Não incluir palavra digitada, resposta, ID interno ou estado serializado.
- Símbolos compartilhados devem manter distinção sem depender exclusivamente da cor.
- Preferir `navigator.share` quando disponível e apropriado.
- Caso indisponível, usar `navigator.clipboard.writeText`; se falhar, expor texto selecionável e informar a falha.
- Mensagens de sucesso e erro são anunciadas e visíveis; não simular cópia concluída.
- Testar vitória e derrota e confirmar que o texto final não contém a resposta.

## 13. Interface e design system — conceito 3

### 13.1 Direção visual

Manter a metáfora de estação de rádio: uma superfície escura, tabuleiro central como instrumento, acentos luminosos e texto curto de “sintonia”. A metáfora nunca substitui a instrução literal. Exemplo: usar “Sintonizar” no botão é aceitável se a interface também explica que a pessoa está enviando um palpite.

### 13.2 Tokens visuais iniciais

Valores iniciais retirados do mockup conceitual; devem ser medidos contra WCAG AA antes de implementação final:

| Token | Valor inicial | Uso |
|---|---:|---|
| `--color-page` | `#101E1B` | Fundo geral |
| `--color-surface` | `#172923` | Cartões e controles |
| `--color-surface-raised` | `#21362E` | Cards internos e estatísticas |
| `--color-text` | `#E9F2DF` | Texto principal |
| `--color-text-muted` | `#A8B8AD` | Metadados e texto secundário |
| `--color-accent` | `#D4F483` | Marca, foco decorativo e ação de idioma selecionado |
| `--color-action` | `#DB765A` | Ação principal |
| `--color-correct` | `#456138` | Fundo de posição correta |
| `--color-present` | `#5D4B26` | Fundo de letra presente em outra posição |
| `--color-absent` | `#34443D` | Fundo de letra ausente |

Usar texto de alto contraste sobre as três cores de pista, mais símbolos distintos:

- correta: `✓` ou círculo preenchido;
- presente em outra posição: seta/setas;
- ausente: traço ou `×`.

Não assumir que os tokens do mockup já satisfazem todos os contrastes. Medir combinações reais de texto, ícones, bordas e foco e corrigir cores se alguma falhar. O botão coral deve usar cor de texto calculada/validada; não fixar texto branco sem verificar contraste.

### 13.3 Tipografia e ativos

- Marca e títulos: tipografia display geométrica, com fallback `system-ui`.
- Letras do tabuleiro: família monoespaçada, para alinhamento consistente.
- Texto de interface: sans-serif legível e com boa altura de x.
- Se forem usadas Space Grotesk, DM Sans ou IBM Plex Mono, self-host os arquivos com licença adequada e fallback local. O jogo deve funcionar sem download de fontes externas.
- Não incluir texturas animadas, sons de rádio ou efeitos piscantes no MVP.

### 13.4 Layout responsivo

- Desktop: área de partida central; painel de estatísticas lateral, subordinado ao tabuleiro.
- Até aproximadamente 760 px: coluna única; estatísticas abaixo da partida ou em painel secundário.
- Tabuleiro centralizado; largura das casas deve respeitar o maior comprimento de palavra (8 letras) sem rolagem horizontal em tela estreita.
- Controles de entrada e envio permanecem juntos e alcançáveis; teclado físico usa campo real de texto.
- Cabeçalho mantém marca, seletor de idioma e ação de nova partida sem sobreposição.
- Garantir zoom até 200% e reflow em largura equivalente a 320 CSS px.

### 13.5 Estados de interface obrigatórios

- Inicial sem partida e ação “Começar”.
- Partida ativa, sem palpite.
- Palpite incompleto, inválido, fora do vocabulário e submetido.
- Partida em andamento com pistas.
- Alternância de idioma com indicação de partida pausada/retomada.
- Confirmação de substituição de partida ativa.
- Vitória e derrota, com resposta e ações pós-jogo.
- Salvamento concluído, não disponível e falhou.
- Compartilhamento copiado, aberto no share sheet ou falhou.

## 14. Acessibilidade

Objetivo de implementação: atender WCAG 2.2 AA nos fluxos do MVP, com teste automatizado e revisão manual. Isso é meta técnica, não declaração de conformidade sem auditoria.

- Usar `<main>`, `<header>`, `<section>`, títulos em hierarquia correta, `<form>`, `<label>` e `<button>` reais.
- Não implementar controles interativos em `<div>` sem comportamento de teclado e sem nome acessível.
- O seletor de idioma pode ser um grupo de botões com `aria-pressed`; refletir idioma selecionado textualmente, sem depender de bandeiras ou só de cor.
- Campo de entrada com rótulo visível ou acessível, `maxlength` adequado e `autocomplete="off"`. Não impedir colar texto, leitores de tela ou métodos de entrada.
- Enter envia palpite enquanto o campo está focado. Não capturar globalmente teclas que bloqueiem navegação do navegador.
- Após um envio, anunciar uma mensagem curta por `aria-live="polite"` com número da tentativa e resumo das pistas. Não anunciar letra por letra durante animação.
- A cada casa avaliada, fornecer nome acessível incluindo letra e estado; a legenda visual também usa símbolos e texto.
- Erros ficam junto ao campo, associados por `aria-describedby` e não desaparecem antes de serem percebidos.
- Foco visível para teclado, sem foco preso; ordem de tabulação acompanha a ordem visual e lógica.
- Contraste de texto normal >= 4.5:1; componentes e sinais gráficos relevantes >= 3:1, validado para os tokens finais.
- Não usar animação como única explicação; respeitar `prefers-reduced-motion`.
- Testes manuais com teclado e pelo menos um leitor de tela, incluindo anúncio de resultado, estado de salvamento e erro de validação.

## 15. Segurança, privacidade e limites

- Não haverá servidor nem coleta analítica remota no MVP.
- O estado local pode conter resposta secreta; qualquer usuário com acesso ao navegador pode inspecioná-lo. Isso é limite conhecido do modo casual.
- Compartilhamento recebe dados derivados do tabuleiro e estado, não o objeto persistido inteiro.
- Não carregar scripts, fontes ou dicionários de terceiros no runtime.
- Dados locais podem ser apagados pelo navegador; informar que não existe sincronização ou backup.
- Como o idioma e estatísticas permanecem no dispositivo, textos de privacidade devem explicar o armazenamento local.
- Nenhum identificador deve ser transmitido; caso telemetria seja adicionada futuramente, requer decisão de produto, avaliação de privacidade, consentimento quando aplicável e atualização do PRD.

## 16. Estratégia de testes

### Testes unitários (domínio)

- Normalização de caixa, NFC/NFD, acentos e `Ç`.
- Contagem correta de letras com diacríticos e grafemas.
- Avaliação de letra correta, presente em outra posição e ausente.
- Letras duplicadas em palpite e resposta, incluindo:
  - resposta `TERMO`, palpite `TERRA`;
  - resposta `BANANA`, palpite `NABABA`;
  - uma letra repetida no palpite cuja resposta contém apenas uma ocorrência.
- Validação de comprimento, idioma, caracteres e vocabulário.
- Transições para vitória na tentativa 1 e 6, derrota na sexta tentativa e rejeição posterior.
- Estatísticas e idempotência de conclusão.
- Ciclos sem repetição, troca de ciclo, última palavra e lista de uma única resposta.

### Testes de integração

- Leitura, gravação, migração e recuperação do `LocalStorage`.
- Erros de segurança/quota apresentados como falha explícita.
- Troca de idioma preserva jogos e separa estatísticas.
- Substituição com confirmação não conta como derrota.
- Reinício após fim preserva estatísticas.
- Texto compartilhável não contém a resposta.

### Testes E2E e manuais

- Primeiro acesso, escolher cada idioma, partida, vitória, derrota e nova rodada.
- Palpite inválido sem consumo de tentativa.
- Trocar idioma e voltar à partida pausada.
- Reabrir a aplicação e restaurar estado.
- Confirmar substituição e cancelar substituição.
- Compartilhamento com API nativa e fallback de clipboard.
- Viewports 320, 390, 768 e 1280 px; verificar ausência de rolagem horizontal.
- Navegação integral por teclado e revisão com leitor de tela.
- Emulação de movimento reduzido e zoom.

### Critérios de qualidade

- Cobertura alta das regras críticas do domínio; cobertura de linhas é informativa, não substitui casos de borda.
- CI executa lint, typecheck, testes unitários/integrados e build antes da publicação.
- Nenhum erro de console durante os fluxos essenciais.
- A auditoria automatizada de acessibilidade complementa, mas não substitui, verificação manual.

## 17. Construção, configuração e publicação

Scripts recomendados no `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Este é um exemplo para a proposta de stack; ajustar a invocação do TypeScript, configuração de projetos e ferramentas aos manifests efetivamente criados.

- Produzir build estático com rotas de fallback não necessárias para o MVP.
- Hospedar em qualquer serviço de conteúdo estático que entregue HTTPS.
- Não exigir variáveis de ambiente secretas: não há backend.
- Definir `lang="pt-BR"` para interface principal em português e atualizar para `en` ou `en-US` quando a interface for exibida em inglês.
- Configurar cabeçalhos de segurança no host quando disponível, especialmente Content Security Policy compatível com os assets e `frame-ancestors`; evitar scripts inline para facilitar CSP.
- Validar o build final em HTTPS, pois APIs de compartilhamento/clipboard podem exigir contexto seguro.

## 18. Fases de implementação e dependências

### Fase 0 — preparação

- Aprovar stack recomendada.
- Escolher hospedagem estática e navegadores-alvo.
- Resolver origem/licença e curadoria das listas PT-BR e EN.
- Decidir se o nome público será “Termo-2” ou “Termó-2”; o protótipo usa ambas as grafias em lugares diferentes e a marca precisa ser padronizada.

### Fase 1 — domínio e vocabulário

- Criar tipos, normalização, avaliação, validação, seleção sem repetição e estatísticas.
- Preparar listas de palavras com validação automatizada.
- Testar minuciosamente acentos, cedilha e duplicatas.

### Fase 2 — persistência e ações

- Implementar armazenamento versionado, recuperação e tratamento explícito de erros.
- Adicionar casos de uso para iniciar, enviar palpite, trocar idioma e concluir.
- Testar pausa, retomada e substituição.

### Fase 3 — interface conceito 3

- Converter a direção visual de [mockups.html](./mockups.html) em uma aplicação semântica e modular.
- Implementar tokens dark, tabuleiro responsivo, indicadores simbólicos e estados de UI.
- Adicionar mensagens de leitor de tela, foco, legenda e estados de salvamento.

### Fase 4 — pós-jogo e validação

- Construir painel de resultado, estatísticas e compartilhamento.
- Executar testes automatizados, acessibilidade manual e matriz responsiva.
- Corrigir contraste/fluxos identificados e validar build em hospedagem de teste.

## 19. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Lista de palavras pequena ou sem licença clara | Bloqueio de lançamento e repetição rápida | Confirmar direitos e revisão editorial antes de carregar conteúdo |
| Seis tentativas em palavras de tamanhos diferentes | Dificuldade irregular | Coletar feedback de teste e ajustar seleção/faixas sem quebrar as regras |
| Acentos e caracteres Unicode contados incorretamente | Palpites rejeitados ou feedback errado | Usar normalização e segmentação testadas com casos PT-BR |
| `LocalStorage` indisponível ou corrompido | Perda do progresso | Aviso explícito, recuperação segura e testes de falha |
| Resposta inspecionável no cliente | Usuário pode trapacear | Declarar limite do modo casual; não criar ranking competitivo sem backend |
| Contraste inadequado na paleta escura | Baixa legibilidade | Medir cada estado final; ajustar os tokens, não depender da cor |
| Prototipagem demonstrativa tomada como produto pronto | Comportamentos falsos ou incompletos | Não reutilizar dados/funções de demonstração como persistência ou analytics |

## 20. Definição de pronto

O MVP técnico pode ser considerado pronto para avaliação quando:

- Os critérios de aceitação do [PRD](./PRD.md) estiverem cobertos por testes ou verificação manual.
- Listas e licenças estiverem resolvidas para os dois idiomas.
- Todas as transições de jogo e atualização de estatísticas forem determinísticas e testadas.
- Falhas de persistência e compartilhamento tiverem mensagens claras.
- O resultado compartilhável não expuser resposta ou palpites.
- A aplicação funcionar em celular e desktop, por teclado e toque, e tiver sido revisada com leitor de tela.
- O contraste da paleta do conceito 3 tiver sido validado após ajustes finais.
- Build e testes passarem em integração contínua e a aplicação for verificada em uma hospedagem HTTPS.
