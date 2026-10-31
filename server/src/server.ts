import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose, { type HydratedDocument } from 'mongoose';
import { randomUUID } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { generateMystery } from './mystery.js';
import { ClueModel, GameSessionModel, MysteryModel, SuspectModel } from './models.js';
import type { ClueRecord, GameSessionRecord, MysteryRecord, SuspectRecord } from './models.js';
import type { Game, Mystery } from './types.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: true, legacyHeaders: false }));

type LoadedGame = { game: Game; session: HydratedDocument<GameSessionRecord> };

const route = (fn: (req: express.Request, res: express.Response) => Promise<void> | void) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

function gameFromRecords(
  session: HydratedDocument<GameSessionRecord>,
  mystery: MysteryRecord,
  suspects: SuspectRecord[],
  clues: ClueRecord[],
): Game {
  const caseData: Mystery = {
    title: mystery.title,
    introduction: mystery.introduction,
    description: mystery.description,
    suspects: suspects.map((suspect) => ({
      id: suspect.id,
      name: suspect.name,
      role: suspect.role,
      background: suspect.background,
      relationship: suspect.relationship,
      motive: suspect.motive,
      initialStatement: suspect.initialStatement,
      alibi: suspect.alibi,
      knowledge: suspect.knowledge,
    })),
    clues: clues.map((clue) => ({
      id: clue.id,
      title: clue.title,
      description: clue.description,
      location: clue.location,
      relevance: clue.relevance,
      isDiscoverable: clue.isDiscoverable,
    })),
    timeline: mystery.timeline,
    culpritId: mystery.culpritId,
    solution: mystery.solution,
    motive: mystery.motive,
    decisiveClueIds: mystery.decisiveClueIds,
    hints: mystery.hints,
  };

  return {
    id: session.id,
    mystery: caseData,
    discoveredClueIds: session.discoveredClueIds,
    interrogationHistory: session.interrogationHistory,
    hintsUsed: session.hintsUsed,
    status: session.status,
    accusedSuspectId: session.accusedSuspectId,
    correct: session.correct,
    score: session.score,
    createdAt: session.createdAt.toISOString(),
  };
}

function publicGame(game: Game) {
  return {
    id: game.id,
    title: game.mystery.title,
    introduction: game.mystery.introduction,
    description: game.mystery.description,
    suspects: game.mystery.suspects.map(({ knowledge: _knowledge, ...suspect }) => suspect),
    clues: game.mystery.clues.map(({ relevance: _relevance, ...clue }) => ({
      ...clue,
      discovered: game.discoveredClueIds.includes(clue.id),
    })),
    timeline: game.mystery.timeline,
    discoveredClueIds: game.discoveredClueIds,
    hintsUsed: game.hintsUsed,
    status: game.status,
  };
}

async function loadGame(id: string): Promise<LoadedGame | null> {
  const session = await GameSessionModel.findOne({ id });
  if (!session) return null;

  const [mystery, suspects, clues] = await Promise.all([
    MysteryModel.findOne({ id: session.mysteryId }).lean(),
    SuspectModel.find({ mysteryId: session.mysteryId }).sort({ order: 1 }).lean(),
    ClueModel.find({ mysteryId: session.mysteryId }).sort({ order: 1 }).lean(),
  ]);
  if (!mystery) return null;

  return { game: gameFromRecords(session, mystery, suspects, clues), session };
}

async function saveMystery(mysteryId: string, mystery: Mystery): Promise<void> {
  await MysteryModel.create({ id: mysteryId, ...mystery });
  try {
    await Promise.all([
      SuspectModel.insertMany(mystery.suspects.map((suspect, order) => ({ ...suspect, mysteryId, order }))),
      ClueModel.insertMany(mystery.clues.map((clue, order) => ({ ...clue, mysteryId, order }))),
    ]);
  } catch (error) {
    await Promise.allSettled([
      MysteryModel.deleteOne({ id: mysteryId }),
      SuspectModel.deleteMany({ mysteryId }),
      ClueModel.deleteMany({ mysteryId }),
    ]);
    throw error;
  }
}

