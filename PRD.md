# PRD — Jogo casual de adivinhação de palavras

**Status:** rascunho inicial  
**Plataforma inicial:** web responsiva  
**Idiomas do MVP:** português do Brasil e inglês  
**Monetização do MVP:** gratuita, sem anúncios

## 1. Visão do produto

Criar um jogo casual, rápido e fácil de aprender em que a pessoa tenta descobrir uma palavra secreta usando um número limitado de palpites. Cada palpite válido fornece pistas sobre as letras presentes e suas posições.

O produto deve oferecer partidas aleatórias ilimitadas em português do Brasil e inglês, com vocabulário e regras de validação apropriados a cada idioma. A experiência deve funcionar em celulares e computadores, permitir retomar uma partida em andamento e apresentar resultados compartilháveis sem revelar a resposta.

## 2. Problema e oportunidade

Jogos de palavras podem oferecer um desafio curto, compreensível sem tutorial extenso e que convida a jogar novamente. O produto busca combinar esse ciclo simples com escolha de idioma, palavras adequadas a cada língua e progresso local, sem exigir conta ou introduzir anúncios no MVP.

## 3. Objetivos

- Permitir iniciar e concluir partidas curtas com poucas etapas.
- Tornar as regras de tentativa e de feedback previsíveis.
- Oferecer listas adequadas separadamente para português do Brasil e inglês.
- Permitir partidas aleatórias ilimitadas sem repetição de resposta até esgotar a lista do idioma.
- Preservar partidas em andamento e estatísticas no mesmo navegador.
- Permitir compartilhar um resumo de resultado sem expor a palavra secreta.
- Atender ao uso em telas móveis e desktop e oferecer alternativas ao feedback dependente apenas de cor.

## 4. Não objetivos do MVP

- Desafios diários sincronizados entre todos os jogadores.
- Contas, perfis, autenticação ou sincronização entre dispositivos.
- Anúncios, pagamentos, assinaturas ou compras no aplicativo.
- Multiplayer, placares globais ou competição em tempo real.
- Modos com múltiplas palavras, categorias, temas ou grades de busca.
- Editor de palavras ou ferramenta pública de criação de desafios.

## 5. Público e contexto de uso

O jogo é destinado a pessoas que gostam de jogos casuais de vocabulário e querem jogar por alguns minutos, em celular ou computador. A pessoa pode conhecer o idioma escolhido em diferentes níveis; por isso, as respostas devem privilegiar palavras comuns e o jogo deve comunicar claramente quando um palpite não é aceito.

## 6. Escopo funcional

### 6.1 Seleção de idioma e início de partida

- A pessoa escolhe **Português (Brasil)** ou **English** antes de iniciar uma partida.
- O idioma pode ser trocado a qualquer momento.
- O tamanho das palavras varia por idioma:
  - Português do Brasil: de 4 a 8 letras.
  - Inglês: de 4 a 7 letras.
- Toda partida oferece seis tentativas válidas, independentemente do tamanho da palavra.
- O jogo escolhe uma palavra aleatória do conjunto de respostas do idioma selecionado.
- A interface informa o idioma e o número de letras da resposta antes e durante a partida.

### 6.2 Partida

- A pessoa digita um palpite e o envia para avaliação.
- Um palpite deve ter o tamanho exigido pela partida e estar entre as palavras aceitas para aquele idioma. Em português, o jogo também usa um dicionário offline ampliado.
- Palpites inválidos não consomem tentativa e recebem uma mensagem clara explicando o motivo.
- Cada palpite válido consome uma tentativa e apresenta o resultado de todas as suas letras.
- A pessoa vence ao acertar a palavra; perde quando utiliza as seis tentativas sem acertar.
- Ao concluir, o jogo revela a resposta e apresenta o resultado da partida.

### 6.3 Avaliação das letras

A comparação deve considerar a quantidade de ocorrências de cada letra, sem indicar mais ocorrências do que existem na resposta:

1. Marcar primeiro as letras corretas na posição correta.
2. Das ocorrências ainda não contabilizadas, marcar como presentes as letras existentes em outras posições.
3. Marcar como ausentes as ocorrências restantes.

