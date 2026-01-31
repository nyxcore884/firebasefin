import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, Gauge, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SGPFileUpload } from '@/components/common/SGPFileUpload'; // You might want to rename this to GenericFileUpload or create SGGFileUpload

export const SGGDashboard: React.FC = () => {
    const { currentCompany } = useSelector((state: RootState) => state.company);
    const navigate = useNavigate();

    useEffect(() => {
        // Strict Guard
        if (currentCompany && !currentCompany.org_id.includes('SGG')) {
            // navigate('/dashboard'); // Allow some flexibility or show warning
        }
    }, [currentCompany, navigate]);

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
                <h1 className="text-3xl font-display font-bold text-white tracking-wide uppercase">
                    SOCAR Georgia Gas (SGG)
                </h1>
                <p className="text-amber-500 font-mono text-sm tracking-wider uppercase">
                    Pipeline Infrastructure & Distribution Hub
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Reuse Upload for now, but label it SGG */}
                    <Card className="bg-black/40 border-amber-500/20">
                        <CardHeader>
                            <CardTitle className="text-white">Data Ingestion (SGG)</CardTitle>
                            <CardDescription>Upload Gas Distribution Reports</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SGPFileUpload />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-black/40 border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Flame className="text-amber-500" />
                                Pressure Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-64 flex items-center justify-center border-t border-white/5">
                            <span className="text-slate-600 text-xs italic">
                                [Pressure/Flow Charts]
                            </span>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
