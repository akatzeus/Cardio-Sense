import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, AlertTriangle, FlaskConical, Activity, Heart, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

// ── Types matching ACTUAL /ml/realtime-alert response ─────────────────────
interface StreamResult {
  alerts: string[];
  hr_stats: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  static_prediction: {
    risk_score: number;
    risk_level: "Low" | "Moderate" | "High";
    summary: string;
    is_anomaly: boolean;
    anomaly_score: number;
    alerts: string[];
    disease: {
      heart_disease_probability: number;
      confidence: string;
    };
  };
}

interface DailyPoint {
  date: string;
  avgBpm: number;
  maxBpm: number;
  minBpm: number;
}

const ranges = ["7 Days", "14 Days", "30 Days"] as const;
type Range = (typeof ranges)[number];
const rangeTodays: Record<Range, number> = { "7 Days": 7, "14 Days": 14, "30 Days": 30 };
type DummyProfile = "real" | "low_risk" | "high_risk";

// ── Raw HR reading generator ──────────────────────────────────────────────
function generateHrReadings(days: number, profile: DummyProfile): number[] {
  const isHigh = profile === "high_risk";
  const base   = isHigh ? 92 : 68;
  const jitter = isHigh ? 22 : 6;
  const count  = days * 24 * 6;
  const out: number[] = [];

  for (let i = 0; i < count; i++) {
    const seed = (i * 1664525 + 1013904223) & 0xffffffff;
    const rand = ((seed >>> 0) % 10000) / 10000;
    let bpm = Math.round(base + (rand - 0.5) * jitter * 2);
    if (isHigh && i % 73  === 0) bpm = Math.round(155 + rand * 20);
    if (isHigh && i % 120 === 0) bpm = Math.round(40  + rand * 5);
    out.push(Math.max(35, Math.min(200, bpm)));
  }
  return out;
}

function bucketToDailyChart(readings: number[], days: number): DailyPoint[] {
  const perDay = Math.floor(readings.length / days);
  return Array.from({ length: days }, (_, d) => {
    const slice = readings.slice(d * perDay, (d + 1) * perDay);
    const date  = new Date();
    date.setDate(date.getDate() - (days - 1 - d));
    return {
      date:   date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      avgBpm: Math.round(slice.reduce((a, b) => a + b, 0) / slice.length),
      maxBpm: Math.max(...slice),
      minBpm: Math.min(...slice),
    };
  });
}

// ── BPM zone helper ───────────────────────────────────────────────────────
function bpmZone(bpm: number): { label: string; color: string } {
  if (bpm > 150) return { label: "Critical high", color: "text-red-600" };
  if (bpm > 100) return { label: "Elevated",      color: "text-orange-500" };
  if (bpm < 45)  return { label: "Critical low",  color: "text-red-600" };
  if (bpm < 60)  return { label: "Low",           color: "text-yellow-600" };
  return           { label: "Normal",             color: "text-green-600" };
}

