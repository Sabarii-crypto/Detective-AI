# AI Mystery Room

A single-player mystery investigation game built with React, Vite, TypeScript, Express and Gemini. The server keeps the answer key private and validates game actions. If Gemini is not configured, the app uses a deterministic built-in case so the complete game remains playable.

## Run locally

1. Install Node.js 20.19 or newer (or Node.js 22 or newer).
2. From this directory run `npm install`.
3. Set `MONGODB_URI` in the server environment. Optionally set `GEMINI_API_KEY` for Gemini-generated cases and interrogation responses.
4. Run `npm run dev`, then open the client URL printed by Vite (usually `http://localhost:5173`).

The server listens on port 4000 by default and waits for MongoDB to connect before accepting requests. Mysteries, suspects, clues, game progress and player actions are stored in MongoDB.

For local development, put `MONGODB_URI` and (optionally) `GEMINI_API_KEY` in `server/.env`. Use a MongoDB Atlas connection string or a local MongoDB URI. Never commit `.env` files or place server secrets in `VITE_` variables.

## Deploy

The repository is an npm workspace monorepo. Keep the project root as the repository root on both hosts.

### Vercel (frontend)

- Framework preset: **Vite**
- Root directory: `.` (repository root)
- Install command: `npm ci`
- Build command: `npm run build --workspace client`
- Output directory: `client/dist`
- Environment variable: `VITE_API_URL` = the public Render service URL, for example `https://your-service.onrender.com` (no trailing slash and no `/api` suffix)

The frontend uses relative `/api` requests locally and prefixes them with `VITE_API_URL` in production. Redeploy the frontend after changing this variable.

### Render (backend)

Create a **Web Service** from the same GitHub repository:

- Root directory: `.` (repository root)
- Runtime: Node
- Build command: `npm ci && npm run build --workspace server`
- Start command: `npm run start --workspace server`
- Set Node version to 20.19 or newer in the service environment (for example `NODE_VERSION=22`).

Configure these Render environment variables:

| Variable | Value |
| --- | --- |
| `CLIENT_ORIGIN` | The deployed Vercel origin, e.g. `https://your-project.vercel.app` (no trailing slash) |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Your Gemini API key; optional, but required for AI-generated cases and Gemini-powered interrogations |
| `GEMINI_MODEL` | Optional; defaults to `gemini-2.5-flash` |

Render supplies `PORT`; the server already listens on it. The health endpoint is `/api/health`.

Keep `GEMINI_API_KEY` only in Render's server environment. Do not add it to Vercel or use a `VITE_` variable for it. The client bundle cannot access server environment variables.

### MongoDB Atlas

Add the Render service's outbound network access to your Atlas network access list, or use an Atlas network rule that allows Render to connect. The server will not start if `MONGODB_URI` is missing or the initial connection fails. The health endpoint `/api/health` reports whether MongoDB is connected.

The server stores data in four collections: `mysteries`, `suspects`, `clues`, and `gamesessions`. Existing game URLs continue to identify sessions after a server restart because session state is read from MongoDB. `MONGODB_URI` and `GEMINI_API_KEY` are server-only values and must not be configured in Vercel.

## Project layout

- `client/` React interface and API client
- `server/` Express routes, MongoDB models and persistence, validation and Gemini integration
- `specs.md` product requirements
