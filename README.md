# AI Mystery Room

A single-player mystery investigation game built with React, Vite, TypeScript, Express and Gemini. The server keeps the answer key private and validates game actions. If Gemini is not configured, the app uses a deterministic built-in case so the complete game remains playable.

## Run locally

1. Install Node.js 20 or newer.
2. From this directory run `npm install`.
3. Optionally set `GEMINI_API_KEY` in the server environment.
4. Run `npm run dev`, then open the client URL printed by Vite (usually `http://localhost:5173`).

The server listens on port 4000 by default. Games live in server memory and reset when the server restarts.

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
- Set Node version to 20 or newer in the service environment (for example `NODE_VERSION=20`).

Configure these Render environment variables:

| Variable | Value |
| --- | --- |
| `CLIENT_ORIGIN` | The deployed Vercel origin, e.g. `https://your-project.vercel.app` (no trailing slash) |
| `GEMINI_API_KEY` | Your Gemini API key; optional, but required for AI-generated cases and Gemini-powered interrogations |
| `GEMINI_MODEL` | Optional; defaults to `gemini-2.5-flash` |

Render supplies `PORT`; the server already listens on it. The health endpoint is `/api/health`.

Keep `GEMINI_API_KEY` only in Render's server environment. Do not add it to Vercel or use a `VITE_` variable for it. The client bundle cannot access server environment variables.

### MongoDB Atlas

The current application does not connect to MongoDB. There is no MongoDB driver, connection code, or `MONGODB_URI` usage; game state is held in a server-side in-memory `Map`. Creating an Atlas cluster or setting a MongoDB URI will have no effect until persistence is implemented. Games reset when the Render process restarts, and separate server instances do not share game state.

## Project layout

- `client/` React interface and API client
- `server/` Express routes, game state, validation and Gemini integration
- `specs.md` product requirements
