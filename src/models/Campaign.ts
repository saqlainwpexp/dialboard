import { Schema, model, models, type InferSchemaType } from "mongoose";

const CampaignSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    color: { type: String, default: "blue" },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type Campaign = InferSchemaType<typeof CampaignSchema> & { _id: string };

export default models.Campaign || model("Campaign", CampaignSchema);
