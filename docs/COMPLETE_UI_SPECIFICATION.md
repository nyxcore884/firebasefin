# Complete UI Specification
## Every Page, Feature, File Upload & Operation Description

---

## UI ARCHITECTURE OVERVIEW

### Navigation Structure
```
Dashboard (Home)
├── Data Management
│   ├── Import Data
│   ├── Data Library
│   ├── Data Quality
│   └── Templates
├── Financial Analysis
│   ├── Live Dashboard
│   ├── P&L Analysis
│   ├── Balance Sheet
│   ├── Cash Flow
│   └── Consolidation
├── Reports
│   ├── Generate Report
│   ├── Report Templates
│   ├── Scheduled Reports
│   └── Report History
├── AI Assistant
│   ├── Ask Questions
│   ├── Insights
│   └── Conversation History
├── Workflows
│   ├── Workflow Builder
│   ├── Active Workflows
│   └── Workflow History
├── Settings
│   ├── Organization
│   ├── Users & Permissions
│   ├── Data Sources
│   └── Preferences
└── Help & Support
```

---

## PAGE-BY-PAGE SPECIFICATION

### 1. DASHBOARD (HOME PAGE)

**URL:** `/dashboard`

**Purpose:** Real-time overview of financial performance

**Features:**

#### 1.1 KPI Cards (Top Row)
- **Revenue Card**
  - Current month revenue
  - % change vs budget
  - % change vs last year
  - Sparkline (last 6 months)
  - Click → drill down to revenue analysis
  
- **EBITDA Card**
  - Current EBITDA
  - EBITDA margin %
  - Variance indicators
  - Trend arrow
  
- **Cash Position Card**
  - Current cash balance
  - Days cash on hand
  - Burn rate
  
- **Alert Count Card**
  - Number of active alerts
  - Severity breakdown
  - Click → go to alerts page

**Operation Visibility:**
```
🔴 LIVE indicator in top-right
"Last updated: 2 seconds ago"
"Refresh rate: Real-time"
```

#### 1.2 Quick Actions Bar
- **Upload Data** button
  - Opens file upload modal
  - Supports: XLSX, XLSB, CSV, PDF, images
  - Shows upload progress
  - Operation: "Parsing file structure..."
  
- **Ask AI** button
  - Opens AI chat sidebar
  - Natural language input
  - Operation: "Analyzing your question..."
  
- **Generate Report** button
  - Quick report generator
  - Template selector
  - Operation: "Building report..."

#### 1.3 Revenue Trend Chart
- Line chart showing monthly revenue
- Multiple entities (color-coded)
- Hover tooltips with exact values
- Click entity legend to toggle
- Export chart button
- **Operation indicator:** "Chart updating..." when data changes

#### 1.4 Top Variances Table
- Shows top 10 budget variances
- Sortable columns
- Color-coded (red/green)
- Click row → detailed analysis
- **Operation:** "Calculating variances..."

#### 1.5 Recent Activity Feed
- Real-time activity stream
- "User X uploaded file Y"
- "Workflow Z completed"
- "Alert A triggered"
- Timestamps
- Click → go to related item

**File Upload on This Page:**
- Drag & drop zone at bottom
- "Drop files here to import data"
- Supports all formats
- **Operation description:**
  ```
  Step 1: Validating file format... ✓
  Step 2: Detecting structure... ✓
  Step 3: Mapping accounts... ⏳
  ```

---

### 2. IMPORT DATA PAGE

**URL:** `/data/import`

**Purpose:** Upload and process financial data files

**Features:**

#### 2.1 File Upload Zone (Large Central Area)
- Drag & drop area
- "Choose File" button
- Supported formats displayed
- File size limits shown
- Multiple file upload
- **Real-time operation display:**
  ```
  📄 File: SOCAR_Budget_2026.xlsx
  ⏳ Parsing Excel structure...
  ✓ 54 sheets detected
  ⏳ Analyzing "Detailed Budget" sheet...
  ✓ Found 291 columns, 95 rows
  ⏳ Detecting entities (Imereti, Kakheti...)
  ✓ 16 entities identified
  ⏳ Mapping accounts...
  ✓ 87 accounts mapped
  ⏳ Running validation checks...
  ⚠ 3 warnings found (review below)
  ✓ Import complete!
  ```

#### 2.2 File Upload Options
- **Organization:** Dropdown selector
- **Data Type:** Actual / Budget / Forecast
- **Period:** Month/Quarter/Year selector
- **Entity:** Multi-select dropdown
- **Template Matching:**
  - Auto-detect checkbox
  - Manual template selector
  - "Learn as new template" option

