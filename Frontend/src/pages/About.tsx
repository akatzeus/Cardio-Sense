import { Heart, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import DashboardLayout from "@/components/DashboardLayout";

const faqs = [
  { q: "What smartwatches are supported?", a: "Currently, CardioSense supports Samsung Galaxy Watch models with PPG heart rate sensors. Support for more devices is planned." },
  { q: "How accurate are the predictions?", a: "Our ML models are trained on medical datasets (UCI, Cleveland, Kaggle) and achieve over 92% accuracy in detecting anomalies. However, this is not a substitute for professional medical advice." },
  { q: "Is my health data secure?", a: "Yes. All data is encrypted in transit and at rest. We follow HIPAA-compliant practices and never share identifiable data without explicit consent." },
  { q: "Can my doctor access my data?", a: "Yes, you can enable doctor sharing in your Profile settings. Your doctor will receive read-only access to your heart rate data and prediction history." },
  { q: "What should I do if I receive a high-risk alert?", a: "High-risk alerts are advisory. Please consult your healthcare provider promptly for professional evaluation. Do not rely solely on CardioSense for medical decisions." },
];

const About = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary fill-primary" /> About CardioSense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>CardioSense is a smartwatch-based heart disease prediction system that integrates IoT, machine learning, and web technologies to enable continuous heart health monitoring.</p>
            <p>It uses Samsung Smartwatch PPG sensors to collect real-time heart rate data, which is then analyzed using ML models trained on established medical datasets. The ReactJS dashboard provides live visualization, historical trends, and prediction results to support proactive healthcare.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>How to Use</CardTitle></CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Pair your Samsung Smartwatch via the <strong>Profile</strong> page.</li>
              <li>Navigate to <strong>Live Monitor</strong> and start a session to see real-time BPM.</li>
              <li>Check <strong>Predictions</strong> for AI-generated risk assessments.</li>
              <li>Review <strong>History & Trends</strong> for long-term insights.</li>
              <li>Customize alerts and sharing in <strong>Profile</strong> settings.</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>FAQ</CardTitle></CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Support</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Need help? Contact us at <a href="mailto:support@cardiosense.io" className="text-primary hover:underline">support@cardiosense.io</a> or call +1 (555) 123-4567.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default About;
