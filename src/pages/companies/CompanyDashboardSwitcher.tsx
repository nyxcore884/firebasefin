import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SGGDashboard } from './SGGDashboard';
import { SGPDashboard } from './SGPDashboard';

export const CompanyDashboardSwitcher: React.FC = () => {
    const { orgId } = useParams<{ orgId: string }>();

    if (!orgId) return <Navigate to="/dashboard" replace />;

    const normalizedId = orgId.toUpperCase();

    if (normalizedId === 'SGP' || normalizedId === 'SOCAR_PETROLEUM') {
        return <SGPDashboard />;
    }

    if (normalizedId === 'SGG' || normalizedId === 'SOCAR_GAS') {
        return <SGGDashboard />;
    }

    // Default fallback to SGG for now or redirect
    return <SGGDashboard />;
};
