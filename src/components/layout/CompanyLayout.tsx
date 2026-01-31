import React from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setCurrentCompany } from '@/store/companySlice';

/**
 * Layout wrapper for company-specific routes
 * Ensures correct company is set based on URL parameter
 * Pattern: /companies/:orgId/*
 */
export const CompanyLayout: React.FC = () => {
    const { orgId } = useParams<{ orgId: string }>();
    const dispatch = useDispatch();
    const { currentCompany, companies } = useSelector((state: RootState) => state.company);

    // Hardcoded fallback companies
    const mandatoryCompanies = [
        { org_id: 'SOCAR_GROUP', org_name: 'SOCAR Group (Consolidated)', org_code: 'SOCAR', company_type: 'Holding' },
        { org_id: 'SGG', org_name: 'SOCAR Georgia Gas', org_code: 'SGG', company_type: 'Subsidiary' },
        { org_id: 'SGP', org_name: 'SOCAR Georgia Petroleum', org_code: 'SGP', company_type: 'Subsidiary' }
    ];

    const allCompanies = [...companies];
    mandatoryCompanies.forEach(mc => {
        if (!allCompanies.find(c => c.org_id === mc.org_id)) {
            allCompanies.push(mc);
        }
    });

    // Find company by orgId from URL
    const company = allCompanies.find(c => (c.org_id || '').toLowerCase() === (orgId || '').toLowerCase());

    // If company not found, redirect to dashboard
    if (!company) {
        return <Navigate to="/dashboard" replace />;
    }

    // Set current company if different
    React.useEffect(() => {
        if (currentCompany?.org_id !== company.org_id) {
            dispatch(setCurrentCompany(company));
        }
    }, [company.org_id, currentCompany?.org_id, dispatch]);

    // Render child routes
    return <Outlet />;
};
