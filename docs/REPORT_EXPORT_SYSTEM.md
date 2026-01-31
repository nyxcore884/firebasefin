# Report Export & Generation System
## Multi-Format Export with Professional Output

---

## COMPREHENSIVE EXPORT CAPABILITIES

### 1. SUPPORTED EXPORT FORMATS

✅ **PDF** - Professional reports with charts, tables, branding
✅ **Excel (XLSX)** - Editable spreadsheets with formulas, formatting
✅ **PowerPoint (PPTX)** - Presentation-ready slides
✅ **Word (DOCX)** - Formatted documents
✅ **CSV** - Raw data export
✅ **JSON** - API integration
✅ **HTML** - Web-viewable reports
✅ **Email** - Direct delivery

---

## 2. REPORT GENERATOR ARCHITECTURE

```python
# services/report_generator.py
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
from openpyxl.chart import LineChart, BarChart, Reference
from pptx import Presentation
from pptx.util import Inches, Pt
from docx import Document
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO

class UniversalReportGenerator:
    """
    Generate professional reports in any format
    """
    
    def __init__(self):
        self.pdf_generator = PDFGenerator()
        self.excel_generator = ExcelGenerator()
        self.powerpoint_generator = PowerPointGenerator()
        self.word_generator = WordGenerator()
    
    async def generate_report(
        self,
        report_data: ReportData,
        format: str,
        template: Optional[str] = None,
        branding: Optional[BrandingConfig] = None
    ) -> GeneratedReport:
        """
        Generate report in specified format
        """
        
        if format == 'pdf':
            return await self.pdf_generator.generate(report_data, template, branding)
        elif format == 'xlsx':
            return await self.excel_generator.generate(report_data, template, branding)
        elif format == 'pptx':
            return await self.powerpoint_generator.generate(report_data, template, branding)
        elif format == 'docx':
            return await self.word_generator.generate(report_data, template, branding)
        elif format == 'csv':
            return await self.export_csv(report_data)
        elif format == 'json':
            return await self.export_json(report_data)
        elif format == 'html':
            return await self.export_html(report_data, template)
        else:
            raise ValueError(f"Unsupported format: {format}")
```

---

## 3. PDF REPORT GENERATION

