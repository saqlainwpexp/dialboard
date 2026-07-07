import { BarChart3, MessageSquareWarning, Clock, Tag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TimeOfDayChart } from "@/components/analytics/TimeOfDayChart";
import { getObjectionBreakdown, getTimeOfDayBreakdown, getSourceBreakdown } from "@/lib/analytics";

export default async function AnalyticsPage() {
  const [objections, timeOfDay, sources] = await Promise.all([
    getObjectionBreakdown(),
    getTimeOfDayBreakdown(),
    getSourceBreakdown(),
  ]);

  const bestDay = [...timeOfDay.byDay].sort((a, b) => b.connectRate - a.connectRate)[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 size={20} className="text-accent-blue" /> Analytics
        </h1>
        <p className="text-sm text-muted">What&apos;s actually working, based on every call you&apos;ve logged</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-accent-blue" />
            <h2 className="font-bold text-foreground">Best time to call</h2>
          </div>
          <p className="text-sm text-muted mb-4">Connect rate by hour of day</p>
          {timeOfDay.byHour.length === 0 ? (
            <p className="text-sm text-muted-2">Log more calls to see time-of-day patterns.</p>
          ) : (
            <>
              <TimeOfDayChart data={timeOfDay.byHour} />
              {bestDay && bestDay.total > 0 && (
                <p className="text-sm text-muted mt-2">
                  Best day so far: <span className="font-semibold text-foreground">{bestDay.day}</span>{" "}
                  ({bestDay.connectRate}% connect rate)
                </p>
              )}
            </>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareWarning size={16} className="text-accent-orange" />
            <h2 className="font-bold text-foreground">Top objections</h2>
          </div>
          <p className="text-sm text-muted mb-4">What&apos;s coming up on calls</p>
          {objections.length === 0 ? (
            <p className="text-sm text-muted-2">No objections logged yet.</p>
          ) : (
            <div className="space-y-4">
              {objections.map((o) => (
                <ProgressBar key={o.objection} label={o.objection} value={o.percent} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Tag size={16} className="text-accent-blue" />
          <h2 className="font-bold text-foreground">Performance by lead source</h2>
        </div>
        <p className="text-sm text-muted mb-4">Which lists are actually worth calling</p>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-2">Log calls against leads with a source set to see this.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-2 text-xs uppercase tracking-wide border-b border-border">
                  <th className="py-2 pr-4 font-semibold">Source</th>
                  <th className="py-2 pr-4 font-semibold">Calls</th>
                  <th className="py-2 pr-4 font-semibold">Connect rate</th>
                  <th className="py-2 pr-4 font-semibold">Meeting rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map((s) => (
                  <tr key={s.source}>
                    <td className="py-2.5 pr-4 font-semibold text-foreground">{s.source}</td>
                    <td className="py-2.5 pr-4 text-muted">{s.total}</td>
                    <td className="py-2.5 pr-4 text-muted">{s.connectRate}%</td>
                    <td className="py-2.5 pr-4 text-muted">{s.meetingRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
