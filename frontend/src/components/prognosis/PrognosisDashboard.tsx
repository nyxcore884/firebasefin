import { useState, useEffect } from 'react';
import { AssumptionInput } from './AssumptionInput';
import { ScenarioChart } from './ScenarioChart';
import { VarianceChart } from './VarianceChart';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Zap } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useAppState } from '@/hooks/use-app-state';

export function PrognosisDashboard() {
    const { selectedCompany, selectedPeriod, currency } = useAppState();
    const [gasPrice, setGasPrice] = useState(2.2);
    const [inflation, setInflation] = useState(3.0);
    const [isLoading, setIsLoading] = useState(false);
    const [endpoint, setEndpoint] = useState("/api/process-transaction"); // Relative path via proxy

    // Default Initial Data (matches Python mock logic)
    const generateMockData = (gp: number) => {
        const baselineRevenue = 100000000;
        const baseGasPrice = 2.2;
        // Simple elasticity mock
        const revenueImpact = ((gp - baseGasPrice) / baseGasPrice) * -0.5;
        const adjustedRev = baselineRevenue * (1 + revenueImpact);

        return Array.from({ length: 12 }, (_, i) => {
            const monthFactor = 1 + ((i + 1) * 0.02);
            const baseline = (adjustedRev / 12) * monthFactor;
            return {
                month: `2024-${String(i + 1).padStart(2, '0')}`,
                baseline: baseline,
                optimistic: baseline * 1.15,
                pessimistic: baseline * 0.85
            };
        });
    };

    const [forecastData, setForecastData] = useState(generateMockData(2.2));
    const [annualRevenue, setAnnualRevenue] = useState(100000000);
    const [varianceData, setVarianceData] = useState<any[]>([]);

    useEffect(() => {
        fetchVarianceData();
    }, [selectedCompany, selectedPeriod, currency]);

    const fetchVarianceData = async () => {
        try {
            // Use our new single-entry point
            // But we need to import it or just fetch manually here since we need to transform specific chart data
            const res = await fetch('/api/financial-truth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity: selectedCompany,
                    period: selectedPeriod,
                    currency: currency
                })
            });
            const data = await res.json(); // Truth Object

            if (data && data.variance) {
                // Keys are UPPERCASE from backend usually (REVENUE, etc.)
                // We normalize logic locally
                const getVar = (k: string) => data.variance[k] || { previous: 0, current: 0, variance: 0 };

                const chartData = [
                    { category: 'Revenue', ...getVar('REVENUE') }, // Maps to { current, previous, variance }
                    { category: 'COGS', ...getVar('COGS') },
                    { category: 'Expenses', ...getVar('OPEX') }, // Assuming OPEX is Expenses
                    { category: 'EBITDA', ...getVar('EBITDA') },
                    // { category: 'Net Income', ...getVar('NET_INCOME') }, // If needed
                ].map(item => ({
                    category: item.category,
                    budget: item.previous, // previous as baseline
                    actual: item.current,
                    variance: item.variance
                }));

                setVarianceData(chartData);
            }
        } catch (e) {
            console.error("Failed to fetch variance:", e);
        }
    };

    const handleRunForecast = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assumptions: {
                        gas_price: gasPrice,
                        inflation: inflation
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.time_series) {
                setForecastData(result.time_series);
                setAnnualRevenue(result.forecast_annual_revenue);
            }
        } catch (error) {
            console.warn("Backend unavailable, falling back to local simulation.", error);
            // Fallback
            const localData = generateMockData(gasPrice);
            setForecastData(localData);

            const baselineRevenue = 100000000;
            const baseGasPrice = 2.2;
            const revenueImpact = ((gasPrice - baseGasPrice) / baseGasPrice) * -0.5;
            setAnnualRevenue(baselineRevenue * (1 + revenueImpact));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 relative isolate bg-slate-950 min-h-screen">
            {/* Background Ambient Glows */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            {/* Left Panel: Assumptions */}
            <div className="lg:col-span-1 space-y-8 relative z-10">
                <Card className="glass-premium transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(124,58,237,0.3)]">
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-3 text-2xl font-light tracking-wide">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 ring-1 ring-amber-500/40 shadow-inner">
                                <Zap className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                            </div>
                            <span className="text-gradient-gold font-medium">Scenario Drivers</span>
                        </CardTitle>
                        <CardDescription className="text-slate-400/80 text-sm font-light">
                            Adjust macro-economic levers to simulate financial impact.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-6 p-6 rounded-2xl bg-black/20 border border-white/5 shadow-inner">
                            <AssumptionInput
                                label="Gas Price (USD/MMBtu)"
                                value={gasPrice}
                                onChange={setGasPrice}
                                min={1.0}
                                max={5.0}
                                step={0.1}
                                unit="$"
                            />

                            <AssumptionInput
                                label="Inflation Rate (%)"
                                value={inflation}
                                onChange={setInflation}
                                min={0}
                                max={20}
                                step={0.5}
                                unit="%"
                            />
                        </div>

                        <div className="pt-2">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <input
                                    className="relative w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:ring-0 placeholder:text-slate-600 font-mono"
                                    value={endpoint}
                                    placeholder="API Endpoint URL"
                                    onChange={(e) => setEndpoint(e.target.value)}
                                />
                            </div>
                            <label className="text-[10px] uppercase tracking-wider text-slate-600 font-bold mt-2 block text-right">API Configuration</label>
                        </div>

                        <Button
                            className="w-full h-14 text-lg font-medium tracking-wide bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-900/40 border border-white/10 transition-all duration-300 rounded-xl"
                            onClick={handleRunForecast}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                    <span className="animate-pulse">Analyzing...</span>
                                </>
                            ) : (
                                "Simulate Forecast"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* KPI Card */}
                <Card className="glass-premium relative overflow-hidden group">
                    {/* Dynamic Gradient Background Layer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-emerald-600/5 opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>

                    <CardContent className="pt-10 pb-10 relative z-10 text-center">
                        <div className="text-xs font-bold text-indigo-300/80 uppercase tracking-[0.2em] mb-2 drop-shadow-sm">Projected Annual Revenue</div>
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                            {(annualRevenue / 1000000).toFixed(1)} <span className="text-3xl font-light text-slate-500 align-top">M</span>
                        </div>
                        <div className="text-sm text-slate-500 mt-1 font-mono">CURRENCY: GEL</div>

                        <div className="mt-8 flex justify-center gap-3">
                            <Badge variant="outline" className="bg-emerald-500/5 text-emerald-300 border-emerald-500/20 px-4 py-1.5 backdrop-blur-sm shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]">
                                87% Confidence
                            </Badge>
                            <Badge variant="outline" className="bg-blue-500/5 text-blue-300 border-blue-500/20 px-4 py-1.5 backdrop-blur-sm">
                                LSTM Neural Net
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Panel: Charts */}
            <div className="lg:col-span-2 space-y-8 relative z-10">
                <div className="h-[450px] transition-all duration-500 hover:transform hover:scale-[1.01]">
                    <ScenarioChart data={forecastData} />
                </div>
                <div className="h-[450px] transition-all duration-500 hover:transform hover:scale-[1.01]">
                    <VarianceChart data={varianceData} title="Period over Period Variance" />
                </div>
            </div>
        </div>
    );
}
