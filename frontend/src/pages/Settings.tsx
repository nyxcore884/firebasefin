
import { toast } from 'sonner';
import { 
  User, 
  Lock, 
  Bell, 
  Eye, 
  Palette, 
  ShieldCheck, 
  Cpu, 
  Cloud,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { 
    theme, 
    setTheme, 
    animateBackground,
    setAnimateBackground
  } = useSettings();

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-glow">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and application configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation */}
        <div className="space-y-2">
          {[
            { label: 'Profile', icon: User, active: true },
            { label: 'Security', icon: Lock },
            { label: 'Notifications', icon: Bell },
            { label: 'Appearance', icon: Palette },
            { label: 'Privacy', icon: Eye },
            { label: 'Integrations', icon: Cloud },
          ].map((item) => (
            <button 
              key={item.label}
              onClick={() => toast.info('This functionality is not yet implemented.')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium",
                item.active 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Account Profile</CardTitle>
              <CardDescription>Update your personal information and professional details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-border/50">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/20 relative group cursor-pointer">
                  <User className="h-8 w-8 text-primary" />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Monitor className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold">John Doe</h3>
                  <p className="text-sm text-muted-foreground">Senior Financial Analyst • Finance Dept</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => toast.info('This functionality is not yet implemented.')}>Change Avatar</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Full Name</Label>
                  <div className="px-4 py-2.5 rounded-lg bg-muted/20 border border-border/50 text-sm">John Doe</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Email Address</Label>
                  <div className="px-4 py-2.5 rounded-lg bg-muted/20 border border-border/50 text-sm">john.doe@example.com</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Configure how FinSight behaves and interacts with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Dark Theme</p>
                    <p className="text-xs text-muted-foreground">Switch between light and dark visual modes</p>
                  </div>
                </div>
                <Switch 
                  checked={theme === 'dark'} 
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Dynamic Background</p>
                    <p className="text-xs text-muted-foreground">Enable floating gradients and neural animations</p>
                  </div>
                </div>
                <Switch 
                  checked={animateBackground} 
                  onCheckedChange={setAnimateBackground} 
                />
              </div>

              {[
                { title: 'AI Insights', desc: 'Show automated financial anomalies on dashboard', icon: Cpu },
                { title: 'Push Notifications', desc: 'Alert me about budget variances exceeding 10%', icon: Bell },
                { title: 'Strict Precision', desc: 'Display up to 6 decimal places for all calculations', icon: ShieldCheck },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <pref.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{pref.title}</p>
                      <p className="text-xs text-muted-foreground">{pref.desc}</p>
                    </div>
                  </div>
                  <Switch defaultChecked onCheckedChange={() => toast.info('This functionality is not yet implemented.')} />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="ghost" onClick={() => toast.info('This functionality is not yet implemented.')}>Cancel</Button>
            <Button className="shadow-lg shadow-primary/20 px-8" onClick={() => toast.info('This functionality is not yet implemented.')}>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