#### 2.3 Upload History Table
- Recent uploads
- Status indicators
- File name
- Upload time
- Records imported
- Validation status
- Actions: View / Re-process / Delete

#### 2.4 Validation Results Panel
- **Data Quality Score:** 96/100
- **Errors:** (must fix before saving)
  - "Row 45: Revenue cannot be negative"
  - Click → go to row
- **Warnings:** (can proceed)
  - "Account '5.11.10' not in chart of accounts"
  - Suggest: "Map to existing" or "Create new"
- **Info:** 
  - "Georgian text detected and translated"
  - "Currency: GEL"

#### 2.5 Preview Table
- First 100 rows of imported data
- Edit cells inline
- Correct mappings
- Highlight issues
- **Operations shown:**
  ```
  🔄 Auto-correcting...
  ✓ Correction applied
  💾 Saving changes...
  ```

#### 2.6 Action Buttons
- **Cancel Import**
- **Save Draft**
- **Import with Warnings**
- **Import (if no errors)**

**File Upload Capability:**
✅ Multiple files simultaneously
✅ Drag & drop
✅ Paste from clipboard
✅ URL import
✅ API import

---

### 3. DATA LIBRARY PAGE

**URL:** `/data/library`

**Purpose:** Browse and manage all imported financial data

**Features:**

#### 3.1 Search & Filter Bar
- Text search
- Filter by:
  - Entity
  - Period
  - Data type
  - Upload date
  - User
- Saved filter presets

#### 3.2 Dataset Cards Grid
Each card shows:
- Dataset name
- Thumbnail/icon
- Period covered
- Entity count
- Record count
- Data quality score
- Last updated
- Actions: View / Edit / Export / Delete

**Click card → opens dataset details**

#### 3.3 Bulk Actions
- Select multiple datasets
- Bulk export
- Bulk delete
- Bulk re-validate
- **Operation:** "Processing 5 datasets..."

#### 3.4 Dataset Detail View (Modal/Sidebar)
- Full metadata
- Preview table
- Validation report
- Lineage (source files)
- Related datasets
- Export options
- Re-process button

**File Upload on This Page:**
- "+" button (top-right)
- Opens quick upload modal
- Same as import page but condensed

**Operations Displayed:**
```
Fetching dataset list... ✓
Loading preview... ✓
Calculating statistics... ✓
```

---

### 4. DATA QUALITY PAGE

**URL:** `/data/quality`

**Purpose:** Monitor and improve data quality

**Features:**

#### 4.1 Quality Score Dashboard
- Overall score (large number)
- Trend chart
- Breakdown by dimension:
  - Completeness
  - Accuracy
  - Consistency
  - Timeliness

#### 4.2 Issues List
- **Critical:** (blocking)
  - Red badge
  - Count
  - List of issues
  - Click → fix
  
- **Warnings:**
  - Yellow badge
  - Suggestions
  
- **Info:**
  - Blue badge
  - Best practices

#### 4.3 Quality Rules Manager
- View active rules
- Add custom rule
- Enable/disable rules
- Rule test interface

#### 4.4 Auto-Fix Suggestions
- AI-powered fixes
- "Apply Fix" button
- Preview changes
- Undo capability
- **Operation:** "Applying fix to 45 records..."

**File Upload:**
- "Upload reference data" for validation
- E.g., master account list
- **Operation:** "Validating against reference..."

---

### 5. TEMPLATES PAGE

**URL:** `/data/templates`

**Purpose:** Manage learned and custom templates

**Features:**

#### 5.1 Template Library
- Learned templates (automatic)
- Custom templates (user-created)
- System templates (pre-built)
- **Filter:** Source / Format / Entity

#### 5.2 Template Cards
Each shows:
- Template name
- Source file example
- Structure diagram
- Match count (how many files matched)
- Last used
- Actions: View / Edit / Test / Delete

#### 5.3 Template Editor
- Visual structure mapper
- Define:
  - Header rows
  - Entity columns
  - Account columns
  - Period columns
  - Hierarchy
- Test with sample file
- **Operation:** "Testing template on sample file..."

#### 5.4 Template Matching Stats
- Success rate
- Common issues
- Improvement suggestions

**File Upload:**
- "Upload sample file to create template"
- **Operation:**
  ```
  Analyzing file structure...
  Detecting patterns...
  Creating template...
  Template saved!
  ```

