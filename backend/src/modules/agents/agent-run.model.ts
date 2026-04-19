import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Tracks every execution of a Mastra AI workflow / agent.
 * Populated by the backend's triggerWorkflow() helper — records start time,
 * end time, duration, status, input payload, and output/error.
 *
 * Used by the Agent Hub UI to show real run counts, latencies, and history.
 */
export type AgentRunStatus = 'running' | 'success' | 'failed' | 'timeout';

export interface IAgentRun extends Document {
  agentId: string;          // e.g. "negotiation-agent"
  workflowId: string;       // e.g. "negotiationWorkflow"
  mastraRunId?: string;     // Mastra's own run identifier
  status: AgentRunStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  input: any;
  output?: any;
  error?: string;
  triggeredBy?: mongoose.Types.ObjectId; // User who triggered it (optional)
  createdAt: Date;
  updatedAt: Date;
}

const AgentRunSchema = new Schema<IAgentRun>(
  {
    agentId: { type: String, required: true, index: true },
    workflowId: { type: String, required: true },
    mastraRunId: { type: String },
    status: {
      type: String,
      enum: ['running', 'success', 'failed', 'timeout'],
      default: 'running',
      index: true,
    },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
    durationMs: { type: Number },
    input: { type: Schema.Types.Mixed },
    output: { type: Schema.Types.Mixed },
    error: { type: String },
    triggeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Compound index for fast per-agent queries sorted by most recent
AgentRunSchema.index({ agentId: 1, startedAt: -1 });

const AgentRun: Model<IAgentRun> = mongoose.model<IAgentRun>('AgentRun', AgentRunSchema);
export default AgentRun;
