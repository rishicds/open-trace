import mongoose, { Schema } from 'mongoose';

export interface IFunnel {
  _id: mongoose.Types.ObjectId;
  name: string;
  steps: string[];
  created_at: Date;
}

const funnelSchema = new Schema<IFunnel>({
  name: { type: String, required: true },
  steps: [{ type: String, required: true }],
  created_at: { type: Date, default: Date.now },
});

export const Funnel = mongoose.model<IFunnel>('Funnel', funnelSchema);
