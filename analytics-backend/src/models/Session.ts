import mongoose, { Schema } from 'mongoose';

export interface ISession {
  _id: mongoose.Types.ObjectId;
  session_id: string;
  started_at: Date;
  last_seen_at: Date;
  duration_ms: number;
  event_count: number;
  page_count: number;
  pages_visited: string[];
  has_rage_click: boolean;
  has_dead_click: boolean;
  bounce: boolean;
  max_scroll_pct: number;
  ai_summary: string | null;
  ai_generated_at: Date | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  city: string | null;
  country: string | null;
}

const sessionSchema = new Schema<ISession>({
  session_id: { type: String, required: true, unique: true },
  started_at: { type: Date, required: true },
  last_seen_at: { type: Date, required: true },
  duration_ms: { type: Number, default: 0 },
  event_count: { type: Number, default: 0 },
  page_count: { type: Number, default: 0 },
  pages_visited: [String],
  has_rage_click: { type: Boolean, default: false },
  has_dead_click: { type: Boolean, default: false },
  bounce: { type: Boolean, default: true },
  max_scroll_pct: { type: Number, default: 0 },
  ai_summary: { type: String, default: null },
  ai_generated_at: { type: Date, default: null },
  browser: { type: String, default: null },
  os: { type: String, default: null },
  device: { type: String, default: null },
  city: { type: String, default: null },
  country: { type: String, default: null },
});

// Indexes per PRD §6.2
sessionSchema.index({ session_id: 1 }, { unique: true });
sessionSchema.index({ started_at: -1 });
sessionSchema.index({ has_rage_click: 1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
