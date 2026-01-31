import React from 'react';
import { ChatInterface } from '../components/ai/ChatInterface';
import { FinancialTable } from '../components/financial/FinancialTable';

interface OperationalConsolePageProps {
    orgId: string;
}

export const OperationalConsolePage: React.FC<OperationalConsolePageProps> = ({ orgId }) => {
    const entityIds = ["ent_1"];
    const accountIds = ["acc_1"];
    const periodIds = ["2026_01"];

    return (
        <div className="h-[calc(100vh-64px)] p-2 overflow-hidden animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-full">
                {/* Zone A: Command / Chat */}
                <div className="md:col-span-4 h-full">
                    <ChatInterface orgId={orgId} />
                </div>

                {/* Zone C: Result / Table */}
                <div className="md:col-span-8 h-full">
                    <div className="p-2 h-full overflow-hidden flex flex-col bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <h2 className="text-lg font-bold text-white mb-2 px-2">Live Financial Records</h2>
                        <div className="flex-grow overflow-hidden rounded-xl border border-white/5 bg-black/20">
                            <FinancialTable
                                orgId={orgId}
                                entityIds={entityIds}
                                accountIds={accountIds}
                                periodIds={periodIds}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
