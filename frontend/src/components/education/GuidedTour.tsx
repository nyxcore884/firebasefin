import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Footprints, CheckCircle2 } from "lucide-react";

export const GuidedTour = () => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);

    const steps = [
        { id: 1, text: 'Navigate to the "AI-Driven Financial Management" page.' },
        { id: 2, text: 'Explore the "AI Education" section to understand the algorithms.' },
        { id: 3, text: 'Use the "Model Tuning" controls to adjust hyperparameters.' },
        { id: 4, text: 'Monitor results in the "Live Anomaly Feed" and "Performance Dashboard".' },
    ];

    const handleNext = () => {
        if (step < steps.length) setStep(step + 1);
        else setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg">
                    <Footprints className="mr-2 h-4 w-4" /> Start Guided Tour
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Footprints className="h-5 w-5 text-indigo-500" />
                        Platform Tour (Step {step}/{steps.length})
                    </DialogTitle>
                    <DialogDescription>
                        Follow these steps to master the AI Financial Management tools.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <ol className="relative border-l border-muted-foreground/20 ml-3 space-y-6">
                        {steps.map((s) => (
                            <li key={s.id} className="mb-2 ml-6">
                                <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-4 ring-background transition-colors
                                    ${s.id < step ? 'bg-green-500 text-white' : s.id === step ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground'}
                                `}>
                                    {s.id < step ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[10px] font-bold">{s.id}</span>}
                                </span>
                                <h3 className={`font-medium text-sm transition-colors ${s.id === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {s.text}
                                </h3>
                            </li>
                        ))}
                    </ol>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Skip</Button>
                    <Button onClick={handleNext}>
                        {step === steps.length ? 'Finish' : 'Next Step'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
