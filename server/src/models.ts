import { model, Schema } from 'mongoose';

export interface MysteryRecord {
  id: string;
  title: string;
  introduction: string;
  description: string;
  timeline: string[];
  culpritId: string;
  solution: string;
  motive: string;
  decisiveClueIds: string[];
  hints: [string, string, string];
}

export interface SuspectRecord {
  mysteryId: string;
  order: number;
  id: string;
  name: string;
  role: string;
  background: string;
  relationship: string;
  motive: string;
  initialStatement: string;
  alibi: string;
  knowledge: string;
}

export interface ClueRecord {
  mysteryId: string;
  order: number;
  id: string;
  title: string;
  description: string;
  location: string;
  relevance: string;
  isDiscoverable: boolean;
}

export interface InterrogationRecord {
  suspectId: string;
  question: string;
  answer: string;
}

export interface GameSessionRecord {
  id: string;
  mysteryId: string;
  discoveredClueIds: string[];
  interrogationHistory: InterrogationRecord[];
  hintsUsed: number;
  status: 'active' | 'complete';
  accusedSuspectId?: string;
  correct?: boolean;
  score?: number;
  createdAt: Date;
}

const mysterySchema = new Schema<MysteryRecord>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  introduction: { type: String, required: true },
  description: { type: String, required: true },
  timeline: { type: [String], required: true },
  culpritId: { type: String, required: true },
  solution: { type: String, required: true },
  motive: { type: String, required: true },
  decisiveClueIds: { type: [String], required: true },
  hints: { type: [String], required: true },
});

const suspectSchema = new Schema<SuspectRecord>({
  mysteryId: { type: String, required: true, index: true },
  order: { type: Number, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  background: { type: String, required: true },
  relationship: { type: String, required: true },
  motive: { type: String, required: true },
  initialStatement: { type: String, required: true },
  alibi: { type: String, required: true },
  knowledge: { type: String, required: true },
});
suspectSchema.index({ mysteryId: 1, id: 1 }, { unique: true });

const clueSchema = new Schema<ClueRecord>({
  mysteryId: { type: String, required: true, index: true },
  order: { type: Number, required: true },
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  relevance: { type: String, required: true },
  isDiscoverable: { type: Boolean, required: true },
});
clueSchema.index({ mysteryId: 1, id: 1 }, { unique: true });

const interrogationSchema = new Schema<InterrogationRecord>({
  suspectId: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false });

const gameSessionSchema = new Schema<GameSessionRecord>({
  id: { type: String, required: true, unique: true, index: true },
  mysteryId: { type: String, required: true, index: true },
  discoveredClueIds: { type: [String], default: [] },
  interrogationHistory: { type: [interrogationSchema], default: [] },
  hintsUsed: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'complete'], default: 'active' },
  accusedSuspectId: String,
  correct: Boolean,
  score: Number,
  createdAt: { type: Date, required: true, default: Date.now },
});

export const MysteryModel = model<MysteryRecord>('Mystery', mysterySchema);
export const SuspectModel = model<SuspectRecord>('Suspect', suspectSchema);
export const ClueModel = model<ClueRecord>('Clue', clueSchema);
export const GameSessionModel = model<GameSessionRecord>('GameSession', gameSessionSchema);
