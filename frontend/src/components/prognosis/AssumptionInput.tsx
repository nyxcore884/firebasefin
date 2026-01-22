import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AssumptionInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
}

export function AssumptionInput({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    unit = ""
}: AssumptionInputProps) {

    const handleSliderChange = (vals: number[]) => {
        onChange(vals[0]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            onChange(val);
        }
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-card/50">
            <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">{label}</Label>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        value={value}
                        onChange={handleInputChange}
                        className="w-20 h-8 text-right"
                    />
                    <span className="text-xs text-muted-foreground w-8">{unit}</span>
                </div>
            </div>
            <Slider
                value={[value]}
                onValueChange={handleSliderChange}
                min={min}
                max={max}
                step={step}
                className="py-2"
            />
        </div>
    );
}
