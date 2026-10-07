import { Schema, model, models, type InferSchemaType } from "mongoose";

export const ACTIVITY_TYPES = [
  "status_change",
  "assigned",
  "claimed",
  "lead_created",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// An append-only audit record. Actor and lead names are denormalized so the
// feed stays readable even after a user or lead is deleted.
const ActivitySchema = new Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, default: "" },
    lead: { type: Schema.Types.ObjectId, ref: "Lead", default: null },
    leadName: { type: String, default: "" },
    from: { type: String, default: "" },
    to: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ actor: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });

export type Activity = InferSchemaType<typeof ActivitySchema> & { _id: string };

export default models.Activity || model("Activity", ActivitySchema);
