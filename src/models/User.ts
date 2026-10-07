import { Schema, model, models, type InferSchemaType } from "mongoose";

export const USER_ROLES = ["manager", "rep"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: "rep" },
    active: { type: Boolean, default: true },
    dailyCallGoal: { type: Number, default: 60 },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof UserSchema> & { _id: string };

export default models.User || model("User", UserSchema);
