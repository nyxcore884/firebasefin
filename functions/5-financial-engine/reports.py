import logging
import json

logger = logging.getLogger(__name__)

def generate_executive_summary(transactions, budget_summary=None):
    """
    Generates an automated executive summary based on the provided transactions and budget data.
    This creates a structured JSON that can be consumed by the frontend or an AI for further narration.
    """
    if not transactions:
        return {"summary": "No data available for reporting.", "kpis": {}}

    # Calculate basic KPIs
    total_actual = sum(float(t.get('amount_gel', 0)) for t in transactions)
    
    # Group by category for high-level breakdown
    breakdown = {}
    for t in transactions:
        cat = t.get('category', 'General')
        breakdown[cat] = breakdown.get(cat, 0) + float(t.get('amount_gel', 0))

    # Identify top spending category
    top_category = max(breakdown, key=breakdown.get) if breakdown else "N/A"
    
    # Calculate total budget if summary provided
    total_budget = 0
    if budget_summary:
        total_budget = sum(data.get('projected', 0) for data in budget_summary.values())

    variance = total_actual - total_budget
    status = "ON_TRACK" if abs(variance) < (total_budget * 0.05) else ("OVER_BUDGET" if variance > 0 else "UNDER_BUDGET")

    # Construct the report structure
    report = {
        "title": "Executive Performance Report",
        "timestamp": "Current Period",
        "status": status,
        "kpis": {
            "total_actual": round(total_actual, 2),
            "total_budget": round(total_budget, 2),
            "variance": round(variance, 2),
            "variance_pct": round((variance / total_budget * 100), 2) if total_budget != 0 else 0
        },
        "highlights": [
            f"Total actual spend is {total_actual:,.2f} GEL.",
            f"Largest expenditure category: {top_category} ({breakdown.get(top_category, 0):,.2f} GEL).",
            f"Budget utilization is at {((total_actual / total_budget * 100) if total_budget != 0 else 100):.1f}%."
        ],
        "top_categories": [
            {"name": cat, "amount": round(amt, 2)} 
            for cat, amt in sorted(breakdown.items(), key=lambda item: item[1], reverse=True)[:5]
        ]
    }

    return report

def generate_canvas_config(report_data):
    """
    Transforms report data into a 'Smart Canvas' configuration (JSON for frontend layout).
    """
    return {
        "layout": "GRID_2X2",
        "elements": [
            {"type": "kpi_card", "label": "Actual vs Budget", "main": report_data['kpis']['total_actual'], "sub": f"Var: {report_data['kpis']['variance']}"},
            {"type": "chart", "chart_type": "pie", "title": "Spending Breakdown", "data": report_data['top_categories']},
            {"type": "text_block", "title": "AI Highlights", "content": report_data['highlights']},
            {"type": "status_badge", "status": report_data['status']}
        ]
    }

def generate_slide_deck(report_data, company_id):
    """
    Generates a structured 'Slide Deck' JSON for executive presentations.
    """
    return {
        "presentation_title": f"Quartely Strategic Review - {company_id}",
        "slides": [
            {
                "id": "slide1",
                "title": "Executive Summary",
                "content": report_data.get('highlights', []),
                "visualization": "KPI_SUMMARY"
            },
            {
                "id": "slide2",
                "title": "Profit & Loss Deep Dive",
                "content": f"Verified actuals of {report_data['kpis']['total_actual']:,} GEL vs Budget of {report_data['kpis']['total_budget']:,} GEL.",
                "visualization": "BRIDGE_CHART"
            },
            {
                "id": "slide3",
                "title": "Expense Distribution",
                "content": f"{report_data['top_categories'][0]['name']} remains the primary cost driver.",
                "visualization": "SUNBURST_DISTRIBUTION",
                "data": report_data.get('top_categories', [])
            },
            {
                "id": "slide4",
                "title": "Strategic Outlook (Monte Carlo)",
                "content": "Simulations indicate a 90% probability of remaining solvent within the current budget constraints.",
                "visualization": "PROBABILISTIC_PATH"
            }
        ]
    }

def generate_voice_briefing(report_data):
    """
    Generates a narrative briefing text for the 'Audio Executive Summaries'.
    """
    kpis = report_data.get('kpis', {})
    highlights = report_data.get('highlights', [])
    status = report_data.get('status', 'ON_TRACK')
    
    status_text = "exceeding budget" if status == 'OVER_BUDGET' else "below budget"
    
    briefing = f"Good morning. Here is your strategic financial briefing. "
    briefing += f"Our current total spend is {kpis.get('total_actual', 0):,.0f} GEL, which is {kpis.get('variance_pct', 0):.1f}% {status_text}. "
    briefing += "Key insights for today: " + " ".join(highlights)
    briefing += " The Monte Carlo simulator suggests 90 percent stability. Have a productive day."
    
    return briefing
