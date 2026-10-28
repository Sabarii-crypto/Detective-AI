# AI Mystery Room

A single-player mystery investigation game built with React, Vite, TypeScript, Express and Gemini. The server keeps the answer key private and validates all game actions. If Gemini is not configured, the app uses a deterministic built-in case so the complete game remains playable.

## Run locally

1. Install Node.js 20 or newer.
2. From this directory run `npm install`.
3. Copy `server/.env.example` to `server/.env` and optionally set `GEMINI_API_KEY`.
4. Run `npm run dev`, then open the client URL printed by Vite (usually `http://localhost:5173`).

The server listens on port 4000 by default. MongoDB is optional for this MVP; games live in server memory and reset when the server restarts. Set `MONGODB_URI` when you want to connect an Atlas database in a future persistence iteration.

## Project layout

- `client/` React interface and API client
- `server/` Express routes, game state, validation and Gemini integration
- `specs.md` product requirements

The Gemini key is read only by the server. Never put it in a `VITE_` variable.
