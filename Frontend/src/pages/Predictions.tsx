import { useEffect, useState } from "react";
import {
  CheckCircle, AlertTriangle, Heart, ShieldCheck,
  Droplets, Footprints, Apple, XCircle, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";

// ── Types matching your CardioPredictor response ──────────────────────────
interface PredictionResult {
  risk_score: number;           // 0–100
  risk_level: "Low" | "Moderate" | "High";
  summary: string;
  is_anomaly: boolean;
  anomaly_score: number;
  alerts: string[];
  disease: {
    heart_disease_probability: number;   // 0.0–1.0
    confidence: string;                  // "High" | "Medium" | "Low"
  };
}

// ── Helper: map risk level → badge + icon colour ──────────────────────────
const riskConfig = {
  Low:      { badge: "bg-green-100 text-green-800",  icon: CheckCircle, iconClass: "text-green-600",  bar: "bg-green-500"  },
  Moderate: { badge: "bg-yellow-100 text-yellow-800", icon: AlertTriangle, iconClass: "text-yellow-500", bar: "bg-yellow-400" },
  High:     { badge: "bg-red-100 text-red-800",      icon: XCircle,      iconClass: "text-red-600",   bar: "bg-red-500"    },
};

const recommendations = [
  { icon: Footprints, text: "Maintain 30 minutes of moderate exercise daily." },
  { icon: Droplets,   text: "Stay hydrated — drink at least 8 glasses of water daily." },
  { icon: Apple,      text: "Follow a balanced diet low in sodium and saturated fats." },
  { icon: ShieldCheck,text: "Continue wearing your smartwatch for consistent monitoring." },
];

// ─────────────────────────────────────────────────────────────────────────────

const Predictions = () => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const token = sessionStorage.getItem("access_token"); // adjust to wherever you store the JWT
        const res   = await fetch("/ml/predict", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
        });

        if (res.status === 404) {
          setError("No health profile found. Please complete your health setup first.");
          return;
        }
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data: PredictionResult = await res.json();
        setPrediction(data);
      } catch (err: any) {
        setError(err.message ?? "Failed to load prediction.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, []);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-3 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Fetching your prediction…
        </div>
      </DashboardLayout>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !prediction) {
    return (
      <DashboardLayout>
        <Card className="max-w-xl">
          <CardContent className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
            {error ?? "No prediction data available."}
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // ── Resolved values ───────────────────────────────────────────────────────
  const level  = prediction.risk_level ?? "Low";
  const cfg    = riskConfig[level] ?? riskConfig["Low"];
  const Icon   = cfg.icon;
  const hdPct  = Math.round((prediction.disease?.heart_disease_probability ?? 0) * 100);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">

        {/* ── Card 1: Result summary ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Latest prediction result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className={`h-8 w-8 ${cfg.iconClass}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{level} Risk</p>
                <Badge className={cfg.badge}>{level} Risk</Badge>
              </div>
              <div className="ml-auto text-right">
                <p className="text-3xl font-bold">{prediction.risk_score}</p>
                <p className="text-xs text-muted-foreground">/ 100 risk score</p>
              </div>
            </div>
            <p className="text-muted-foreground">{prediction.summary}</p>
          </CardContent>
        </Card>

        {/* ── Card 2: Risk bar + stats ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-chart-4" />
              Risk breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                  style={{ width: `${prediction.risk_score}%` }}
                />
              </div>
              <span className="text-sm font-medium">{prediction.risk_score}% Risk</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Heart disease prob.</p>
                <p className="text-xl font-semibold">{hdPct}%</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                <p className="text-xl font-semibold">{prediction.disease?.confidence ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Anomaly detected</p>
                <p className="text-xl font-semibold">{prediction.is_anomaly ? "Yes" : "No"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 3: Alerts (only shown when present) ───────────────────── */}
        {prediction.alerts?.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-5 w-5" />
                Active alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {prediction.alerts.map((alert, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-yellow-400 shrink-0" />
                    {alert}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* ── Card 4: Recommendations ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <r.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm pt-1.5">{r.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default Predictions;