import { Heart, Activity, Brain, BarChart3, Watch, Cpu, LineChart, TrendingUp, ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { testimonials } from "@/lib/mockData";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    { icon: Brain, title: "AI-Powered Accuracy", desc: "Machine learning models trained on medical datasets for reliable heart disease prediction." },
    { icon: Activity, title: "Real-Time Monitoring", desc: "Continuous heart rate tracking from your Samsung Smartwatch with instant updates." },
    { icon: BarChart3, title: "Deep Analysis", desc: "Historical trends, anomaly detection, and actionable health insights at your fingertips." },
  ];

  const steps = [
    { icon: Watch, title: "Wear Your Watch", desc: "Connect your Samsung Smartwatch to start collecting heart rate data via PPG sensors." },
    { icon: Cpu, title: "AI Analyzes", desc: "Our ML models process your heart rate patterns against medical datasets in real time." },
    { icon: LineChart, title: "Receive Insights", desc: "Get instant predictions, risk assessments, and personalized health recommendations." },
    { icon: TrendingUp, title: "Track Progress", desc: "Monitor trends over time and share reports with your healthcare provider." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span>CardioSense</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/auth">Login</Link></Button>
            <Button asChild><Link to="/auth">Get Started</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-6">
              <Activity className="h-4 w-4" /> AI-Powered Heart Health
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your Heart Health, <span className="text-primary">Predicted</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              CardioSense uses IoT sensors and machine learning to monitor your heart in real time, detect anomalies early, and predict potential risks before they become problems.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild><Link to="/dashboard">Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/auth">Create Account</Link></Button>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-72 h-72 md:w-80 md:h-80 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-56 h-56 md:w-64 md:h-64 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="h-24 w-24 text-primary fill-primary/30 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted/50 py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Why CardioSense?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Advanced technology meets preventive healthcare for smarter heart monitoring.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <Card key={f.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6 px-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Four simple steps to smarter heart health monitoring.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {i + 1}
                </div>
                <s.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-muted/50 py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">What People Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-none shadow-md">
                <CardContent className="pt-6 pb-6">
                  <p className="text-muted-foreground italic mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback className="bg-primary text-primary-foreground text-sm">{t.avatar}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t py-12">
        <div className="container grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg mb-3">
              <Heart className="h-5 w-5 text-primary fill-primary" />
              CardioSense
            </div>
            <p className="text-sm text-muted-foreground">AI-powered heart health prediction and monitoring system.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="#features" className="block hover:text-foreground">Features</a>
              <a href="#how-it-works" className="block hover:text-foreground">How It Works</a>
              <Link to="/about" className="block hover:text-foreground">About</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Platform</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="block hover:text-foreground">Dashboard</Link>
              <Link to="/auth" className="block hover:text-foreground">Login</Link>
              <Link to="/about" className="block hover:text-foreground">Help</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@cardiosense.io</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> +1 (555) 123-4567</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> San Francisco, CA</div>
            </div>
          </div>
        </div>
        <div className="container mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          © 2026 CardioSense. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
