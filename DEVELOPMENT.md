# Development

[Back to the game overview](README.md)

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:8080.

## Build the submission ZIP

From the repository root, run:

```sh
npm install
npm run zip
npm run size
```

`npm run zip` checks TypeScript, builds the production game, and creates `build/game.zip`. `npm run size` verifies the 13,312-byte limit.

Submit `build/game.zip`. It contains a self-contained `index.html` directly at the archive root, as required by the [js13kGames rules](https://js13kgames.com/2026/rules). The generated HTML lives at `build/index.html` in this repository; the rule applies to the ZIP layout, not the source repository layout.
