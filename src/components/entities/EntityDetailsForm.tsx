import React, { useState, useEffect } from 'react';
import {
    Save,
    RotateCcw,
    Info,
    Tag,
    Network,
    Globe,
    Share2
} from 'lucide-react';
import { Entity } from '@/store/entitySlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface EntityDetailsFormProps {
    entity?: Entity;
    isNew?: boolean;
    onSubmit: (data: Partial<Entity>) => void;
    onCancel: () => void;
}

export const EntityDetailsForm: React.FC<EntityDetailsFormProps> = ({
    entity,
    isNew,
    onSubmit,
    onCancel
}) => {
    const [formData, setFormData] = useState<Partial<Entity>>({
        name: '',
        type: 'legal_entity',
        parentId: '',
        ownershipPct: 100,
        currency: 'GEL',
        isConsolidationNode: false,
        ...entity
    });

    useEffect(() => {
        if (entity) setFormData(entity);
    }, [entity]);

    const handleChange = (field: keyof Entity, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="mt-4 space-y-8 p-1">
            {/* Base Identification */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest">
                    <Tag size={14} /> Basic Identification
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8 space-y-2">
                        <Label htmlFor="entityName">Entity Name</Label>
                        <Input
                            id="entityName"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="e.g. SOCAR Gas Georgia"
                            className="bg-slate-900/50 border-white/10"
                        />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                        <Label htmlFor="entityType">Entity Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => handleChange('type', val)}
                        >
                            <SelectTrigger id="entityType" className="bg-slate-900/50 border-white/10">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="holding">Holding Company</SelectItem>
                                <SelectItem value="legal_entity">Legal Entity</SelectItem>
                                <SelectItem value="region">Region / Division</SelectItem>
                                <SelectItem value="branch">Local Branch</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="h-px bg-white/10 w-full" />

            {/* Ownership Structure */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest">
                    <Network size={14} /> Ownership & Structure
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Parent Entity</Label>
                        <Select
                            value={formData.parentId || ''}
                            onValueChange={(val) => handleChange('parentId', val)}
                        >
                            <SelectTrigger className="bg-slate-900/50 border-white/10">
                                <SelectValue placeholder="None (Top Level)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none_top_level">None (Top Level)</SelectItem>
                                <SelectItem value="socar_energy_georgia">SOCAR Energy Georgia</SelectItem>
                                <SelectItem value="sgg_corp">SGG Corporate</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4 px-1">
                        <div className="flex justify-between">
                            <Label className="text-slate-400">Ownership Percentage</Label>
                            <span className="font-bold text-lg">{formData.ownershipPct}%</span>
                        </div>
                        <Slider
                            value={[typeof formData.ownershipPct === 'number' ? formData.ownershipPct : 100]}
                            onValueChange={(val) => handleChange('ownershipPct', val[0])}
                            max={100}
                            step={1}
                            className="py-4"
                        />
                    </div>
                </div>
            </div>

            <div className="h-px bg-white/10 w-full" />

            {/* Financial Settings */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest">
                    <Globe size={14} /> Financial Configuration
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 space-y-2">
                        <Label>Functional Currency</Label>
                        <Select
                            value={formData.currency}
                            onValueChange={(val) => handleChange('currency', val)}
                        >
                            <SelectTrigger className="bg-slate-900/50 border-white/10">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GEL">GEL - Georgian Lari</SelectItem>
                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-8">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base font-bold">Mark as Consolidation Node</Label>
                                <p className="text-xs text-slate-400">Financials will be rolled up to this entity from its descendants.</p>
                            </div>
                            <Switch
                                checked={formData.isConsolidationNode}
                                onCheckedChange={(checked) => handleChange('isConsolidationNode', checked)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-white/10 w-full" />

            {/* Intercompany Relations */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest">
                    <Share2 size={14} /> Intercompany Relationships
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/5 space-y-4">
                    <p className="text-sm text-slate-300">
                        Define how this entity interacts with other group members for automated eliminations.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="flex items-center space-x-3">
                            <Switch defaultChecked id="auto-ic" />
                            <Label htmlFor="auto-ic" className="cursor-pointer">Enable Automated IC Matching</Label>
                        </div>
                        <div className="space-y-2">
                            <Label>Primary IC Partner</Label>
                            <Select>
                                <SelectTrigger className="bg-slate-900/50 border-white/10 h-9">
                                    <SelectValue placeholder="Select primary trading partner" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sgg_corp">SGG Corporate</SelectItem>
                                    <SelectItem value="telavgas">TelavGas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            {typeof formData.ownershipPct === 'number' && formData.ownershipPct < 100 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <Info size={18} className="mt-0.5 shrink-0" />
                    <p className="text-sm">
                        Non-controlling interest of <strong className="font-bold">{100 - formData.ownershipPct}%</strong> will be automatically calculated during consolidation.
                    </p>
                </div>
            )}

            <div className="h-px bg-white/10 w-full my-6" />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="border-white/10 hover:bg-white/5 hover:text-white"
                >
                    <RotateCcw size={16} className="mr-2" />
                    Cancel
                </Button>
                <Button
                    onClick={() => onSubmit(formData)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                >
                    <Save size={16} className="mr-2" />
                    Save Changes
                </Button>
            </div>
        </div>
    );
};
