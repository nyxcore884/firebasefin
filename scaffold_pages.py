import os

# Define the precise structure from COMPLETE_UI_SPECIFICATION.md
pages = {
    "src/pages/dashboard/DashboardHome.tsx": "Dashboard Home",
    "src/pages/data/ImportData.tsx": "Import Data",
    "src/pages/data/DataLibrary.tsx": "Data Library",
    "src/pages/data/DataQuality.tsx": "Data Quality",
    "src/pages/data/Templates.tsx": "Templates",
    "src/pages/analysis/LiveDashboardPage.tsx": "Live Dashboard",
    "src/pages/analysis/ProfitLoss.tsx": "Profit & Loss Analysis",
    "src/pages/analysis/BalanceSheet.tsx": "Balance Sheet Analysis",
    "src/pages/analysis/CashFlow.tsx": "Cash Flow Analysis",
    "src/pages/analysis/Consolidation.tsx": "Consolidation",
    "src/pages/reports/GenerateReport.tsx": "Generate Report",
    "src/pages/reports/ReportHistory.tsx": "Report History",
    "src/pages/ai/AiAssistant.tsx": "AI Assistant",
    "src/pages/ai/Insights.tsx": "AI Insights",
    "src/pages/workflows/WorkflowBuilder.tsx": "Workflow Builder",
    "src/pages/workflows/ActiveWorkflows.tsx": "Active Workflows",
    "src/pages/settings/SettingsPage.tsx": "Settings"
}

base_dir = "d:/GIT FIREBASE FIN/firebasefin-main/firebasefin-main"

def create_component(path, name):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    content = f"""import React from 'react';
import {{ Box, Typography, Paper }} from '@mui/material';

export const {os.path.basename(path).replace('.tsx', '')}: React.FC = () => {{
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>{name}</Typography>
      <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="h6">Coming Soon</Typography>
        <Typography>This page is being implemented as part of Phase 26.</Typography>
      </Paper>
    </Box>
  );
}};
"""
    if not os.path.exists(full_path):
        with open(full_path, "w") as f:
            f.write(content)
        print(f"Created {path}")
    else:
        print(f"Skipped {path} (Exists)")

if __name__ == "__main__":
    for path, name in pages.items():
        create_component(path, name)
