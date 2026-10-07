import { PhoneCall, CheckCircle2, CalendarCheck, ArrowUpRight, Calendar, TrendingUp, Users2, RefreshCw, Hand, UserPlus } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/stats";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Activity from "@/models/Activity";
import { Card } from "@/components/ui/Card";
import { GradientStatCard } from "@/components/ui/GradientStatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CallActivityChart } from "@/components/dashboard/CallActivityChart";

type LeanActivity = {
  _id: string;
  type: string;
  actorName: string;
  leadName: string;
  from: string;
  to: string;
  createdAt: Date;
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.userId).lean();
  const dailyCallGoal = user?.dailyCallGoal ?? 60;
  const isManager = session.role === "manager";

  const scope = isManager ? undefined : { userId: session.userId };
  const stats = await getDashboardStats(dailyCallGoal, scope);

  const recentActivity = isManager
    ? ((await Activity.find({}).sort({ createdAt: -1 }).limit(6).lean()) as unknown as LeanActivity[])
    : [];

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientStatCard
          variant="warm"
          label="Calls today"
          value={`${stats.callsToday}`}
          caption={`${stats.callGoalProgress}% of goal (${dailyCallGoal})`}
          icon={<PhoneCall size={15} />}
        />
        <GradientStatCard
          variant="cool"
          label="Connect rate"
          value={`${stats.connectRate}%`}
          caption="Last 30 days"
          icon={<CheckCircle2 size={15} />}
        />
        <MiniStat
          label="Conversions"
          value={`${stats.meetings30d}`}
          caption="Meetings booked, 30d"
          icon={<CalendarCheck size={15} className="text-emerald-600" />}
        />
        <MiniStat
          label={isManager ? "Total leads" : "My leads"}
          value={`${stats.totalLeads}`}
          caption={`${stats.meetingRate}% meeting rate`}
          icon={<Users2 size={15} className="text-accent-blue" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Upcoming meetings */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-foreground flex items-center gap-2 text-[15px]">
                  <CalendarCheck size={16} className="text-emerald-600" /> Upcoming meetings
                </div>
                <p className="text-[13px] text-muted">Leads that booked a meeting</p>
              </div>
              <Link href="/pipeline" className="text-[13px] font-semibold text-accent-blue hover:underline">
                View pipeline
              </Link>
            </div>
            <div className="divide-y divide-border">
              {stats.upcomingMeetings.length === 0 && (
                <p className="text-[13px] text-muted-2 py-6 text-center">
                  No booked meetings yet. They show up here once a call is logged as “meeting booked”.
                </p>
              )}
              {stats.upcomingMeetings.map((lead) => (
                <Link
                  key={lead._id.toString()}
                  href={`/leads/${lead._id}`}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 group"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground group-hover:text-accent-blue truncate">
                      {lead.name}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {lead.company || lead.phone}
                      {isManager && lead.assignedTo?.name ? ` · ${lead.assignedTo.name}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-2">
                      {lead.nextActionAt ? format(new Date(lead.nextActionAt), "EEE, d MMM · h:mm a") : "No time set"}
                    </span>
                    <ArrowUpRight size={15} className="text-muted-2" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Call activity chart */}
          <Card className="p-5">
            <div className="mb-2">
              <div className="font-bold text-foreground flex items-center gap-2 text-[15px]">
                <TrendingUp size={16} className="text-accent-blue" /> Call activity
              </div>
              <p className="text-[13px] text-muted">Calls made vs. connects, last 14 days</p>
            </div>
            <CallActivityChart data={stats.chartData} />
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {/* Follow-ups */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-foreground text-[15px]">Follow-ups</div>
              <Calendar size={15} className="text-muted-2" />
            </div>
            <div className="divide-y divide-border">
              {stats.upcomingFollowups.length === 0 && (
                <p className="text-[13px] text-muted-2 py-4">Nothing scheduled.</p>
              )}
              {stats.upcomingFollowups.map((lead) => (
                <Link
                  key={lead._id.toString()}
                  href={`/leads/${lead._id}`}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 group"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-muted-2 font-medium">
                      {lead.nextActionAt ? format(new Date(lead.nextActionAt), "EEE, d MMM") : ""}
                    </div>
                    <div className="text-[13px] font-semibold text-foreground group-hover:text-accent-blue truncate">
                      {lead.name}
                    </div>
                  </div>
                  <ArrowUpRight size={15} className="text-muted-2" />
                </Link>
              ))}
            </div>
          </Card>

          {/* Manager: recent activity. Caller: script performance. */}
          {isManager ? (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-foreground text-[15px]">Recent activity</div>
                <Link href="/activity" className="text-[13px] font-semibold text-accent-blue hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentActivity.length === 0 && (
                  <p className="text-[13px] text-muted-2 py-2">No activity yet.</p>
                )}
                {recentActivity.map((a) => (
                  <div key={a._id.toString()} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-background flex items-center justify-center shrink-0 mt-0.5">
                      {a.type === "claimed" ? (
                        <Hand size={12} className="text-accent-orange" />
                      ) : a.type === "assigned" ? (
                        <UserPlus size={12} className="text-accent-blue" />
                      ) : (
                        <RefreshCw size={12} className="text-muted-2" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-foreground leading-snug">
                        <span className="font-semibold">{a.actorName || "Someone"}</span>{" "}
                        {a.type === "status_change" && (
                          <>
                            moved <span className="font-medium">{a.leadName}</span> to{" "}
                            <span className="font-medium">{labelFor(a.to)}</span>
                          </>
                        )}
                        {a.type === "assigned" && (
                          <>
                            assigned <span className="font-medium">{a.leadName}</span> to {a.to}
                          </>
                        )}
                        {a.type === "claimed" && (
                          <>
                            claimed <span className="font-medium">{a.leadName}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-2">
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <div className="font-bold text-foreground text-[15px] mb-1">Script performance</div>
              <p className="text-[13px] text-muted mb-4">Meeting-booked rate, last 30 days</p>
              <div className="space-y-4">
                {stats.scriptPerformance.length === 0 && (
                  <p className="text-[13px] text-muted-2">Log calls with a script to see performance here.</p>
                )}
                {stats.scriptPerformance.map((s, i) => (
                  <ProgressBar key={s.name + i} label={s.name} value={s.rate} trend={s.rate >= 15 ? "up" : "down"} />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  queued: "Queued",
  contacted: "Contacted",
  callback: "Callback",
  meeting_booked: "Meeting Booked",
  not_interested: "Not Interested",
  dnc: "DNC",
};
function labelFor(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function MiniStat({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-5 flex flex-col justify-between min-h-[136px]">
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">{icon}</div>
      </div>
      <div>
        <div className="text-[28px] font-bold tracking-tight leading-none text-foreground">{value}</div>
        <div className="text-xs font-medium text-muted mt-1.5">{caption}</div>
      </div>
    </Card>
  );
}
