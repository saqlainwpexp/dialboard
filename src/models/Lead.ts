import { Schema, model, models, type InferSchemaType } from "mongoose";

export const LEAD_STATUSES = [
  "new",
  "queued",
  "contacted",
  "callback",
  "meeting_booked",
  "not_interested",
  "dnc",
] as const;

export const LEAD_PRIORITIES = ["low", "medium", "high"] as const;

const LeadSchema = new Schema(
  {
    name: { type: String, required: true },
    company: { type: String, default: "" },
    title: { type: String, default: "" },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    source: { type: String, default: "" },
    industry: { type: String, default: "" },
    timezone: { type: String, default: "" },
    status: { type: String, enum: LEAD_STATUSES, default: "new" },
    priority: { type: String, enum: LEAD_PRIORITIES, default: "medium" },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", default: null },
    notes: { type: String, default: "" },
    lastCalledAt: { type: Date, default: null },
    nextActionAt: { type: Date, default: null },
  },
  { timestamps: true }
);

LeadSchema.index({ status: 1 });
LeadSchema.index({ campaign: 1 });
LeadSchema.index({ nextActionAt: 1 });

export type Lead = InferSchemaType<typeof LeadSchema> & { _id: string };

export default models.Lead || model("Lead", LeadSchema);
