import io
import json
import logging
from firebase_functions import https_fn, options
# import pandas as pd # Lazy
# from reportlab.pdfgen import canvas # Lazy

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mock Data Source
def get_report_data():
    return [
        {"date": "2023-01-15", "item": "Consulting Fee", "amount": 5000, "currency": "USD"},
        {"date": "2023-01-20", "item": "Server Hosts", "amount": 1200, "currency": "USD"},
        {"date": "2023-02-05", "item": "Software Lic", "amount": 800, "currency": "EUR"},
    ]

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["post", "get", "options"]),
    timeout_sec=300,
    memory=options.MemoryOption.MB_512,
)
def download_report(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP Entrypoint for Generating Reports.
    Expects POST with JSON data or GET.
    """
    try:
        from flask import send_file
        import pandas as pd
        
        # 1. Parse Request
        fmt = req.args.get('format', 'pdf').lower()
        
        # Accept data from POST body or fall back
        req_json = req.get_json(silent=True) or {}
        
        # Default/Mock Data if empty
        report_data = req_json.get('metrics', {
            "revenue": 0, "cogs": 0, "gross_margin": 0,
            "operating_expenses": 0, "ebitda": 0, "net_income": 0,
            "breakdown": {}
        })
        company_name = req_json.get('company', 'SOCAR Georgia Gas')
        period = req_json.get('period', '2024 Q1')

        if fmt == 'pdf':
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            
            buffer = io.BytesIO()
            c = canvas.Canvas(buffer, pagesize=letter)
            width, height = letter
            
            # --- SOCAR Header ---
            c.setFont("Helvetica-Bold", 18)
            c.drawString(50, height - 50, f"{company_name} - Financial Report")
            
            c.setFont("Helvetica", 10)
            c.setFillColorRGB(0.5, 0.5, 0.5)
            c.drawString(50, height - 65, f"Period: {period} | Generated: {pd.Timestamp.now().strftime('%Y-%m-%d')}")
            
            c.setStrokeColorRGB(0.8, 0.8, 0.8)
            c.line(50, height - 75, width - 50, height - 75)

            # --- Executive Summary ---
            c.setFillColorRGB(0, 0, 0)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, height - 110, "Executive Summary")
            
            c.setFont("Helvetica", 11)
            summary_text = f"Net Income for the period is {report_data.get('net_income', 0):,} GEL."
            c.drawString(50, height - 130, summary_text)

            # --- Financial Table ---
            y = height - 180
            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, y, "Metric")
            c.drawRightString(400, y, "Amount (GEL)")
            
            y -= 10
            c.line(50, y, 400, y)
            y -= 25
            
            items = [
                ("Revenue", report_data.get('revenue', 0), True),
                ("Cost of Goods Sold", -report_data.get('cogs', 0), False),
                ("Gross Margin", report_data.get('gross_margin', 0), True),
                ("Operating Expenses", -report_data.get('operating_expenses', 0), False),
                ("EBITDA", report_data.get('ebitda', 0), True),
                ("Depreciation & Amortization", -report_data.get('breakdown', {}).get('depreciation', 0), False),
                ("EBIT", report_data.get('ebitda', 0) - report_data.get('breakdown', {}).get('depreciation', 0), False),
                ("Interest & Taxes", -report_data.get('breakdown', {}).get('taxes', 0) - report_data.get('breakdown', {}).get('interest', 0), False),
                ("Net Income", report_data.get('net_income', 0), True),
            ]

            for name, val, is_bold in items:
                c.setFont("Helvetica-Bold" if is_bold else "Helvetica", 11)
                c.drawString(50, y, name)
                
                # Format currency
                val_str = f"{val:,.2f}"
                if val < 0: val_str = f"({abs(val):,.2f})"
                
                c.drawRightString(400, y, val_str)
                y -= 20
                if name == "Gross Margin" or name == "EBITDA":
                    y -= 10 # Spacing

            # Footer
            c.setFont("Helvetica-Oblique", 9)
            c.setFillColorRGB(0.6, 0.6, 0.6)
            c.drawCentredString(width/2, 30, "Confidential - Internal Use Only")

            c.showPage()
            c.save()
            buffer.seek(0)
            
            # Using Flask's send_file logic but returning via https_fn.Response
            # Actually https_fn.Response can take bytes directly.
            return https_fn.Response(
                buffer.read(),
                mimetype='application/pdf',
                headers={'Content-Disposition': 'attachment; filename=Financial_Report.pdf'}
            )

        elif fmt == 'excel':
            buffer = io.BytesIO()
            # Flatten for Excel
            # Sheet 1: Summary
            df_summary = pd.DataFrame([report_data])
            
            # Sheet 2: Transactions
            txns = req_json.get('transactions', [])
            df_txns = pd.DataFrame(txns) if txns else pd.DataFrame([{'info': 'No detailed transaction data provided'}])

            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df_summary.to_excel(writer, sheet_name='Executive Summary', index=False)
                df_txns.to_excel(writer, sheet_name='Detailed Transactions', index=False)
                
            buffer.seek(0)
            return https_fn.Response(
                buffer.read(),
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                headers={'Content-Disposition': 'attachment; filename=Financial_Report.xlsx'}
            )
            
        else:
             return https_fn.Response(json.dumps({"error": "Unsupported format. Use pdf or excel."}), status=400, headers={"Content-Type": "application/json"})

    except Exception as e:
        logger.error(f"Reporting Error: {e}")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