Em português, a comparação normaliza diacríticos: **A** equivale a **Á**, **À**, **Â** e **Ã**; **C** equivale a **Ç**. A resposta revelada usa a grafia original, com acentos e cedilha. A normalização usada na comparação não deve alterar a grafia exibida na resposta.

### 6.4 Troca de idioma e partidas em andamento

- O jogo mantém no máximo uma partida em andamento por idioma.
- Ao trocar de idioma, a partida atual é salva e pausada; a interface abre a partida em andamento do idioma escolhido, se existir.
- Ao iniciar uma nova partida em um idioma que já tenha uma partida em andamento, essa partida anterior é substituída.
- Uma partida substituída ou abandonada não é registrada como vitória nem derrota e não altera sequências ou distribuição de palpites.
- Partidas concluídas não podem ser retomadas como partidas em andamento.

### 6.5 Seleção e política de palavras

- Cada idioma tem uma lista curada de respostas, distinta das palavras aceitas como palpites. Em português do Brasil, os palpites válidos também usam um vocabulário offline aberto e ampliado; em inglês, permanece a lista curada atual.
- O dicionário offline é uma fonte finita e pode não conter todas as flexões, neologismos ou palavras raras do português.
- A seleção de respostas deve evitar repetir qualquer palavra até que todas as respostas elegíveis daquele idioma tenham sido usadas.
- Ao iniciar um novo ciclo da lista, as respostas são embaralhadas e a última resposta do ciclo anterior não deve ser escolhida imediatamente de novo.
- As listas de respostas priorizam vocabulário comum e reconhecível para o idioma e público correspondentes.
- Respostas não podem ser nomes próprios, siglas, abreviações, palavras com hífen ou apóstrofo, nem termos raros, arcaicos ou ofensivos.
- Palpites podem incluir formas flexionadas válidas que não estejam na lista de respostas.
- As listas devem ser separadas por idioma; um palpite válido em um idioma não é automaticamente válido no outro.

### 6.6 Resultado, estatísticas e compartilhamento

- Ao terminar a partida, mostrar vitória ou derrota, resposta correta e número de tentativas utilizadas.
- Manter estatísticas locais, separadas por idioma:
  - partidas concluídas;
  - vitórias;
  - sequência atual de vitórias;
  - melhor sequência de vitórias;
  - distribuição das vitórias pelo número de tentativas.
- Uma vitória aumenta a sequência atual e pode atualizar a melhor sequência.
- Uma derrota encerra a sequência atual.
- Partidas pausadas, abandonadas ou substituídas não afetam estatísticas.
- Oferecer um resumo copiável/compartilhável que indique o idioma, o resultado e a sequência de pistas sem revelar a palavra.
- O conteúdo compartilhado não pode incluir a resposta secreta, nem dados que a revelem diretamente.

### 6.7 Persistência

- Partidas em andamento e estatísticas são armazenadas localmente no navegador/dispositivo, sem exigir conta.
- O jogo deve restaurar os dados locais ao reabrir a página no mesmo navegador e dispositivo.
- O MVP não sincroniza dados entre navegadores ou dispositivos.
- Se não for possível salvar ou restaurar dados locais, informar à pessoa que o progresso pode não persistir; não apresentar o salvamento como concluído.

## 7. Acessibilidade e usabilidade

- O jogo deve funcionar em telas móveis e desktop, com controles utilizáveis por toque, mouse e teclado.
- Informações e ações não devem depender exclusivamente de cor. A cor pode continuar sendo o sinal principal das pistas, acompanhada por um indicador visual redundante, como símbolo ou padrão, e por rótulos acessíveis para tecnologias assistivas.
- Texto e controles devem ter contraste suficiente, foco visível e nomes acessíveis.
- Mensagens de validação, estado da partida e resultado devem ser compreensíveis sem depender apenas de animações ou efeitos visuais.
- A interface deve continuar utilizável com zoom e em larguras de tela reduzidas.

## 8. Requisitos não funcionais