```python
class PDFGenerator:
    """
    Generate professional PDF reports
    """
    
    async def generate(
        self,
        data: ReportData,
        template: Optional[str],
        branding: Optional[BrandingConfig]
    ) -> bytes:
        """
        Create PDF report with charts, tables, and formatting
        """
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        story = []
        styles = getSampleStyleSheet()
        
        # 1. Cover Page
        if branding and branding.logo:
            logo = Image(branding.logo, width=2*inch, height=1*inch)
            story.append(logo)
            story.append(Spacer(1, 12))
        
        # Title
        title = Paragraph(
            f"<font size=24><b>{data.title}</b></font>",
            styles['Title']
        )
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Metadata
        metadata = Paragraph(
            f"""<font size=10>
            Generated: {datetime.now().strftime('%B %d, %Y')}<br/>
            Period: {data.period_start} to {data.period_end}<br/>
            Organization: {data.org_name}
            </font>""",
            styles['Normal']
        )
        story.append(metadata)
        story.append(Spacer(1, 24))
        
        # 2. Executive Summary
        story.append(Paragraph("<font size=16><b>Executive Summary</b></font>", styles['Heading1']))
        story.append(Spacer(1, 12))
        
        summary = Paragraph(data.executive_summary, styles['Normal'])
        story.append(summary)
        story.append(Spacer(1, 24))
        
        # 3. Key Metrics (Table)
        story.append(Paragraph("<font size=16><b>Key Metrics</b></font>", styles['Heading1']))
        story.append(Spacer(1, 12))
        
        kpi_data = [
            ['Metric', 'Current', 'Budget', 'Variance'],
            *[[kpi.name, f"₾{kpi.current:,.0f}", f"₾{kpi.budget:,.0f}", f"{kpi.variance:+.1f}%"] 
              for kpi in data.kpis]
        ]
        
        kpi_table = Table(kpi_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch, 1*inch])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 24))
        
        # 4. Charts
        story.append(Paragraph("<font size=16><b>Visual Analysis</b></font>", styles['Heading1']))
        story.append(Spacer(1, 12))
        
        for chart_data in data.charts:
            chart_image = self.generate_chart(chart_data)
            story.append(Image(chart_image, width=6*inch, height=4*inch))
            story.append(Spacer(1, 12))
        
        # 5. Detailed Data
        story.append(Paragraph("<font size=16><b>Detailed Financial Data</b></font>", styles['Heading1']))
        story.append(Spacer(1, 12))
        
        # Create detailed table
        detail_data = [
            ['Account', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Total'],
            *[[row.account_name, *[f"₾{v:,.0f}" for v in row.monthly_values], f"₾{row.total:,.0f}"]
              for row in data.detail_rows]
        ]
        
        detail_table = Table(detail_data, repeatRows=1)
        detail_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        story.append(detail_table)
        
        # Build PDF
        doc.build(story)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def generate_chart(self, chart_data: ChartData) -> BytesIO:
        """
        Generate chart as image for PDF
        """
        fig, ax = plt.subplots(figsize=(10, 6))
        
        if chart_data.chart_type == 'line':
            for series in chart_data.series:
                ax.plot(chart_data.labels, series.values, label=series.name, marker='o')
        
        elif chart_data.chart_type == 'bar':
            x = range(len(chart_data.labels))
            width = 0.35
            for i, series in enumerate(chart_data.series):
                ax.bar([p + width*i for p in x], series.values, width, label=series.name)
            ax.set_xticks([p + width for p in x])
            ax.set_xticklabels(chart_data.labels)
        
        ax.set_title(chart_data.title, fontsize=14, fontweight='bold')
        ax.set_xlabel(chart_data.x_label)
        ax.set_ylabel(chart_data.y_label)
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        # Save to buffer
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
        plt.close()
        
        buffer.seek(0)
        return buffer
```

---

## 4. EXCEL EXPORT WITH FORMULAS