const riskColors = {
  Low:      { bar: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50 border-green-200",  badge: "bg-green-100 text-green-800"  },
  Moderate: { bar: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-800" },
  High:     { bar: "bg-red-500",    text: "text-red-700",    bg: "bg-red-50 border-red-200",       badge: "bg-red-100 text-red-800"      },
};

// ─────────────────────────────────────────────────────────────────────────────

const HistoryTrends = () => {
  const [range, setRange]     = useState<Range>("30 Days");
  const [profile, setProfile] = useState<DummyProfile>("real");
  const [result, setResult]   = useState<StreamResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const days       = rangeTodays[range];
  const hrReadings = profile !== "real" ? generateHrReadings(days, profile) : [];
  const chartData  = profile !== "real" ? bucketToDailyChart(hrReadings, days) : [];
  const statAvg    = chartData.length ? Math.round(chartData.reduce((a, d) => a + d.avgBpm, 0) / chartData.length) : 0;
  const statMax    = chartData.length ? Math.max(...chartData.map((d) => d.maxBpm)) : 0;
  const statMin    = chartData.length ? Math.min(...chartData.map((d) => d.minBpm)) : 0;

  useEffect(() => {
    if (profile === "real") { setResult(null); return; }
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const token  = sessionStorage.getItem("access_token");
        const sample = hrReadings.slice(-120);
        const res    = await fetch("/ml/realtime-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ hr_values: sample }),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        setResult(await res.json());
      } catch (err: any) {
        setError(err.message ?? "Failed to analyse HR stream.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [profile, range]);

  const sp    = result?.static_prediction;
  const level = sp?.risk_level ?? "Low";
  const rc    = riskColors[level] ?? riskColors["Low"];
  const hdPct = Math.round((sp?.disease?.heart_disease_probability ?? 0) * 100);
  const hasStreamAlerts = (result?.alerts?.length ?? 0) > 0;

  return (
    <DashboardLayout>
      <div className="space-y-5">

        {/* ── Test mode banner ──────────────────────────────────────────── */}
        {profile !== "real" && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm text-yellow-800">
            <FlaskConical className="h-4 w-4 shrink-0" />
            Test mode — simulated HR stream for{" "}
            <strong>{profile === "high_risk" ? "high risk" : "low risk"}</strong> profile.
            Analysis is real from the ML model.
          </div>
        )}

        {/* ── Switchers ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Data source:</span>
          {(["real", "low_risk", "high_risk"] as DummyProfile[]).map((p) => (
            <Button key={p} size="sm" variant={profile === p ? "default" : "outline"} onClick={() => setProfile(p)}>
              {p === "real" ? "My data" : p === "low_risk" ? "Low risk demo" : "High risk demo"}
            </Button>
          ))}
        </div>

        {profile !== "real" && (
          <div className="flex flex-wrap gap-2">
            {ranges.map((r) => (
              <Button key={r} size="sm" variant={range === r ? "default" : "outline"} onClick={() => setRange(r)}>{r}</Button>
            ))}
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && (
          <Card><CardContent className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Analysing HR stream…
          </CardContent></Card>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <Card><CardContent className="flex items-center gap-2 text-sm text-red-600 py-6">
            <AlertTriangle className="h-4 w-4" /> {error}
          </CardContent></Card>
        )}

        {/* ══ RESULTS ════════════════════════════════════════════════════ */}
        {!loading && !error && result && (
          <>
            {/* ── 1. Live HR stats ──────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Live HR stream stats
                  <span className="ml-auto text-xs font-normal text-muted-foreground">last 120 readings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Mean BPM", value: result.hr_stats.mean, zone: bpmZone(result.hr_stats.mean) },
                    { label: "Std dev",  value: result.hr_stats.std,  zone: null },
                    { label: "Max BPM",  value: result.hr_stats.max,  zone: bpmZone(result.hr_stats.max) },
                    { label: "Min BPM",  value: result.hr_stats.min,  zone: bpmZone(result.hr_stats.min) },
                  ].map(({ label, value, zone }) => (
                    <div key={label} className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className={`text-2xl font-semibold ${zone?.color ?? ""}`}>
                        {Math.round(value)}
                      </p>
                      {zone && (
                        <p className={`text-xs mt-0.5 ${zone.color}`}>{zone.label}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── 2. Stream alerts ──────────────────────────────────────── */}
            {hasStreamAlerts && (
              <Card className="border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    HR stream alerts
                    <Badge className="ml-auto bg-red-100 text-red-700">{result.alerts.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.alerts.map((alert, i) => {
                      const isHigh = alert.toLowerCase().includes("high");
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium border
                            ${isHigh
                              ? "bg-red-50 border-red-200 text-red-800"
                              : "bg-blue-50 border-blue-200 text-blue-800"}`}
                        >
                          <span className={`h-2 w-2 rounded-full shrink-0 ${isHigh ? "bg-red-500" : "bg-blue-500"}`} />
                          {/* Strip the emoji from backend — render our own indicator */}
                          {alert.replace(/^[^\w]+/, "").trim()}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── 3. Static prediction (from health profile) ────────────── */}
            {sp && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    Cardiac risk assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Risk level row */}
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xl font-bold">{level} Risk</p>
                      <Badge className={rc.badge}>{level} Risk</Badge>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-3xl font-bold">{sp.risk_score}</p>
                      <p className="text-xs text-muted-foreground">/ 100 risk score</p>
                    </div>
                  </div>

                  {/* Risk bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${rc.bar}`}
                        style={{ width: `${sp.risk_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{sp.risk_score}%</span>
                  </div>

                  {/* Disease prob + confidence + anomaly */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Disease prob.</p>
                      <p className="text-xl font-semibold">{hdPct}%</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                      <p className="text-xl font-semibold">{sp.disease?.confidence ?? "—"}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Anomaly score</p>
                      <p className="text-xl font-semibold">{sp.anomaly_score}</p>
                    </div>
                  </div>

                  {/* Anomaly status pill */}
                  <div className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium border
                    ${sp.is_anomaly
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-green-50 border-green-200 text-green-800"}`}>
                    <span className={`h-2 w-2 rounded-full ${sp.is_anomaly ? "bg-red-500" : "bg-green-500"}`} />
                    {sp.is_anomaly ? "Anomaly detected in health profile" : "No anomaly detected in health profile"}
                  </div>

                  <p className="text-sm text-muted-foreground">{sp.summary}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ── HR Trend Chart ────────────────────────────────────────────── */}
        {profile !== "real" && !loading && chartData.length > 0 && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Heart rate trends — {days} day period (simulated)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval={Math.floor(days / 7)} />
                    <YAxis domain={[35, 180]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgBpm" name="Avg BPM" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="maxBpm" name="Max BPM" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="minBpm" name="Min BPM" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Avg BPM (period)", value: statAvg },
                { label: "Max recorded",     value: statMax },
                { label: "Min recorded",     value: statMin },
              ].map(({ label, value }) => (
                <Card key={label}>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* ── Real data: no readings yet ────────────────────────────────── */}
        {profile === "real" && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <AlertTriangle className="h-7 w-7 mx-auto mb-2 text-yellow-500" />
              No HR readings yet. Use the demo profiles above to test the model,
              or sync your smartwatch to see real trends here.
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
};

export default HistoryTrends;