import mongoose, { Schema } from 'mongoose';

export interface IEvent {
  _id: mongoose.Types.ObjectId;
  session_id: string;
  event_type: 'page_view' | 'click' | 'scroll_depth' | 'mouse_move' | 'rage_click' | 'dead_click';
  page_url: string;
  timestamp: Date;
  received_at: Date;
  x?: number;
  y?: number;
  target_tag?: string;
  target_id?: string;
  target_class?: string;
  depth_pct?: number;
  path?: Array<{ x: number; y: number; t: number }>;
  sub_type?: 'rage' | 'dead' | null;
}

const eventSchema = new Schema<IEvent>({
  session_id: { type: String, required: true },
  event_type: {
    type: String,
    required: true,
    enum: ['page_view', 'click', 'scroll_depth', 'mouse_move', 'rage_click', 'dead_click'],
  },
  page_url: { type: String, required: true },
  timestamp: { type: Date, required: true },
  received_at: { type: Date, default: Date.now },
  x: Number,
  y: Number,
  target_tag: String,
  target_id: String,
  target_class: String,
  depth_pct: Number,
  path: [{ x: Number, y: Number, t: Number, _id: false }],
  sub_type: { type: String, enum: ['rage', 'dead', null], default: null },
});

// Indexes per PRD §6.1
eventSchema.index({ session_id: 1, timestamp: 1 });
eventSchema.index({ page_url: 1, event_type: 1 });
eventSchema.index({ event_type: 1, sub_type: 1 });
eventSchema.index({ received_at: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

export const Event = mongoose.model<IEvent>('Event', eventSchema);