```python
class ExcelGenerator:
    """
    Generate Excel files with formulas, formatting, and charts
    """
    
    async def generate(
        self,
        data: ReportData,
        template: Optional[str],
        branding: Optional[BrandingConfig]
    ) -> bytes:
        """
        Create Excel workbook with multiple sheets
        """
        
        wb = Workbook()
        
        # Remove default sheet
        wb.remove(wb.active)
        
        # 1. Summary Sheet
        ws_summary = wb.create_sheet("Summary", 0)
        await self.create_summary_sheet(ws_summary, data, branding)
        
        # 2. Detailed Data Sheet
        ws_detail = wb.create_sheet("Detailed Data", 1)
        await self.create_detail_sheet(ws_detail, data)
        
        # 3. Charts Sheet
        ws_charts = wb.create_sheet("Charts", 2)
        await self.create_charts_sheet(ws_charts, data)
        
        # 4. Pivot Table (optional)
        if data.include_pivot:
            ws_pivot = wb.create_sheet("Pivot Analysis", 3)
            await self.create_pivot_sheet(ws_pivot, data)
        
        # Save to buffer
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        
        return buffer.getvalue()
    
    async def create_summary_sheet(
        self,
        ws,
        data: ReportData,
        branding: Optional[BrandingConfig]
    ):
        """
        Create summary sheet with KPIs
        """
        
        # Header
        ws['A1'] = data.title
        ws['A1'].font = Font(size=18, bold=True)
        
        ws['A2'] = f"Period: {data.period_start} to {data.period_end}"
        ws['A2'].font = Font(size=10, italic=True)
        
        # KPI Section
        row = 4
        ws[f'A{row}'] = "Key Performance Indicators"
        ws[f'A{row}'].font = Font(size=14, bold=True)
        
        row += 2
        headers = ['Metric', 'Current', 'Budget', 'Variance', 'Variance %']
        for col, header in enumerate(headers, start=1):
            cell = ws.cell(row=row, column=col, value=header)
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            cell.font = Font(bold=True, color="FFFFFF")
        
        row += 1
        for kpi in data.kpis:
            ws.cell(row=row, column=1, value=kpi.name)
            ws.cell(row=row, column=2, value=kpi.current)
            ws.cell(row=row, column=3, value=kpi.budget)
            
            # Variance formula
            ws.cell(row=row, column=4, value=f"=B{row}-C{row}")
            ws.cell(row=row, column=5, value=f"=(B{row}-C{row})/C{row}")
            
            # Format as currency and percentage
            ws.cell(row=row, column=2).number_format = '₾#,##0'
            ws.cell(row=row, column=3).number_format = '₾#,##0'
            ws.cell(row=row, column=4).number_format = '₾#,##0'
            ws.cell(row=row, column=5).number_format = '0.0%'
            
            # Conditional formatting for variance
            if kpi.variance < 0:
                ws.cell(row=row, column=5).font = Font(color="FF0000")
            else:
                ws.cell(row=row, column=5).font = Font(color="00B050")
            
            row += 1
        
        # Auto-fit columns
        for col in ws.columns:
            max_length = 0
            column = col[0].column_letter
            for cell in col:
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))
            ws.column_dimensions[column].width = max_length + 2
    
    async def create_charts_sheet(
        self,
        ws,
        data: ReportData
    ):
        """
        Create charts in Excel
        """
        
        # Create chart data in worksheet first
        row = 1
        ws.cell(row=row, column=1, value="Month")
        for col, series in enumerate(data.charts[0].series, start=2):
            ws.cell(row=row, column=col, value=series.name)
        
        for i, label in enumerate(data.charts[0].labels, start=2):
            ws.cell(row=i, column=1, value=label)
            for col, series in enumerate(data.charts[0].series, start=2):
                ws.cell(row=i, column=col, value=series.values[i-2])
        
        # Create line chart
        chart = LineChart()
        chart.title = data.charts[0].title
        chart.style = 13
        chart.y_axis.title = data.charts[0].y_label
        chart.x_axis.title = data.charts[0].x_label
        
        data_ref = Reference(
            ws,
            min_col=2,
            min_row=1,
            max_row=len(data.charts[0].labels) + 1,
            max_col=len(data.charts[0].series) + 1
        )
        cats = Reference(ws, min_col=1, min_row=2, max_row=len(data.charts[0].labels) + 1)
        
        chart.add_data(data_ref, titles_from_data=True)
        chart.set_categories(cats)
        
        ws.add_chart(chart, "E2")
```

---

## 5. POWERPOINT GENERATION

```python
class PowerPointGenerator:
    """
    Generate PowerPoint presentations
    """
    
    async def generate(
        self,
        data: ReportData,
        template: Optional[str],
        branding: Optional[BrandingConfig]
    ) -> bytes:
        """
        Create PowerPoint presentation
        """
        
        prs = Presentation()
        
        # Set slide size
        prs.slide_width = Inches(10)
        prs.slide_height = Inches(7.5)
        
        # 1. Title Slide
        title_slide_layout = prs.slide_layouts[0]
        slide = prs.slides.add_slide(title_slide_layout)
        title = slide.shapes.title
        subtitle = slide.placeholders[1]
        
        title.text = data.title
        subtitle.text = f"{data.org_name}\n{data.period_start} - {data.period_end}"
        
        # 2. Executive Summary Slide
        bullet_slide_layout = prs.slide_layouts[1]
        slide = prs.slides.add_slide(bullet_slide_layout)
        shapes = slide.shapes
        
        title_shape = shapes.title
        body_shape = shapes.placeholders[1]
        
        title_shape.text = "Executive Summary"
        
        tf = body_shape.text_frame
        tf.text = data.executive_summary
        
        # 3. KPI Slide
        slide = prs.slides.add_slide(prs.slide_layouts[5])  # Blank layout
        title = slide.shapes.title
        title.text = "Key Performance Indicators"
        
        # Add KPI boxes
        left = Inches(1)
        top = Inches(2)
        width = Inches(2)
        height = Inches(1.5)
        
        for i, kpi in enumerate(data.kpis[:4]):  # Top 4 KPIs
            left_pos = left + (i % 2) * (width + Inches(0.5))
            top_pos = top + (i // 2) * (height + Inches(0.5))
            
            shape = slide.shapes.add_shape(
                1,  # Rectangle
                left_pos,
                top_pos,
                width,
                height
            )
            
            # Format
            shape.fill.solid()
            shape.fill.fore_color.rgb = RGBColor(54, 96, 146)
            
            text_frame = shape.text_frame
            text_frame.text = f"{kpi.name}\n₾{kpi.current:,.0f}\n{kpi.variance:+.1f}%"
            
            # Center align
            for paragraph in text_frame.paragraphs:
                paragraph.alignment = PP_ALIGN.CENTER
                paragraph.font.size = Pt(14)
                paragraph.font.bold = True
                paragraph.font.color.rgb = RGBColor(255, 255, 255)
        
        # 4. Chart Slides
        for chart_data in data.charts:
            slide = prs.slides.add_slide(prs.slide_layouts[5])
            title = slide.shapes.title
            title.text = chart_data.title
            
            # Generate chart image
            chart_image = self.generate_chart_image(chart_data)
            
            # Add to slide
            slide.shapes.add_picture(
                chart_image,
                Inches(1),
                Inches(1.5),
                width=Inches(8),
                height=Inches(5)
            )
        
        # Save to buffer
        buffer = BytesIO()
        prs.save(buffer)
        buffer.seek(0)
        
        return buffer.getvalue()
```

