import { Schema, model, models, type InferSchemaType } from "mongoose";

const ScriptSchema = new Schema(
  {
    name: { type: String, required: true },
    version: { type: String, default: "v1" },
    body: { type: String, default: "" },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type Script = InferSchemaType<typeof ScriptSchema> & { _id: string };

export default models.Script || model("Script", ScriptSchema);
