# Palavras e fontes

As respostas em `words.pt-BR.ts` e `words.en.ts` são pequenos conjuntos escolhidos manualmente. O português também usa um vocabulário offline ampliado para validar palpites.

## Palpites em português do Brasil

`pt-BR-words.txt` é um subconjunto normalizado de 4–8 letras do dicionário
Hunspell brasileiro mantido pelo projeto de dicionários do LibreOffice. Ele é
incluído na aplicação e não exige conexão de rede durante uma partida.

- Fonte: [`pt_BR.dic`](https://github.com/LibreOffice/dictionaries/blob/67032ee957631908098a72edf48dc81cac27e369/pt_BR/pt_BR.dic), commit `67032ee957631908098a72edf48dc81cac27e369`.
- Crédito: Raimundo Santos Moura e comunidade VERO, conforme o [README da fonte](https://github.com/LibreOffice/dictionaries/blob/67032ee957631908098a72edf48dc81cac27e369/pt_BR/README_en.txt).
- Licença declarada pela fonte: [LGPLv3](https://www.gnu.org/licenses/lgpl-3.0.html) e [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/).
- Preparação: remoção das flags Hunspell, palavras com pontuação ou maiúsculas excluídas, diacríticos removidos e comprimento limitado a 4–8 letras.

O arquivo não expande as regras de afixos Hunspell. Por isso, ainda pode não
conter algumas flexões, neologismos, palavras raras ou outras palavras
portuguesas válidas. As respostas continuam na lista curada de `words.pt-BR.ts`.

## Inglês

`words.en.ts` contém a seleção manual inicial do projeto; os palpites válidos
continuam limitados a essa lista.

Qualquer ampliação baseada em corpus externo deve registrar a fonte, a versão e
a licença, e só deve ser incorporada depois de confirmar que a redistribuição
é permitida.
