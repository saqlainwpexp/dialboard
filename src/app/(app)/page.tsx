import { PhoneCall, CheckCircle2, Trophy, ArrowUpRight, Calendar, TrendingUp, Users2 } from "lucide-react";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/stats";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { Card } from "@/components/ui/Card";
import { GradientStatCard } from "@/components/ui/GradientStatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatChip } from "@/components/ui/StatChip";
import { CallActivityChart } from "@/components/dashboard/CallActivityChart";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.userId).lean();
  const dailyCallGoal = user?.dailyCallGoal ?? 60;

  const stats = await getDashboardStats(dailyCallGoal);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted">Profile</span>
            </div>
            <div className="flex flex-col items-center text-center flex-1 justify-center">
              <div className="w-20 h-20 rounded-full grad-cool flex items-center justify-center text-white text-2xl font-bold mb-3">
                {session!.name.charAt(0).toUpperCase()}
              </div>
              <div className="font-bold text-foreground">{session!.name}</div>
              <div className="text-sm text-muted">{user?.role ?? "Sales Rep"}</div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <StatChip icon={<Users2 size={13} />} value={stats.totalLeads} />
              <StatChip icon={<PhoneCall size={13} />} value={stats.callsToday} />
              <StatChip icon={<Trophy size={13} />} value={stats.meetingRate + "%"} />
            </div>
          </Card>

          <GradientStatCard
            variant="warm"
            label="Today's calls"
            value={`${stats.callsToday}`}
            caption={`${stats.callGoalProgress}% of daily goal (${dailyCallGoal})`}
            icon={<PhoneCall size={16} />}
          />
          <GradientStatCard
            variant="cool"
            label="Connect rate"
            value={`${stats.connectRate}%`}
            caption="Last 30 days"
            icon={<CheckCircle2 size={16} />}
          />
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="font-bold text-foreground">Active campaigns</div>
              <div className="text-sm text-muted">
                {stats.activeCampaigns.length} active campaign{stats.activeCampaigns.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="flex -space-x-2">
              {stats.activeCampaigns.length === 0 && (
                <span className="text-sm text-muted-2">No campaigns yet</span>
              )}
              {stats.activeCampaigns.map((c) => (
                <div
                  key={c._id.toString()}
                  title={c.name}
                  className="w-9 h-9 rounded-full bg-accent-blue-soft text-accent-blue flex items-center justify-center text-xs font-bold border-2 border-surface"
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={16} className="text-accent-blue" />
                Call Activity
              </div>
              <p className="text-sm text-muted">Calls made vs. connects, last 14 days</p>
            </div>
          </div>
          <CallActivityChart data={stats.chartData} />
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-foreground">Follow-ups</div>
            <Calendar size={16} className="text-muted-2" />
          </div>
          <div className="divide-y divide-border">
            {stats.upcomingFollowups.length === 0 && (
              <p className="text-sm text-muted-2 py-4">No follow-ups scheduled.</p>
            )}
            {stats.upcomingFollowups.map((lead) => (
              <div key={lead._id.toString()} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <div className="text-xs text-muted-2 font-medium">
                    {lead.nextActionAt ? format(new Date(lead.nextActionAt), "EEE, d MMM") : ""}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{lead.name}</div>
                  <div className="text-xs text-muted flex items-center gap-1">
                    <PhoneCall size={11} /> {lead.phone}
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-muted-2" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-bold text-foreground mb-1">Script performance</div>
          <p className="text-sm text-muted mb-4">Meeting-booked rate, last 30 days</p>
          <div className="space-y-4">
            {stats.scriptPerformance.length === 0 && (
              <p className="text-sm text-muted-2">Log calls with a script to see performance here.</p>
            )}
            {stats.scriptPerformance.map((s, i) => (
              <ProgressBar
                key={s.name + i}
                label={s.name}
                value={s.rate}
                trend={s.rate >= 15 ? "up" : "down"}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
