# AI Mystery Room

A single-player mystery investigation game built with React, Vite, TypeScript, Express and Gemini. The server keeps the answer key private and validates game actions. If Gemini is not configured, the app uses a deterministic built-in case so the complete game remains playable.

## Run locally

1. Install Node.js 20.19 or newer (or Node.js 22 or newer).
2. From this directory run `npm install`.
3. Set `MONGODB_URI` and a long random `JWT_SECRET` in the server environment. Optionally set `GEMINI_API_KEY` for Gemini-generated cases and interrogation responses.
4. Run `npm run dev`, then open the client URL printed by Vite (usually `http://localhost:5173`).

The server listens on port 4000 by default and waits for MongoDB to connect before accepting requests. Mysteries, suspects, clues, game progress and player actions are stored in MongoDB.

For local development, put `MONGODB_URI`, `JWT_SECRET` and (optionally) `GEMINI_API_KEY` in `server/.env`. Use a MongoDB Atlas connection string or a local MongoDB URI. `JWT_SECRET` should be a cryptographically random value of at least 32 bytes. Never commit `.env` files or place server secrets in `VITE_` variables.

Sign up at `/signup`, then log in at `/login`. The API stores a signed JWT in a seven-day HttpOnly cookie; the browser JavaScript cannot read it. Local development uses a same-site cookie. For the separate Vercel and Render domains, production cookies use `Secure` and `SameSite=None`, and the API enables credentialed CORS for the configured frontend origin. Logging out clears the cookie. Game API routes require a valid session and scope every read or change to the authenticated account.

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
| `NODE_ENV` | Set to `production` on Render so cross-domain session cookies use `Secure; SameSite=None` |
| `JWT_SECRET` | A long random signing secret (at least 32 random bytes); keep only on Render |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Your Gemini API key; optional, but required for AI-generated cases and Gemini-powered interrogations |
| `GEMINI_MODEL` | Optional; defaults to `gemini-2.5-flash` |

Render supplies `PORT`; the server already listens on it. The health endpoint is `/api/health`.

Keep `JWT_SECRET`, `MONGODB_URI`, and `GEMINI_API_KEY` only in Render's server environment. Do not add them to Vercel or use a `VITE_` variable for them. The client bundle cannot access server environment variables. Configure `CLIENT_ORIGIN` to the exact Vercel origin (or comma-separated allowed origins if you use preview deployments).

### MongoDB Atlas

Add the Render service's outbound network access to your Atlas network access list, or use an Atlas network rule that allows Render to connect. The server will not start if `MONGODB_URI` is missing or the initial connection fails. The health endpoint `/api/health` reports whether MongoDB is connected.

The server stores data in four collections: `mysteries`, `suspects`, `clues`, and `gamesessions`. Existing game URLs continue to identify sessions after a server restart because session state is read from MongoDB. `MONGODB_URI` and `GEMINI_API_KEY` are server-only values and must not be configured in Vercel.

The frontend's **My Cases** archive lists saved game sessions, including their creation date and whether they are active or complete. Use **Continue Case** to reopen a session; refreshing the page returns to the archive rather than starting a new mystery.

### Authentication data and existing cases

Users are stored in the `users` collection with a unique normalized email and bcrypt password hash. New game sessions have an `ownerId` reference to their user. Existing sessions without `ownerId` are intentionally hidden from all accounts. To migrate legacy data, have an administrator identify the intended account's MongoDB `_id` and update only the approved session records with that `ownerId` in Atlas (for example, a filtered `updateMany` against known legacy game IDs). Do not assign all ownerless sessions to the first new account. Mystery, suspect, clue, and session progress records remain linked by their existing mystery/session IDs.

### Local authentication checks

Run `npm run build` to build both workspaces. With MongoDB reachable and `MONGODB_URI`/`JWT_SECRET` set, run `npm run dev` and verify signup, duplicate-email rejection, login, invalid-password rejection, logout, refresh restoration, and game ownership using two separate accounts. The API exposes `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout`; protected game requests return `401` without a session and `404` for a game that is not owned by the signed-in user.

## Project layout

- `client/` React interface and API client
- `server/` Express routes, MongoDB models and persistence, validation and Gemini integration
- `specs.md` product requirements
