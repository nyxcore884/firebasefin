import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Info, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const initialTrainingSets = [
    { id: 'actual_py', name: 'Actual PY (History)', records: '15,400', included: true, lastTrained: 'Oct 28, 2023' },
    { id: 'july_sgg', name: 'July SGG (Current)', records: '850', included: true, lastTrained: 'Pending' },
    { id: 'year_2026', name: 'Year 2026 (Forecast)', records: '12,000', included: false, lastTrained: 'Never' },
];

const AITrainingControls = () => {
    const [trainingSets, setTrainingSets] = useState(initialTrainingSets);
    const [saving, setSaving] = useState(false);

    const handleToggle = (id: string, checked: boolean) => {
        setTrainingSets(prev => prev.map(set =>
            set.id === id ? { ...set, included: checked } : set
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/process-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ml_config',
                    sub_action: 'update',
                    config: {
                        trainingSets: trainingSets.filter(s => s.included).map(s => s.id)
                    }
                })
            });
            if (res.ok) {
                toast.success("AI Training Configuration Synchronized");
            } else {
                throw new Error("Sync failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to sync training controls");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="h-full bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-primary" />
                        <CardTitle>Glass Box AI Training</CardTitle>
                    </div>
                </div>
                <CardDescription>Control the data feeding the prediction models.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {trainingSets.map((set) => (
                        <div key={set.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">{set.name}</span>
                                    {!set.included && <Badge variant="outline" className="text-[10px] h-5">Excluded</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    {set.records} records • Last trained: {set.lastTrained}
                                </p>
                            </div>
                            <Switch
                                checked={set.included}
                                onCheckedChange={(c) => handleToggle(set.id, c)}
                            />
                        </div>
                    ))}

                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                        <p className="text-[10px] text-blue-500">
                            <strong>Tip:</strong> Excluding forecast data (like Year 2026) prevents the model from training on its own predictions (Circular Hallucination).
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                            <Save className="h-4 w-4" />
                            {saving ? "Saving..." : "Update Configuration"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default AITrainingControls;
