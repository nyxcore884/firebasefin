import os

pages = [
    "src/pages/dashboard/DashboardHome.tsx",
    "src/pages/data/DataLibrary.tsx",
    "src/pages/data/DataQuality.tsx",
    "src/pages/data/Templates.tsx",
    "src/pages/analysis/LiveDashboardPage.tsx",
    "src/pages/analysis/ProfitLoss.tsx",
    "src/pages/analysis/BalanceSheet.tsx",
    "src/pages/analysis/CashFlow.tsx",
    "src/pages/analysis/Consolidation.tsx",
    "src/pages/reports/GenerateReport.tsx",
    "src/pages/reports/ReportHistory.tsx",
    "src/pages/ai/AiAssistant.tsx",
    "src/pages/ai/Insights.tsx",
    "src/pages/workflows/WorkflowBuilder.tsx",
    "src/pages/workflows/ActiveWorkflows.tsx",
    "src/pages/settings/SettingsPage.tsx",
]

base_dir = r"d:\GIT FIREBASE FIN\firebasefin-main\firebasefin-main"

for rel_path in pages:
    abs_path = os.path.join(base_dir, rel_path)
    if os.path.exists(abs_path):
        with open(abs_path, 'r') as f:
            content = f.read()
        
        # Simple string replacements for the known errors
        new_content = content.replace("p=3", "p={3}")
        new_content = new_content.replace("sx={ p: 4", "sx={{ p: 4")
        new_content = new_content.replace("secondary' }", "secondary' }}")
        
        with open(abs_path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {rel_path}")
    else:
        print(f"Skipped (not found): {rel_path}")
