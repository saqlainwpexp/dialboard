import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Call from "@/models/Call";
import Campaign from "@/models/Campaign";
import Script from "@/models/Script";
import { startOfDay, subDays, format, addDays } from "date-fns";

const CONNECTED_DISPOSITIONS = [
  "gatekeeper",
  "not_interested",
  "callback_requested",
  "meeting_booked",
];

export async function getDashboardStats(dailyCallGoal: number) {
  await connectDB();

  const now = new Date();
  const todayStart = startOfDay(now);
  const windowStart = subDays(todayStart, 13);

  const [
    totalLeads,
    activeCampaigns,
    callsToday,
    callsWindow,
    upcomingFollowups,
    scriptAgg,
    calls30d,
    connects30d,
    meetings30d,
  ] = await Promise.all([
    Lead.countDocuments({}),
    Campaign.find({ archived: false }).sort({ createdAt: -1 }).limit(6).lean(),
    Call.countDocuments({ calledAt: { $gte: todayStart } }),
    Call.find({ calledAt: { $gte: windowStart } })
      .select("calledAt disposition")
      .lean(),
    Lead.find({ nextActionAt: { $ne: null, $lte: addDays(now, 7) } })
      .sort({ nextActionAt: 1 })
      .limit(6)
      .populate("campaign", "name color")
      .lean(),
    Call.aggregate([
      { $match: { calledAt: { $gte: subDays(todayStart, 30) }, script: { $ne: null } } },
      {
        $group: {
          _id: "$script",
          total: { $sum: 1 },
          meetings: {
            $sum: { $cond: [{ $eq: ["$disposition", "meeting_booked"] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
    Call.countDocuments({ calledAt: { $gte: subDays(todayStart, 30) } }),
    Call.countDocuments({
      calledAt: { $gte: subDays(todayStart, 30) },
      disposition: { $in: CONNECTED_DISPOSITIONS },
    }),
    Call.countDocuments({
      calledAt: { $gte: subDays(todayStart, 30) },
      disposition: "meeting_booked",
    }),
  ]);

  const scriptIds = scriptAgg.map((s) => s._id);
  const scripts = await Script.find({ _id: { $in: scriptIds } }).lean();
  const scriptMap = new Map(scripts.map((s) => [s._id.toString(), s.name]));

  const scriptPerformance = scriptAgg.map((s) => ({
    name: scriptMap.get(s._id.toString()) ?? "Unknown script",
    rate: s.total > 0 ? Math.round((s.meetings / s.total) * 100) : 0,
    total: s.total,
  }));

  const chartMap = new Map<string, { calls: number; connects: number }>();
  for (let i = 0; i < 14; i++) {
    const d = format(subDays(todayStart, 13 - i), "MMM d");
    chartMap.set(d, { calls: 0, connects: 0 });
  }
  for (const call of callsWindow as { calledAt: Date; disposition: string }[]) {
    const key = format(call.calledAt, "MMM d");
    const entry = chartMap.get(key);
    if (entry) {
      entry.calls += 1;
      if (CONNECTED_DISPOSITIONS.includes(call.disposition)) entry.connects += 1;
    }
  }
  const chartData = Array.from(chartMap.entries()).map(([date, v]) => ({ date, ...v }));

  const connectRate = calls30d > 0 ? Math.round((connects30d / calls30d) * 100) : 0;
  const meetingRate = calls30d > 0 ? Math.round((meetings30d / calls30d) * 100) : 0;
  const callGoalProgress = dailyCallGoal > 0 ? Math.round((callsToday / dailyCallGoal) * 100) : 0;

  return {
    totalLeads,
    activeCampaigns,
    callsToday,
    callGoalProgress,
    connectRate,
    meetingRate,
    chartData,
    upcomingFollowups,
    scriptPerformance,
  };
}
