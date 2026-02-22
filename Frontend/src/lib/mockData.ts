// Generate simulated heart rate data
export const generateHeartRateData = (points: number = 30) => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < points; i++) {
    data.push({
      time: new Date(now - (points - i) * 2000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      bpm: Math.floor(65 + Math.random() * 30 + Math.sin(i / 5) * 10),
    });
  }
  return data;
};

export const generateHistoricalData = (days: number = 30) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avgBpm: Math.floor(68 + Math.random() * 15),
      maxBpm: Math.floor(90 + Math.random() * 30),
      minBpm: Math.floor(55 + Math.random() * 10),
    });
  }
  return data;
};

export const pastPredictions = [
  { id: 1, date: "2026-02-20", result: "Normal", risk: "Low", bpmAvg: 72 },
  { id: 2, date: "2026-02-18", result: "Normal", risk: "Low", bpmAvg: 75 },
  { id: 3, date: "2026-02-15", result: "Abnormal", risk: "Medium", bpmAvg: 95 },
  { id: 4, date: "2026-02-12", result: "Normal", risk: "Low", bpmAvg: 70 },
  { id: 5, date: "2026-02-10", result: "Normal", risk: "Low", bpmAvg: 68 },
  { id: 6, date: "2026-02-07", result: "Abnormal", risk: "High", bpmAvg: 110 },
  { id: 7, date: "2026-02-04", result: "Normal", risk: "Low", bpmAvg: 71 },
];

export const recentAlerts = [
  { id: 1, message: "Heart rate spike detected (112 BPM)", time: "2 hours ago", type: "warning" as const },
  { id: 2, message: "Daily analysis complete — Normal", time: "5 hours ago", type: "success" as const },
  { id: 3, message: "New prediction result available", time: "1 day ago", type: "info" as const },
  { id: 4, message: "Irregular rhythm detected briefly", time: "2 days ago", type: "warning" as const },
];

export const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Cardiologist",
    text: "CardioSense has transformed how I monitor my patients' heart health remotely. The real-time data is invaluable.",
    avatar: "SC",
  },
  {
    name: "James Wilson",
    role: "Patient",
    text: "Thanks to CardioSense, I caught an irregular heartbeat early. The alerts gave me peace of mind.",
    avatar: "JW",
  },
  {
    name: "Dr. Priya Patel",
    role: "General Practitioner",
    text: "The prediction accuracy and ease of use make CardioSense an essential tool in preventive care.",
    avatar: "PP",
  },
];