---

## 6. EMAIL DELIVERY

```python
class ReportDeliveryService:
    """
    Deliver reports via email
    """
    
    async def send_report(
        self,
        report: GeneratedReport,
        recipients: List[str],
        subject: str,
        message: str
    ):
        """
        Send report via email
        """
        
        # Use SendGrid or similar
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Attachment
        
        # Create email
        email = Mail(
            from_email='reports@financial-ai.com',
            to_emails=recipients,
            subject=subject,
            html_content=f"""
            <html>
            <body>
                <p>{message}</p>
                <p>Please find the attached {report.format.upper()} report.</p>
                <br>
                <p>Best regards,<br>Financial AI System</p>
            </body>
            </html>
            """
        )
        
        # Attach report
        attachment = Attachment(
            file_content=base64.b64encode(report.content).decode(),
            file_name=f"report_{datetime.now().strftime('%Y%m%d')}.{report.format}",
            file_type=self.get_mime_type(report.format),
            disposition='attachment'
        )
        email.attachment = attachment
        
        # Send
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(email)
        
        return response.status_code == 202
```

---

## 7. REPORT TEMPLATES

```python
class ReportTemplateManager:
    """
    Manage report templates
    """
    
    def get_templates(self) -> List[ReportTemplate]:
        """
        Available report templates
        """
        return [
            ReportTemplate(
                id="financial_summary",
                name="Financial Summary",
                description="Executive summary with key metrics",
                sections=[
                    "executive_summary",
                    "kpis",
                    "charts",
                    "commentary"
                ],
                formats=["pdf", "pptx"]
            ),
            ReportTemplate(
                id="detailed_analysis",
                name="Detailed Financial Analysis",
                description="Comprehensive analysis with all details",
                sections=[
                    "executive_summary",
                    "income_statement",
                    "balance_sheet",
                    "cash_flow",
                    "variance_analysis",
                    "trend_analysis",
                    "forecasts"
                ],
                formats=["pdf", "xlsx", "docx"]
            ),
            ReportTemplate(
                id="board_presentation",
                name="Board Presentation",
                description="Executive presentation for board meetings",
                sections=[
                    "cover",
                    "agenda",
                    "highlights",
                    "kpis",
                    "financial_performance",
                    "strategic_initiatives",
                    "risks_opportunities",
                    "recommendations"
                ],
                formats=["pptx"]
            ),
            ReportTemplate(
                id="monthly_close",
                name="Monthly Close Package",
                description="Complete month-end close documentation",
                sections=[
                    "summary",
                    "actual_vs_budget",
                    "yoy_comparison",
                    "commentary",
                    "adjustments",
                    "next_steps"
                ],
                formats=["pdf", "xlsx"]
            )
        ]
```

This report export system ensures users can get their data in ANY format they need!
