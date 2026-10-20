# Termó-2

Jogo casual de adivinhação de palavras em português do Brasil e inglês. A interface segue o conceito visual **Estação de sintonia**; regras de produto estão em [PRD.md](./PRD.md) e a proposta de implementação em [PROJETO-TECNICO.md](./PROJETO-TECNICO.md).

## Desenvolvimento

Requer Node.js e npm.

```sh
npm install
npm run dev
```

## Verificação

```sh
npm run typecheck
npm test
npm run build
```

O jogo funciona sem conta ou backend. Partidas e estatísticas são guardadas no armazenamento local do navegador. As listas iniciais e o estado de revisão editorial/licença estão documentados em [src/data/README.md](./src/data/README.md).