---

### 6. LIVE DASHBOARD PAGE

**URL:** `/analysis/dashboard`

**Purpose:** Real-time financial analysis with live updates

**Features:**

#### 6.1 Time Period Selector
- Month / Quarter / Year
- Date range picker
- "Compare to" option

#### 6.2 Entity Selector
- Multi-select dropdown
- "All entities" checkbox
- Recent selections

#### 6.3 KPI Grid (Customizable)
- Drag & drop to reorder
- Add/remove KPIs
- Each KPI shows:
  - Current value
  - Change % (animated)
  - Trend sparkline
  - Mini chart
- **Live indicator:** "🔴 LIVE"

#### 6.4 Financial Statement View
- Tabs: P&L / Balance Sheet / Cash Flow
- Hierarchical tree table
- Expand/collapse rows
- Inline formulas shown
- Click value → drill down
- **Operation:** "Recalculating... ✓"

#### 6.5 Chart Section
- Revenue waterfall
- Margin trends
- Entity comparison
- Custom chart builder
- Export chart
- **Operation:** "Rendering chart..."

#### 6.6 Variance Analysis Panel
- Actual vs Budget
- Actual vs Forecast
- Actual vs Prior Year
- Color-coded
- Sort by magnitude
- **Operation:** "Calculating variances..."

#### 6.7 AI Insights Panel (Right Sidebar)
- Auto-generated insights
- "Key findings:"
- Anomalies detected
- Recommendations
- Ask follow-up questions
- **Operation:**
  ```
  Analyzing trends...
  Detecting anomalies...
  Generating insights...
  Insight ready!
  ```

**File Upload:**
- Quick import button
- Overlay on current view
- **Operation:** "Importing data... Dashboard will update automatically"

**Live Update Indicators:**
```
"Data updated 3 seconds ago"
"Chart refreshing..."
"Calculations in progress..."
```

---

### 7. P&L ANALYSIS PAGE

**URL:** `/analysis/pl`

**Purpose:** Deep P&L analysis and commentary

**Features:**

#### 7.1 Filters Panel (Left Sidebar)
- Entity selector
- Period selector
- Comparison selector
- View options:
  - Show calculations
  - Show formulas
  - Show comments

#### 7.2 P&L Statement Table (Center)
- Full hierarchical P&L
- Columns:
  - Account
  - Current period
  - Budget
  - Variance $
  - Variance %
  - Prior year
  - YoY growth
- Formatting:
  - Bold for section totals
  - Indent for hierarchy
  - Color for pos/neg
- Click row → detailed analysis

#### 7.3 Commentary Panel (Right)
- AI-generated commentary for each line
- User can edit/add notes
- Save commentary
- **Operation:** "Generating commentary..."

#### 7.4 Drill-Down View (Modal)
- Opens when clicking account
- Monthly trend chart
- Transaction list
- Related accounts
- Historical analysis
- **Operation:** "Loading transaction details..."

#### 7.5 Export Options
- Excel (with formulas)
- PDF (formatted report)
- PowerPoint (charts)
- CSV (raw data)
- **Operation:**
  ```
  Building Excel file...
  Creating charts...
  Formatting cells...
  Download ready!
  ```

**File Upload:**
- "Import additional period" button
- Compare against uploaded budget
- **Operation:** "Integrating new data..."

---

### 8. BALANCE SHEET PAGE

**URL:** `/analysis/balance-sheet`

**Purpose:** Balance sheet analysis and reconciliation

**Similar structure to P&L with these additions:**

#### 8.1 Balance Sheet Specific Features
- Assets / Liabilities / Equity tabs
- Reconciliation tools
- Working capital analysis
- Liquidity ratios
- **Operation:** "Calculating ratios..."

#### 8.2 Reconciliation Panel
- Compare periods
- Identify movements
- Bridge analysis
- **Operation:** "Building reconciliation..."

**File Upload:**
- Import balance sheet data
- Import supporting schedules
- **Operation:** "Validating balances..."

---

### 9. CONSOLIDATION PAGE

**URL:** `/analysis/consolidation`

**Purpose:** Multi-entity consolidation with eliminations

**Features:**

#### 9.1 Entity Selection Grid
- Visual tree of entity relationships
- Parent-child connections
- Ownership percentages
- Select entities to consolidate

#### 9.2 Consolidation Rules Panel
- Elimination accounts
- Ownership adjustments
- Currency conversion
- Edit rules
- **Operation:** "Applying consolidation rules..."

