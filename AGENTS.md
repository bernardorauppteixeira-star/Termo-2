# Project Guidelines

## Product documents

- PRDs must always be created from the current project root at `docs/plans/{{YYYY-MM-DD}}-{{description}}.md`.

## Architecture and references

- Follow [PRD.md](./PRD.md), [PROJETO-TECNICO.md](./PROJETO-TECNICO.md), and the concept 3 reference in [mockups.html](./mockups.html).
- Keep game rules independent from DOM rendering and browser storage.
- Keep word lists separated by language; do not add remotely sourced lists without verifying their redistribution license.
- Treat local storage as untrusted input and report persistence failures visibly.

## Build and test

- Install dependencies with `npm install`.
- Run `npm run typecheck`, `npm test`, and `npm run build` before completing code changes.