function resultFor(game: Game, includeFullClues = false) {
  return {
    correct: game.correct,
    accusedSuspectId: game.accusedSuspectId,
    culpritId: game.mystery.culpritId,
    culpritName: game.mystery.suspects.find((suspect) => suspect.id === game.mystery.culpritId)?.name,
    solution: game.mystery.solution,
    motive: game.mystery.motive,
    decisiveClues: game.mystery.clues
      .filter((clue) => game.mystery.decisiveClueIds.includes(clue.id))
      .map((clue) => includeFullClues ? clue : ({ id: clue.id, title: clue.title, description: clue.description })),
    hintsUsed: game.hintsUsed,
    score: game.score,
  };
}

app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ ok: connected });
});

app.post('/api/mysteries/generate', route(async (_req, res) => {
  let mystery: Mystery;
  try {
    mystery = await generateMystery();
  } catch {
    res.status(502).json({ error: 'We couldn’t create a case right now. Please try again.' });
    return;
  }

  const mysteryId = randomUUID();
  const gameId = randomUUID();
  await saveMystery(mysteryId, mystery);
  const session = await GameSessionModel.create({ id: gameId, mysteryId });
  res.status(201).json(publicGame(gameFromRecords(
    session,
    { id: mysteryId, ...mystery },
    mystery.suspects.map((suspect, order) => ({ ...suspect, mysteryId, order })),
    mystery.clues.map((clue, order) => ({ ...clue, mysteryId, order })),
  )));
}));

app.get('/api/games/:gameId', route(async (req, res) => {
  const loaded = await loadGame(req.params.gameId);
  if (!loaded) {
    res.status(404).json({ error: 'Game not found. Start a new mystery to play.' });
    return;
  }
  res.json(publicGame(loaded.game));
}));

app.get('/api/games/:gameId/suspects', route(async (req, res) => {
  const loaded = await loadGame(req.params.gameId);
  if (!loaded) {
    res.status(404).json({ error: 'Game not found. Start a new mystery to play.' });
    return;
  }
  res.json({ suspects: publicGame(loaded.game).suspects });
}));

app.post('/api/games/:gameId/clues/:clueId/discover', route(async (req, res) => {
  const loaded = await loadGame(req.params.gameId);
  if (!loaded) {
    res.status(404).json({ error: 'Game not found. Start a new mystery to play.' });
    return;
  }
  const { game, session } = loaded;
  if (game.status !== 'active') {
    res.status(409).json({ error: 'This case is already closed.' });
    return;
  }
  const clue = game.mystery.clues.find((item) => item.id === req.params.clueId);
  if (!clue || !clue.isDiscoverable) {
    res.status(404).json({ error: 'That clue is not available.' });
    return;
  }
  if (!game.discoveredClueIds.includes(clue.id)) {
    session.discoveredClueIds.push(clue.id);
    await session.save();
  }
  res.json({
    clue: { ...clue, discovered: true },
    discoveredClueIds: session.discoveredClueIds,
  });
}));