#### 9.3 Consolidated View
- Consolidated financials
- Pre-elimination totals
- Eliminations column
- Post-elimination totals
- Reconciliation schedule

#### 9.4 Elimination Details
- List of intercompany transactions
- Auto-matched
- Manual matching interface
- Unmatched items highlighted
- **Operation:**
  ```
  Identifying intercompany transactions...
  Matching 247 transactions...
  45 matched automatically
  12 require review
  ```

**File Upload:**
- Import entity data
- Import elimination schedules
- **Operation:** "Processing entity data for consolidation..."

---

### 10. GENERATE REPORT PAGE

**URL:** `/reports/generate`

**Purpose:** Create custom reports

**Features:**

#### 10.1 Template Selector (Step 1)
- Predefined templates:
  - Financial Summary
  - Detailed Analysis
  - Board Presentation
  - Monthly Close Package
- Custom template builder

#### 10.2 Content Configuration (Step 2)
- Select sections:
  ☑ Executive Summary
  ☑ Key Metrics
  ☑ P&L Statement
  ☐ Balance Sheet
  ☑ Charts
  ☑ Commentary
- Drag to reorder

#### 10.3 Data Selection (Step 3)
- Entities
- Periods
- Comparison options
- Level of detail

#### 10.4 Formatting Options (Step 4)
- Company logo
- Color scheme
- Font style
- Page layout

#### 10.5 Preview Panel
- Live preview
- Page navigation
- Edit sections
- **Operation:** "Generating preview..."

#### 10.6 Export Options
- Format: PDF / Excel / PowerPoint / Word
- Email delivery
- Save template
- **Operation:**
  ```
  Building report...
  Creating charts... (3/5)
  Formatting pages... (8/12)
  Finalizing document...
  Report ready for download!
  ```

**File Upload:**
- Import logo
- Import cover page template
- **Operation:** "Processing branding assets..."

---

### 11. ASK AI (ASSISTANT) PAGE

**URL:** `/ai/assistant`

**Purpose:** Natural language Q&A

**Features:**

#### 11.1 Chat Interface (Center)
- Text input box
- Voice input button
- File attachment button
- Send button
- Chat history
- **Operation indicators:**
  ```
  🤔 Analyzing your question...
  📊 Retrieving financial data...
  🧮 Performing calculations...
  ✍️ Generating response...
  ```

#### 11.2 Suggested Questions (Right Sidebar)
- Context-aware suggestions
- Click to send
- Categories:
  - Quick facts
  - Analysis
  - Forecasting
  - Comparisons

#### 11.3 Response Format
- Text answer
- Data table (if applicable)
- Chart (if applicable)
- Confidence score
- Data sources cited
- Follow-up actions:
  - Export to Excel
  - Create report
  - Drill deeper
  - Ask related question

#### 11.4 Context Panel (Left Sidebar)
- Selected entities
- Selected periods
- Active filters
- Clear context button

#### 11.5 Conversation History
- Saved conversations
- Search past questions
- Resume conversation
- Export conversation

**File Upload in Chat:**
- "📎" button in chat
- Upload file and ask about it
- "Analyze this file"
- **Operation:**
  ```
  Uploading file...
  Processing structure...
  Ready! What would you like to know?
  ```

---

### 12. INSIGHTS PAGE

**URL:** `/ai/insights`

**Purpose:** Auto-generated insights and anomalies

**Features:**

#### 12.1 Insight Cards
Each card shows:
- Insight title
- Severity (Critical / Important / Info)
- Description
- Supporting data
- Recommended action
- Dismiss / Act buttons
- **Operation:** "Detecting insights..."

#### 12.2 Insight Types
- Anomalies detected
- Trends identified
- Threshold breaches
- Opportunities
- Risks

#### 12.3 Insight Detail View
- Detailed explanation
- Historical context
- Comparison data
- Root cause analysis
- Action plan
- **Operation:** "Analyzing root cause..."

#### 12.4 Insight Feedback
- Was this helpful? (Yes/No)
- Comment box
- Feeds into learning system

**No file upload** (insights generated from existing data)

---

### 13. WORKFLOW BUILDER PAGE

**URL:** `/workflows/builder`

**Purpose:** Create and manage automated workflows

**Features:**

#### 13.1 Visual Workflow Editor
- Drag & drop components
- Step types:
  - Data import
  - Validation
  - Calculation
  - Approval
  - Notification
  - Export
