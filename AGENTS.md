# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## What this project is

A Visual Studio Code extension that integrates [packwerk](https://github.com/Shopify/packwerk) checks directly into the editor. It runs `packwerk check` (or `pks check`) on the current Ruby file and surfaces violations inline.

## Commands

```bash
npm install

# Compile TypeScript
npm run vscode:prepublish   # production compile (tsc)

# Watch mode during development
npm run compile             # tsc --watch

# Run tests
npm test
```

## Architecture

- `src/` — TypeScript source; extension entry point registers a command that shells out to the packwerk/pks binary and parses its output into VS Code diagnostics
- `package.json` — declares the VS Code extension manifest, activation events, and contributed commands
