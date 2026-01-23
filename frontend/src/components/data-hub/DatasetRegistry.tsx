import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Database, ShieldCheck, GitBranch, Search, Plus, Loader2, Tag } from 'lucide-react';
import { DatasetMetadata } from '../../types/registry';
import { toast } from 'sonner';

// Mock Data for "Discovery" before backend integration is fully live
const MOCK_DATASETS: DatasetMetadata[] = [
    {
        id: "financial_transactions",
        name: "Financial Transactions",
        description: "Consolidated view of all GL movements across SGG subsidiaries.",
        owner: "finance_team@socar.ge",
        tags: ["finance", "core", "transactions"],
        schema: { "trx_id": "string", "amount": "float", "gl_code": "string" },
        lineage: ["SAP_S4HANA", "Mapping_Engine"],
        quality_rules: ["unique_transaction_id", "valid_currency"],
        quality_status: [
            { rule: "unique_transaction_id", passed: true, timestamp: Date.now() },
            { rule: "valid_currency", passed: true, timestamp: Date.now() }
        ]
    },
    {
        id: "customer_master",
        name: "Customer Master Data",
        description: "Golden record of all B2B and B2C customers.",
        owner: "sales_ops@socar.ge",
        tags: ["master_data", "sales"],
        schema: { "cust_id": "string", "name": "string", "vat_num": "string" },
        lineage: ["CRM_Salesforce"],
        quality_rules: ["valid_vat_format"],
        quality_status: [
            { rule: "valid_vat_format", passed: false, timestamp: Date.now() }
        ]
    }
];

export default function DatasetRegistry() {
    const [datasets, setDatasets] = useState<DatasetMetadata[]>(MOCK_DATASETS);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newOwner, setNewOwner] = useState("");
    const [newTags, setNewTags] = useState("");

    const handleRegister = async () => {
        setLoading(true);
        try {
            // Prepare Payload
            const payload: DatasetMetadata = {
                name: newName,
                description: newDesc,
                owner: newOwner,
                tags: newTags.split(',').map(t => t.trim()),
                schema: {}, // Placeholder
                lineage: [], // Placeholder
                quality_rules: ["default_schema_check"]
            };

            // Call Backend (Mock or Real)
            // const res = await fetch('http://localhost:5001/firebasefin-main/us-central1/registry_api', { ... })

            // Simulating success
            await new Promise(r => setTimeout(r, 1000));

            const newDatasetWithId = {
                ...payload,
                id: newName.toLowerCase().replace(/\s+/g, '_'),
                quality_status: [{ rule: "default_schema_check", passed: true, timestamp: Date.now() }]
            };

            setDatasets(prev => [...prev, newDatasetWithId]);
            toast.success("Dataset Registered Successfully");
            setIsRegistering(false);
            resetForm();

        } catch (e) {
            toast.error("Registration Failed");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewName(""); setNewDesc(""); setNewOwner(""); setNewTags("");
    };

    const filteredDatasets = datasets.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Sidebar: Navigation & Filters (Simulated) */}
            <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle>Catalog Filters</CardTitle>
                    <CardDescription>Refine your data search</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search datasets..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 pt-4">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2">
                            {["finance", "master_data", "sales", "hr", "operations"].map(tag => (
                                <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-muted">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <Button className="w-full mt-4" onClick={() => setIsRegistering(!isRegistering)}>
                        <Plus className="mr-2 h-4 w-4" /> Register New Dataset
                    </Button>
                </CardContent>
            </Card>

            {/* Main Content: Registry List or Form */}
            <div className="lg:col-span-2 space-y-6">

                {isRegistering ? (
                    <Card className="animate-in fade-in slide-in-from-right-4">
                        <CardHeader>
                            <CardTitle>Register New Dataset</CardTitle>
                            <CardDescription>Define metadata for governance validation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Dataset Name</Label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Employee Payroll 2024" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What is this data used for?" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Data Owner (Email)</Label>
                                <Input value={newOwner} onChange={e => setNewOwner(e.target.value)} placeholder="owner@socar.ge" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tags (comma separated)</Label>
                                <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="finance, sensitive, payroll" />
                            </div>

                            <div className="flex gap-2 justify-end pt-4">
                                <Button variant="ghost" onClick={() => setIsRegistering(false)}>Cancel</Button>
                                <Button onClick={handleRegister} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Registration
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredDatasets.map(dataset => (
                            <Card key={dataset.id} className="hover:border-primary/50 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Database className="h-5 w-5 text-blue-500" />
                                                {dataset.name}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 mt-2">
                                                {dataset.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="text-xs font-normal">
                                                        <Tag className="h-3 w-3 mr-1" /> {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-muted-foreground block">Owner</span>
                                            <span className="text-sm font-medium">{dataset.owner}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {dataset.description}
                                    </p>

                                    <div className="flex gap-6 pt-4 border-t">
                                        <div className="flex-1">
                                            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                                <GitBranch className="h-3 w-3" /> Lineage
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                {dataset.lineage.length > 0 ? dataset.lineage.join(" → ") : "No lineage data"}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                                <ShieldCheck className="h-3 w-3" /> Health Status
                                            </div>
                                            <div className="space-y-1">
                                                {dataset.quality_status?.map((qc, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                                        <span className={`h-2 w-2 rounded-full ${qc.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                        <span className={qc.passed ? 'text-emerald-500' : 'text-rose-500'}>
                                                            {qc.rule}: {qc.passed ? 'PASS' : 'FAIL'}
                                                        </span>
                                                    </div>
                                                )) || <span className="text-xs text-muted-foreground">No checks run</span>}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