- A interface deve adaptar-se a celulares e computadores sem exigir instalação.
- A avaliação de palpites deve ocorrer sem atraso perceptível após o envio.
- A partida deve permanecer jogável sem uma conta de usuário.
- A palavra secreta não deve ser exposta no texto do resumo compartilhado.
- A implementação deve garantir que os dados privados da partida não sejam incluídos acidentalmente em conteúdo de compartilhamento ou telemetria.
- O produto deve apresentar claramente falhas de persistência, em vez de sugerir que o progresso foi salvo.

## 9. Fluxos principais

### Primeira partida

1. A pessoa abre o jogo.
2. Escolhe português do Brasil ou inglês.
3. Inicia uma partida e vê o número de letras e as seis tentativas disponíveis.
4. Digita e envia palpites válidos até acertar ou esgotar as tentativas.
5. Vê a resposta e o resultado; pode compartilhar o resumo ou iniciar outra partida.

### Alternar idioma durante uma partida

1. A pessoa inicia uma partida em um idioma e faz pelo menos um palpite válido.
2. Troca de idioma.
3. A partida anterior é salva e pausada sem alterar estatísticas.
4. O jogo abre a partida já existente no novo idioma ou permite iniciar uma.
5. Ao voltar ao idioma inicial, a partida é restaurada com a mesma resposta e tentativas já feitas.

### Iniciar outra partida no mesmo idioma

1. Existe uma partida em andamento naquele idioma.
2. A pessoa escolhe iniciar uma nova.
3. O jogo informa que a partida atual será substituída e pede confirmação.
4. Após confirmação, a nova partida começa; a partida anterior não altera estatísticas.

## 10. Critérios de aceitação do MVP

- É possível iniciar partidas em português do Brasil e em inglês.
- Todas as respostas respeitam o intervalo de tamanho definido para seu idioma.
- Cada partida permite exatamente seis palpites válidos; palpites inválidos não consomem tentativa.
- Palpites com letras repetidas recebem feedback correto segundo a contagem por ocorrência.
- A comparação em português normaliza acentos e cedilha conforme definido neste documento.
- As pistas comunicam letras corretas, presentes em outra posição e ausentes, sem depender apenas da cor.
- A troca de idioma pausa e restaura a partida correspondente, sem misturar respostas ou estatísticas.
- Iniciar outra partida substitui a partida em andamento somente após confirmação.
- As estatísticas são separadas por idioma e partidas não concluídas não são contabilizadas.
- O resumo compartilhado não revela a resposta.
- Uma partida e as estatísticas persistem após fechar e reabrir a página no mesmo navegador, quando o armazenamento local está disponível.
- O layout e os controles são utilizáveis em telas móveis e desktop, por teclado e por toque.

## 11. Métricas para avaliar o produto

No MVP, acompanhar métricas de forma compatível com a decisão de não exigir conta e com a política de privacidade a definir. Métricas úteis para validação incluem:

- taxa de conclusão de partidas iniciadas;
- proporção de vitórias e distribuição de tentativas;
- frequência de início de outra partida após concluir uma;
- uso de cada idioma;
- falhas de validação de palpites e falhas de persistência.

Essas métricas são propostas para avaliação; coleta remota, consentimento, retenção e anonimização de dados precisam ser definidos antes de qualquer instrumentação analítica.

## 12. Riscos e decisões abertas

- **Equilíbrio da dificuldade:** seis tentativas podem ser mais fáceis para palavras curtas e mais difíceis para palavras longas. Validar as faixas e listas com testes de jogo.
- **Qualidade do vocabulário:** a experiência depende de listas confiáveis, mantidas e apropriadas a cada idioma.
- **Privacidade e análise:** não foi decidido se haverá telemetria. O MVP pode medir localmente sem enviar dados; qualquer coleta remota exige decisão e comunicação próprias.
- **Suporte a browsers e dispositivos:** definir a matriz de navegadores e versões mínimas durante o desenho técnico.
- **Feedback de letras repetidas e acentos:** incluir casos de teste explícitos para garantir comportamento uniforme nos dois idiomas.
- **Acessibilidade visual:** o feedback apenas por cores foi considerado, mas este PRD exige uma representação redundante para manter as pistas perceptíveis a mais pessoas.