app.post('/api/games/:gameId/interrogate', route(async (req, res) => {
  const loaded = await loadGame(req.params.gameId);
  if (!loaded) {
    res.status(404).json({ error: 'Game not found. Start a new mystery to play.' });
    return;
  }
  const { game, session } = loaded;
  if (game.status !== 'active') {
    res.status(409).json({ error: 'This case is already closed.' });
    return;
  }
  const parsed = z.object({
    suspectId: z.string().min(1),
    question: z.string().trim().min(1).max(500),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Choose a suspect and enter a question (up to 500 characters).' });
    return;
  }
  const suspect = game.mystery.suspects.find((item) => item.id === parsed.data.suspectId);
  if (!suspect) {
    res.status(404).json({ error: 'Suspect not found.' });
    return;
  }

  let answer: string;
  try {
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const context = `You are roleplaying ${suspect.name}. Stay in character. Never reveal the complete solution, never invent facts, and do not contradict the case facts. Respond in 1-3 concise sentences. Suspect profile: ${JSON.stringify(suspect)}. Case: ${game.mystery.description}. Timeline: ${game.mystery.timeline.join(' ')}. Discovered clues: ${game.mystery.clues.filter((clue) => game.discoveredClueIds.includes(clue.id)).map((clue) => `${clue.title}: ${clue.description}`).join(' ') || 'None yet'}. Player question: ${parsed.data.question}`;
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: context,
      });
      answer = response.text || suspect.initialStatement;
    } else {
      answer = `${suspect.initialStatement} ${parsed.data.question.toLowerCase().includes('where') ? 'I have already told you where I was.' : ''}`;
    }
  } catch {
    answer = suspect.initialStatement;
  }

  session.interrogationHistory.push({ suspectId: suspect.id, question: parsed.data.question, answer });
  await session.save();
  res.json({ suspectId: suspect.id, suspectName: suspect.name, answer });
}));

app.post('/api/games/:gameId/hint', route(async (req, res) => {
  const loaded = await loadGame(req.params.gameId);
  if (!loaded) {
    res.status(404).json({ error: 'Game not found. Start a new mystery to play.' });
    return;
  }
  const { game, session } = loaded;
  if (game.status !== 'active') {
    res.status(409).json({ error: 'This case is already closed.' });
    return;
  }
  if (game.hintsUsed >= 3) {
    res.status(409).json({ error: 'You have used all three hints.' });
    return;
  }
  const hint = game.mystery.hints[game.hintsUsed];
  session.hintsUsed = game.hintsUsed + 1;
  await session.save();
  res.json({ level: session.hintsUsed, hint, hintsUsed: session.hintsUsed, remaining: 3 - session.hintsUsed });
}));

app.post('/api/games/:gameId/accuse', route(async (req, res) => {
  const loaded = await loadGame(req.params.gameId);
  if (!loaded) {
    res.status(404).json({ error: 'Game not found. Start a new mystery to play.' });
    return;
  }
  const { game, session } = loaded;
  if (game.status !== 'active') {
    res.status(409).json({ error: 'An accusation has already been submitted.' });
    return;
  }
  const parsed = z.object({ suspectId: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success || !game.mystery.suspects.some((suspect) => suspect.id === parsed.data.suspectId)) {
    res.status(400).json({ error: 'Select a valid suspect.' });
    return;
  }
  session.accusedSuspectId = parsed.data.suspectId;
  session.correct = parsed.data.suspectId === game.mystery.culpritId;
  session.status = 'complete';
  session.score = session.correct ? Math.max(0, 100 - game.hintsUsed * 10) : 0;
  await session.save();
  game.accusedSuspectId = session.accusedSuspectId;
  game.correct = session.correct;
  game.status = session.status;
  game.score = session.score;
  res.json(resultFor(game));
}));

app.get('/api/games/:gameId/result', route(async (req, res) => {
  const loaded = await loadGame(req.params.gameId);
  if (!loaded) {
    res.status(404).json({ error: 'Game not found. Start a new mystery to play.' });
    return;
  }
  if (loaded.game.status !== 'complete') {
    res.status(403).json({ error: 'The solution is available after your accusation.' });
    return;
  }
  res.json(resultFor(loaded.game, true));
}));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Request failed:', err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

async function startServer(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required to start the server.');
  mongoose.connection.on('error', (error: unknown) => console.error('MongoDB connection error:', error));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });

  const port = Number(process.env.PORT) || 4000;
  const server = app.listen(port, () => console.log(`AI Mystery Room API listening on port ${port}`));
  const shutdown = () => {
    server.close(() => {
      void mongoose.disconnect().finally(() => process.exit(0));
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

void startServer().catch((error: unknown) => {
  console.error('Could not start AI Mystery Room API:', error);
  process.exitCode = 1;
});
