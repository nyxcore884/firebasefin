import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { SGPFileUpload } from '@/components/common/SGPFileUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, BarChart3, CloudRain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SGPDashboard: React.FC = () => {
    const { currentCompany } = useSelector((state: RootState) => state.company);
    const navigate = useNavigate();

    // Security Check: If somehow on this page but NOT SGP, redirect away
    useEffect(() => {
        const isSGP = currentCompany?.org_id.toUpperCase().includes('SGP') || currentCompany?.org_id === 'socar_petroleum';
        if (currentCompany && !isSGP) {
            navigate('/dashboard');
        }
    }, [currentCompany, navigate]);

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
                <h1 className="text-3xl font-display font-bold text-white tracking-wide uppercase">
                    SOCAR Georgia Petroleum
                </h1>
                <p className="text-emerald-400 font-mono text-sm tracking-wider uppercase">
                    Running SGP Specific Financial Engine v2.0
                </p>
            </div>

            {/* SGP Main Feature Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Ingestion Control (Left) */}
                <div className="space-y-6">
                    <SGPFileUpload />

                    {/* Additional SGP Controls could go here */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold text-slate-300 uppercase">System Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                                <span>Parser Engine</span>
                                <span className="text-emerald-400">ACTIVE</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                                <span>Product Mapping</span>
                                <span className="text-emerald-400">SYNCED</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                                <span>Training Context</span>
                                <span className="text-amber-400">LEARNING</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. SGP Unique Analytics (Right) */}
                <div className="space-y-6">
                    <Card className="bg-black/40 border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <TrendingUp className="text-indigo-400" />
                                Fuel Volume Velocity
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                Real-time analysis of Diesel vs Premium flow.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-64 flex items-center justify-center border-t border-white/5">
                            <span className="text-slate-600 text-xs italic">
                                [Chart Visualization Area - Connects to BigQuery]
                            </span>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <CloudRain className="text-cyan-400" />
                                Station Efficiency
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-40 flex items-center justify-center border-t border-white/5">
                            <span className="text-slate-600 text-xs italic">
                                [Heatmap Visualization Area]
                            </span>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
