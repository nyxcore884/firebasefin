import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCompanies, setCurrentCompany } from '../../store/companySlice';
import { RootState, AppDispatch } from '../../store';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useNavigate } from 'react-router-dom';

export const CompanySelector: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { companies, currentCompany, loading } = useSelector((state: RootState) => state.company);

    useEffect(() => {
        dispatch(fetchCompanies());
    }, [dispatch]);

    // Hardcoded Fallbacks to ENSURE navigation works even if DB is empty
    const mandatoryCompanies = [
        { org_id: 'SOCAR_GROUP', org_name: 'SOCAR Group (Consolidated)', org_code: 'SOCAR', company_type: 'Holding' },
        { org_id: 'SGG', org_name: 'SOCAR Georgia Gas', org_code: 'SGG', company_type: 'Subsidiary' },
        { org_id: 'SGP', org_name: 'SOCAR Georgia Petroleum', org_code: 'SGP', company_type: 'Subsidiary' }
    ];

    // Merge fetched companies with mandatory ones (deduplicating by ID)
    const displayCompanies = [...companies];
    mandatoryCompanies.forEach(mc => {
        if (!displayCompanies.find(c => c.org_id === mc.org_id)) {
            displayCompanies.push(mc);
        }
    });

    const handleChange = (orgId: string) => {
        const company = displayCompanies.find((c: any) => c.org_id === orgId);
        if (company) {
            dispatch(setCurrentCompany(company));

            // Navigate to company-specific routes
            const normalizedOrgId = orgId.toUpperCase();
            if (normalizedOrgId === 'SGP' || normalizedOrgId.includes('SGP')) {
                navigate(`/companies/${orgId.toLowerCase()}/dashboard`);
            } else if (normalizedOrgId === 'SGG' || normalizedOrgId.includes('SGG')) {
                navigate(`/companies/${orgId.toLowerCase()}/dashboard`);
            } else {
                navigate('/dashboard'); // SOCAR Group / Consolidated
            }
        }
    };

    // ... loading ...

    return (
        <div className="flex flex-col gap-1.5 w-full relative z-[100]">
            <Select
                value={currentCompany?.org_id || ''}
                onValueChange={handleChange}
            >
                <SelectTrigger className="bg-white/5 border-primary/20 text-white h-10 rounded-2xl hover:border-primary/60 hover:bg-primary/5 transition-all shadow-vivid text-[11px] font-black uppercase tracking-widest backdrop-blur-3xl group">
                    <SelectValue placeholder="Select Organization" />
                </SelectTrigger>
                <SelectContent className="bg-[#020617]/95 border-white/10 text-white backdrop-blur-3xl rounded-3xl p-3 shadow-[0_0_80px_rgba(0,0,0,0.8)] border-primary/20">
                    <div className="px-4 py-2 mb-2">
                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.4em]">Intelligence Nodes</span>
                    </div>
                    {displayCompanies.map((company: any) => (
                        <SelectItem
                            key={company.org_id}
                            value={company.org_id}
                            className="focus:bg-primary/20 focus:text-white cursor-pointer rounded-2xl py-4 px-5 transition-all group/item mb-1.5"
                        >
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-vivid" />
                                    <span className="font-black text-[11px] uppercase tracking-widest text-white text-glow-vivid group-hover/item:text-primary transition-colors">
                                        {company.org_code}
                                    </span>
                                </div>
                                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">
                                    {company.org_name}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
