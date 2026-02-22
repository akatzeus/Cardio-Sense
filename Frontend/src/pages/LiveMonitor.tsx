import { useEffect, useState, useCallback } from "react";
import { Heart, Play, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const LiveMonitor = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [data, setData] = useState<{ time: string; bpm: number }[]>([]);

  const addPoint = useCallback(() => {
    setData((prev) => {
      const next = [...prev];
      next.push({
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        bpm: Math.floor(65 + Math.random() * 30 + Math.sin(Date.now() / 2000) * 8),
      });
      if (next.length > 50) next.shift();
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(addPoint, 1000);
    return () => clearInterval(interval);
  }, [isRunning, addPoint]);

  const currentBpm = data.length > 0 ? data[data.length - 1].bpm : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={() => { setIsRunning(!isRunning); if (!isRunning) addPoint(); }} size="lg">
            {isRunning ? <><Square className="mr-2 h-4 w-4" /> Stop Session</> : <><Play className="mr-2 h-4 w-4" /> Start Session</>}
          </Button>
          <Badge variant={isRunning ? "default" : "secondary"} className="text-sm py-1 px-3">
            {isRunning ? "● Recording" : "Idle"}
          </Badge>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="md:col-span-1">
            <CardContent className="pt-6 text-center">
              <Heart className={`h-10 w-10 mx-auto mb-2 text-primary ${isRunning ? "animate-pulse" : ""}`} />
              <p className="text-5xl font-bold">{currentBpm || "—"}</p>
              <p className="text-sm text-muted-foreground mt-1">BPM</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-3">
            <CardHeader><CardTitle className="text-base">Live Heart Rate</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[50, 120]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="bpm" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LiveMonitor;
