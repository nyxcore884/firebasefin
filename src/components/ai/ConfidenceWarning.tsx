import React from 'react';

interface ConfidenceWarningProps {
    score: number;
    reasonCode?: string;
    lastUpdate?: Date | string;
}

export const ConfidenceWarning: React.FC<ConfidenceWarningProps> = ({ score, reasonCode = 'UNKNOWN', lastUpdate }) => {
    // Calculate hours since last update if provided
    let isStale = false;
    let hoursAgo = 0;

    if (lastUpdate) {
        const updateDate = new Date(lastUpdate);
        const now = new Date();
        hoursAgo = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60));
        isStale = hoursAgo > 24;
    }

    // Define logic for the explaining mark
    const reasonMap: Record<string, string> = {
        'UNMAPPED_DATA': 'The report contains products not found in the master mapping table. These are excluded from the margin.',
        'OUTLIER_DETECTED': 'A significant price anomaly was detected in this period (e.g. >50% price spike).',
        'DATA_ANOMALY': 'Found negative values where positive values were expected.',
        'FUZZY_MATCH': 'We used a partial keyword match for some items. Accuracy might be slightly lower.',
        'LOW_HISTORY': 'The AI has less than 3 months of history for this fuel type, making the forecast less reliable.',
        'UNKNOWN': 'Standard logic check flagged a potential issue.'
    };

    return (
        <div className="flex flex-col gap-2 mb-4 animate-fade-in w-[90%] mx-auto">
            {/* Data Freshness Indicator */}
            {lastUpdate && (
                <div className={`text-xs px-2 py-1 rounded w-fit font-medium ${isStale ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isStale ? '⚠️ Data is stale' : '✅ Data is current'} (Last updated: {hoursAgo}h ago)
                </div>
            )}

            {/* AI Confidence Warning */}
            {score < 0.85 && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded flex items-start gap-3 shadow-sm">
                    <div className="text-amber-600 text-lg">⚠️</div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-amber-800 text-sm font-bold">Low Confidence ({Math.round(score * 100)}%)</span>
                            {/* Explaining Mark */}
                            <div className="group relative">
                                <div className="cursor-help bg-amber-200 text-amber-800 text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">i</div>
                                <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-2 left-0 bg-slate-800 text-white text-xs rounded shadow-lg z-50">
                                    {reasonMap[reasonCode] || reasonMap['UNKNOWN']}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-amber-700 italic mt-1">Reason: {reasonCode.replace('_', ' ')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
