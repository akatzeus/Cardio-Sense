import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateHistoricalData, pastPredictions } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const ranges = ["7 Days", "14 Days", "30 Days"] as const;

const HistoryTrends = () => {
  const [range, setRange] = useState<(typeof ranges)[number]>("30 Days");
  const days = range === "7 Days" ? 7 : range === "14 Days" ? 14 : 30;
  const chartData = generateHistoricalData(days);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {ranges.map((r) => (
            <Button key={r} variant={range === r ? "default" : "outline"} size="sm" onClick={() => setRange(r)}>
              {r}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Heart Rate Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[40, 130]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgBpm" name="Avg BPM" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="maxBpm" name="Max BPM" stroke="hsl(var(--chart-5))" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="minBpm" name="Min BPM" stroke="hsl(var(--chart-3))" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Past Predictions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Avg BPM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastPredictions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.date}</TableCell>
                    <TableCell>{p.result}</TableCell>
                    <TableCell>
                      <Badge variant={p.risk === "Low" ? "default" : p.risk === "Medium" ? "secondary" : "destructive"} className={p.risk === "Low" ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}>
                        {p.risk}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.bpmAvg}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Avg BPM (Period)</p><p className="text-3xl font-bold">73</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Max Recorded</p><p className="text-3xl font-bold">112</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Min Recorded</p><p className="text-3xl font-bold">58</p></CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HistoryTrends;