- Connect with arrows
- **Operation:** "Validating workflow..."

#### 13.2 Step Configuration Panel
- Step properties
- Input/output mapping
- Conditions
- Error handling
- **Operation:** "Testing step..."

#### 13.3 Trigger Configuration
- Manual
- Scheduled (cron)
- Event-based
- API webhook

#### 13.4 Workflow Templates
- Pre-built workflows:
  - Monthly close
  - Budget vs actual
  - Data import validation
- Clone and customize

#### 13.5 Test & Deploy
- Test with sample data
- Dry run
- Deploy to production
- **Operation:**
  ```
  Running test...
  Step 1: ✓
  Step 2: ✓
  Step 3: ⚠ Warning (review)
  ```

**File Upload:**
- Test data upload
- Sample file for testing
- **Operation:** "Processing test file..."

---

### 14. ACTIVE WORKFLOWS PAGE

**URL:** `/workflows/active`

**Purpose:** Monitor running workflows

**Features:**

#### 14.1 Workflow List
- Name
- Status (Running / Paused / Failed)
- Progress bar
- Current step
- Started by
- Started at
- Actions: Pause / Cancel / View

#### 14.2 Execution Details (Click row)
- Step-by-step log
- **Live updates:**
  ```
  [10:23:45] Step 1: Data retrieval - COMPLETE
  [10:23:47] Step 2: Validation - IN PROGRESS
     → Validating 1,247 records...
     → 1,100 records validated ✓
     → 147 remaining...
  ```
- Output preview
- Error messages
- Retry button

#### 14.3 Notifications
- Workflow completed
- Approval needed
- Error occurred
- Click → go to workflow

**No file upload** (workflows operate on existing data)

---

### 15. SETTINGS PAGE

**URL:** `/settings`

**Purpose:** Configure organization and preferences

**Features:**

#### 15.1 Organization Tab
- Company name
- Logo upload
- Fiscal year settings
- Currency
- Language
- **Operation:** "Saving settings..."

#### 15.2 Users & Permissions Tab
- User list
- Add user button
- Role assignment
- Permission matrix
- **Operation:** "Updating permissions..."

#### 15.3 Data Sources Tab
- Connected sources
- Add new source:
  - Manual upload
  - API integration
  - Database connection
  - Cloud storage
- Test connection
- **Operation:** "Testing connection..."

#### 15.4 Preferences Tab
- Default dashboard
- Notification settings
- Display preferences
- Report defaults
- **Operation:** "Applying preferences..."

**File Upload:**
- Logo upload
- Template upload
- Import user list
- **Operation:** "Processing image... Resizing... Saved!"

---

## OPERATION VISIBILITY SPECIFICATIONS

### Global Operation Indicators

**Top Navigation Bar:**
```
[Logo] [Page Title]     [🔴 System Status: Operational]     [🔔 3]  [👤 User]

When operations running:
[Logo] [Page Title]     [⏳ Processing... (2 tasks)]     [🔔 3]  [👤 User]
```

**Bottom Status Bar:**
```
✓ Last sync: 2 seconds ago  |  📊 Processing: Import data (45%)  |  💾 Saved
```

### Operation Detail Panel (Expandable)
Click "Processing..." to see:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ ACTIVE OPERATIONS

1. Import: SOCAR_Budget_2026.xlsx
   ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 45%
   Current step: Mapping accounts...
   Estimated time: 23 seconds
   
2. Calculate: Consolidation
   ▓▓░░░░░░░░░░░░░░░░░░ 12%
   Current step: Summing entities...
   Estimated time: 1 minute
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### File Upload Progress
```
┌────────────────────────────────────────┐
│ Uploading: Budget_2026.xlsx           │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%            │
│                                        │
│ ✓ File uploaded                        │
│ ⏳ Parsing structure... 3/54 sheets   │
│ ⏳ Detecting entities... 12/16 found   │
│ ⏳ Mapping accounts... 67/87 mapped    │
│                                        │
│ [Cancel] [Background]                  │
└────────────────────────────────────────┘
```

---

## SUMMARY

**Total Pages:** 15 major pages
**Total Features:** 100+ distinct features
**File Upload Points:** Every page has file upload capability
**Operation Visibility:** All operations shown in real-time with:
- Progress bars
- Step-by-step descriptions
- Estimated time
- Ability to background tasks
- Detailed logs

Every operation is transparent, every upload is guided, every calculation is explained.

**Production-ready UI specification complete!**
