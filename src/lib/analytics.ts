import { connectDB } from "@/lib/db";
import Call from "@/models/Call";
import { OBJECTION_LABELS } from "@/lib/labels";

const CONNECTED_DISPOSITIONS = [
  "gatekeeper",
  "not_interested",
  "callback_requested",
  "meeting_booked",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getObjectionBreakdown() {
  await connectDB();
  const rows = await Call.aggregate([
    { $match: { objection: { $ne: null } } },
    { $group: { _id: "$objection", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return rows.map((r) => ({
    objection: OBJECTION_LABELS[r._id] ?? r._id,
    count: r.count,
    percent: total > 0 ? Math.round((r.count / total) * 100) : 0,
  }));
}

export async function getTimeOfDayBreakdown() {
  await connectDB();
  const calls = await Call.find({}).select("calledAt disposition").lean();

  const hourBuckets = new Map<number, { total: number; connects: number }>();
  const dayBuckets = new Map<number, { total: number; connects: number }>();

  for (const call of calls as { calledAt: Date; disposition: string }[]) {
    const d = new Date(call.calledAt);
    const hour = d.getHours();
    const day = d.getDay();
    const connected = CONNECTED_DISPOSITIONS.includes(call.disposition);

    const h = hourBuckets.get(hour) ?? { total: 0, connects: 0 };
    h.total += 1;
    if (connected) h.connects += 1;
    hourBuckets.set(hour, h);

    const dd = dayBuckets.get(day) ?? { total: 0, connects: 0 };
    dd.total += 1;
    if (connected) dd.connects += 1;
    dayBuckets.set(day, dd);
  }

  const byHour = Array.from({ length: 24 }, (_, hour) => {
    const b = hourBuckets.get(hour);
    return {
      hour,
      label: hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`,
      total: b?.total ?? 0,
      connectRate: b && b.total > 0 ? Math.round((b.connects / b.total) * 100) : 0,
    };
  }).filter((h) => h.total > 0);

  const byDay = Array.from({ length: 7 }, (_, day) => {
    const b = dayBuckets.get(day);
    return {
      day: DAY_NAMES[day],
      total: b?.total ?? 0,
      connectRate: b && b.total > 0 ? Math.round((b.connects / b.total) * 100) : 0,
    };
  });

  return { byHour, byDay };
}

export async function getSourceBreakdown() {
  await connectDB();
  const rows = await Call.aggregate([
    {
      $lookup: {
        from: "leads",
        localField: "lead",
        foreignField: "_id",
        as: "leadDoc",
      },
    },
    { $unwind: "$leadDoc" },
    {
      $group: {
        _id: { $ifNull: ["$leadDoc.source", "Unknown"] },
        total: { $sum: 1 },
        connects: {
          $sum: { $cond: [{ $in: ["$disposition", CONNECTED_DISPOSITIONS] }, 1, 0] },
        },
        meetings: {
          $sum: { $cond: [{ $eq: ["$disposition", "meeting_booked"] }, 1, 0] },
        },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return rows.map((r) => ({
    source: r._id === "" ? "Unknown" : r._id,
    total: r.total,
    connectRate: r.total > 0 ? Math.round((r.connects / r.total) * 100) : 0,
    meetingRate: r.total > 0 ? Math.round((r.meetings / r.total) * 100) : 0,
  }));
}
