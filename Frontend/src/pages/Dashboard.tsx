import { useEffect, useState } from "react";
import { Activity, Heart, AlertTriangle, CheckCircle, Info, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateHeartRateData, recentAlerts } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const Dashboard = () => {
  const [heartData, setHeartData] = useState(generateHeartRateData(20));
  const currentBpm = heartData[heartData.length - 1]?.bpm ?? 72;

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartData((prev) => {
        const next = [...prev.slice(1)];
        next.push({
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          bpm: Math.floor(65 + Math.random() * 30 + Math.sin(Date.now() / 3000) * 10),
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const alertIcon = (type: string) => {
    if (type === "warning") return <AlertTriangle className="h-4 w-4 text-chart-4" />;
    if (type === "success") return <CheckCircle className="h-4 w-4 text-primary" />;
    return <Info className="h-4 w-4 text-chart-3" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current BPM</p>
                <p className="text-2xl font-bold">{currentBpm}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg BPM (Today)</p>
                <p className="text-2xl font-bold">74</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prediction</p>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Normal</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Real-Time Heart Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={heartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[50, 120]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="bpm" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk & Alerts */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Level</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-3">
                  <span className="text-2xl font-bold text-primary">Low</span>
                </div>
                <p className="text-sm text-muted-foreground">Your heart health indicators are within normal range.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAlerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    {alertIcon(a.type)}
                    <div className="min-w-0">
                      <p className="text-sm leading-tight">{a.message}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
