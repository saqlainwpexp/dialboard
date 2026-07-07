import { Schema, model, models, type InferSchemaType } from "mongoose";

export const DISPOSITIONS = [
  "no_answer",
  "voicemail",
  "gatekeeper",
  "wrong_number",
  "not_interested",
  "callback_requested",
  "meeting_booked",
  "dnc",
] as const;

export const OBJECTIONS = [
  "price",
  "timing",
  "no_budget",
  "already_have_vendor",
  "not_decision_maker",
  "no_need",
  "other",
] as const;

const CallSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", default: null },
    script: { type: Schema.Types.ObjectId, ref: "Script", default: null },
    disposition: { type: String, enum: DISPOSITIONS, required: true },
    durationSeconds: { type: Number, default: 0 },
    objection: { type: String, enum: OBJECTIONS, default: null },
    notes: { type: String, default: "" },
    nextActionAt: { type: Date, default: null },
    calledAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

CallSchema.index({ calledAt: -1 });
CallSchema.index({ lead: 1 });
CallSchema.index({ disposition: 1 });

export type Call = InferSchemaType<typeof CallSchema> & { _id: string };

export default models.Call || model("Call", CallSchema);
