import { Watch, Bell, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/DashboardLayout";

const Profile = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input defaultValue="John Doe" /></div>
              <div className="space-y-2"><Label>Age</Label><Input type="number" defaultValue="34" /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue="john@example.com" /></div>
            <div className="space-y-2"><Label>Medical History (Optional)</Label><Textarea placeholder="Any relevant medical conditions, medications, etc." rows={3} /></div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Watch className="h-5 w-5 text-primary" /> Device Connection</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Samsung Galaxy Watch 5</p>
                <p className="text-sm text-muted-foreground">Last synced: 5 minutes ago</p>
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Paired</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notification Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {["Anomaly Alerts", "Daily Summary", "Weekly Report"].map((label) => (
              <div key={label} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-primary" /> Data Sharing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {["Share with Doctor", "Anonymous Research Data"].map((label) => (
              <div key={label} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch defaultChecked={label === "Share with Doctor"} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
