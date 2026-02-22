import { CheckCircle, AlertTriangle, Heart, ShieldCheck, Droplets, Footprints, Apple } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";

const recommendations = [
  { icon: Footprints, text: "Maintain 30 minutes of moderate exercise daily." },
  { icon: Droplets, text: "Stay hydrated — drink at least 8 glasses of water daily." },
  { icon: Apple, text: "Follow a balanced diet low in sodium and saturated fats." },
  { icon: ShieldCheck, text: "Continue wearing your smartwatch for consistent monitoring." },
];

const Predictions = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Latest Prediction Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">Normal</p>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Low Risk</Badge>
              </div>
            </div>
            <p className="text-muted-foreground">
              Based on your recent heart rate data, our AI model has classified your cardiac rhythm as <strong>normal</strong>.
              No significant anomalies have been detected. Your average BPM of 74 falls within a healthy resting range.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-chart-4" /> Risk Explanation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[20%] bg-primary rounded-full" />
              </div>
              <span className="text-sm font-medium text-primary">20% Risk</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your risk score is calculated by analyzing heart rate variability, resting BPM patterns, and potential arrhythmia
              indicators against our trained ML model. A score below 30% is considered low risk.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Recommendations</CardTitle>
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
