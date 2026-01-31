# Financial AI Platform - Comprehensive System Architecture
## Enterprise-Grade Intelligent Financial Management System

**Version:** 2.0  
**Date:** January 28, 2026  
**Technology Stack:** GCP/Firebase, React, Python, FastAPI, TensorFlow  

---

## EXECUTIVE SUMMARY

This document outlines a **production-ready, enterprise-grade Financial AI Platform** capable of:

1. **Universal Data Processing** - Handle any financial file format (XLSX, XLSB, CSV, PDF, images) with multi-language support (English, Georgian, Russian, etc.)
2. **Deterministic Intelligence Engine** - Rule-based financial calculation engine with 100% accuracy
3. **Generative AI Integration** - LLM-powered insights, explanations, and Q&A with feedback-based learning
4. **Adaptive Knowledge Base** - User-teachable system that learns from corrections and feedback
5. **Real-time Workflows** - Automated financial processes with full audit trails
6. **Enterprise UI/UX** - Professional interface with operation transparency and explainability
7. **Cloud-Native Architecture** - Built on GCP/Firebase for scalability, security, and reliability

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Data Architecture](#2-data-architecture)
3. [Deterministic Calculation Engine](#3-deterministic-calculation-engine)
4. [Data Transformation & Processing](#4-data-transformation--processing)
5. [Workflow Engine](#5-workflow-engine)
6. [Generative AI Integration](#6-generative-ai-integration)
7. [Knowledge & Learning System](#7-knowledge--learning-system)
8. [Backend Architecture](#8-backend-architecture)
9. [Frontend Architecture](#9-frontend-architecture)
10. [GCP/Firebase Infrastructure](#10-gcpfirebase-infrastructure)
11. [Security & Compliance](#11-security--compliance)
12. [Deployment & Operations](#12-deployment--operations)

---

## 1. SYSTEM OVERVIEW

### 1.1 Architecture Paradigm

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  (React + Material-UI + Real-time Updates via Firestore)        │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                             │
│    (Firebase Cloud Functions + FastAPI on Cloud Run)            │
└────────────────┬────────────────────────────────────────────────┘
                 │
      ┌──────────┴──────────┬──────────────┬───────────────┐
      │                     │              │               │
┌─────▼──────┐   ┌─────────▼────┐   ┌─────▼──────┐   ┌──▼──────┐
│ Data Input │   │ Deterministic│   │ Generative │   │Workflow │
│   Engine   │   │    Engine    │   │ AI Engine  │   │ Engine  │
└─────┬──────┘   └─────────┬────┘   └─────┬──────┘   └──┬──────┘
      │                    │              │               │
      └────────────────────┴──────────────┴───────────────┘
                           │
             ┌─────────────▼──────────────┐
             │    DATA PERSISTENCE         │
             │  Firestore + Cloud SQL +    │
             │  Cloud Storage + BigQuery   │
             └─────────────────────────────┘
```

### 1.2 Core Components

**A. Data Processing Layer**
- Universal file parser (Excel, CSV, PDF, images)
- Multi-language OCR and NLP
- Schema detection and mapping
- Data validation and cleaning

**B. Deterministic Engine**
- Financial calculation rules engine
- Hierarchical aggregation logic
- Multi-entity consolidation
- Formula evaluation engine

**C. Generative AI Layer**
- OpenAI/Anthropic API integration
- Context-aware financial Q&A
- Insight generation
- Natural language explanations

**D. Knowledge Base**
- User-trainable rules repository
- Correction tracking system
- Pattern learning database
- Template library

**E. Workflow Orchestration**
- Automated process execution
- Event-driven triggers
- Human-in-the-loop approvals
- Audit trail generation

---

## 2. DATA ARCHITECTURE

### 2.1 Universal Data Model

All financial data, regardless of source format, is transformed into a unified canonical model:

```python
# Core Financial Record Schema
{
  "record_id": "UUID",
  "organization_id": "org_12345",
  "dataset_id": "ds_67890",
  
  # Dimensional Attributes
  "entity": {
    "entity_id": "ent_001",
    "entity_code": "SGG",
    "entity_name": "SOCAR Energy Georgia",
    "entity_type": "legal_entity",
    "parent_entity_id": "ent_parent_001",
    "consolidation_group": "sgg_total",
    "region": "Imereti",
    "country": "GE"
  },
  
  "account": {
    "account_id": "acc_1.1",
    "account_code": "1.1.",
    "account_name": "Social Gas Sales",
    "account_name_translations": {
      "ka": "სოციალური გაზის გაყიდვები",
      "ru": "Продажи социального газа"
    },
    "account_type": "revenue",
    "parent_account_id": "acc_1",
    "hierarchy_level": 2,
    "is_calculated": false,
    "calculation_formula": null,
    "statement_type": "income_statement",
    "category": "operating_revenue"
  },
  
  "period": {
    "period_id": "per_2026_01",
    "period_type": "monthly",
    "year": 2026,
    "month": 1,
    "quarter": 1,
    "fiscal_year": 2026,
    "start_date": "2026-01-01",
    "end_date": "2026-01-31",
    "is_actuals": true,
    "data_type": "actual"  # actual, budget, forecast
  },
  
  # Financial Metrics
  "metrics": {
    "amount": 11799897.047188,
    "currency": "GEL",
    "units": "thousands",  # optional scaling factor
    "quantity": 62776231.311909,  # if applicable
    "quantity_unit": "M3",  # if applicable
    "unit_price": 0.188  # calculated if quantity exists
  },
  
  # Metadata
  "metadata": {
    "source_file": "SOCAR_Budgeting_Template_General_2026_v13.xlsx",
    "source_sheet": "Detailed Budget",
    "source_cell_range": "D7",
    "upload_timestamp": "2026-01-28T10:30:00Z",
    "uploaded_by": "user_789",
    "data_quality_score": 0.98,
    "validation_status": "approved",
    "version": 1,
    "tags": ["budget_2026", "regional", "gas_retail"]
  },
  
  # Derived Fields (calculated by system)
  "derived": {
    "ytd_amount": 11799897.047188,
    "yoy_growth_pct": 15.3,
    "variance_to_budget_pct": -2.1,
    "variance_to_forecast_pct": 1.5,
    "rank_within_entity": 1,
    "contribution_to_total_pct": 35.2
  },
  
  # AI-Generated Insights
  "insights": {
    "anomaly_score": 0.03,  # 0-1, higher = more unusual
    "anomaly_explanation": null,
    "trend_direction": "increasing",
    "seasonality_factor": 1.25,
    "forecast_confidence": 0.87
  }
}
```

### 2.2 Database Schema Design

#### 2.2.1 Firestore Collections Structure

```
organizations/
  ├─ {org_id}/
      ├─ metadata: {name, settings, created_at}
      ├─ entities/
      │   └─ {entity_id}: {entity_code, name, type, parent_id...}
      ├─ accounts/
      │   └─ {account_id}: {code, name, translations, hierarchy...}
      ├─ periods/
      │   └─ {period_id}: {year, month, type...}
      ├─ datasets/
      │   └─ {dataset_id}/
      │       ├─ metadata: {filename, upload_time, status...}
      │       ├─ records/
      │       │   └─ {record_id}: {full financial record}
      │       └─ validation_results/
      │           └─ {validation_id}: {errors, warnings...}
      ├─ workflows/
      │   └─ {workflow_id}/
      │       ├─ definition: {steps, triggers...}
      │       └─ executions/
      │           └─ {execution_id}: {status, logs...}
      ├─ knowledge_base/
      │   ├─ rules/
      │   │   └─ {rule_id}: {condition, action, learned_from...}
      │   ├─ templates/
      │   │   └─ {template_id}: {structure, mapping...}
      │   └─ corrections/
      │       └─ {correction_id}: {original, corrected, feedback...}
      └─ ai_context/
          └─ conversations/
              └─ {conv_id}: {messages, embeddings, context...}
```

#### 2.2.2 Cloud SQL (PostgreSQL) Schema

```sql
-- Core dimensional tables
CREATE TABLE organizations (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name VARCHAR(200) NOT NULL,
    settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE entities (
    entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id),
    entity_code VARCHAR(50) UNIQUE NOT NULL,
    entity_name VARCHAR(200) NOT NULL,
    entity_type VARCHAR(50),
    parent_entity_id UUID REFERENCES entities(entity_id),
    consolidation_group VARCHAR(100),
    region VARCHAR(100),
    country CHAR(2),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(500) NOT NULL,
    account_name_translations JSONB,  -- {"ka": "...", "ru": "..."}
    account_type VARCHAR(50),
    parent_account_id UUID REFERENCES accounts(account_id),
    hierarchy_level INTEGER,
    is_calculated BOOLEAN DEFAULT FALSE,
    calculation_formula TEXT,
    statement_type VARCHAR(50),
    category VARCHAR(100),
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE periods (
    period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id),
    period_type VARCHAR(20) NOT NULL,  -- monthly, quarterly, annual
    year INTEGER NOT NULL,
    month INTEGER,
    quarter INTEGER,
    fiscal_year INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_actuals BOOLEAN DEFAULT TRUE,
    data_type VARCHAR(20) DEFAULT 'actual',  -- actual, budget, forecast
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, period_type, year, month, data_type)
);

-- Fact table for financial data
CREATE TABLE financial_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id),
    entity_id UUID REFERENCES entities(entity_id),
    account_id UUID REFERENCES accounts(account_id),
    period_id UUID REFERENCES periods(period_id),
    
    -- Financial metrics
    amount DECIMAL(20, 2) NOT NULL,
    currency CHAR(3) DEFAULT 'GEL',
    units VARCHAR(20),
    quantity DECIMAL(20, 6),
    quantity_unit VARCHAR(20),
    unit_price DECIMAL(20, 6),
    
    -- Metadata
    source_file VARCHAR(500),
    source_sheet VARCHAR(200),
    source_cell_range VARCHAR(50),
    upload_timestamp TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID,
    data_quality_score DECIMAL(3, 2),
    validation_status VARCHAR(20) DEFAULT 'pending',
    version INTEGER DEFAULT 1,
    
    -- Derived metrics (calculated by system)
    ytd_amount DECIMAL(20, 2),
    yoy_growth_pct DECIMAL(7, 4),
    variance_to_budget_pct DECIMAL(7, 4),
    variance_to_forecast_pct DECIMAL(7, 4),
    
    -- AI insights
    anomaly_score DECIMAL(3, 2),
    anomaly_explanation TEXT,
    trend_direction VARCHAR(20),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_financial_records_lookup 
    ON financial_records(org_id, entity_id, account_id, period_id);
CREATE INDEX idx_financial_records_period 
    ON financial_records(period_id, entity_id);
CREATE INDEX idx_financial_records_entity 
    ON financial_records(entity_id, account_id);
CREATE INDEX idx_financial_records_amount 
    ON financial_records(amount) WHERE amount IS NOT NULL;

-- Consolidation rules
CREATE TABLE consolidation_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id),
    parent_entity_id UUID REFERENCES entities(entity_id),
    child_entity_id UUID REFERENCES entities(entity_id),
    ownership_percentage DECIMAL(5, 2) DEFAULT 100.00,
    elimination_account_id UUID REFERENCES accounts(account_id),
    effective_from DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base - User-taught rules
CREATE TABLE learned_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id),
    rule_type VARCHAR(50) NOT NULL,  -- mapping, calculation, validation, transformation
    rule_name VARCHAR(200),
    rule_description TEXT,
    
    -- Rule definition
    condition_json JSONB NOT NULL,  -- conditions that trigger this rule
    action_json JSONB NOT NULL,     -- actions to take when triggered
    priority INTEGER DEFAULT 100,
    
    -- Learning metadata
    learned_from_correction_id UUID,
    learned_date TIMESTAMPTZ DEFAULT NOW(),
    times_applied INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 4),
    
    -- User feedback
    user_approved BOOLEAN,
    approval_date TIMESTAMPTZ,
    approved_by UUID,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User corrections (for learning)
CREATE TABLE user_corrections (
    correction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id),
    record_id UUID REFERENCES financial_records(record_id),
    
    correction_type VARCHAR(50),  -- value, mapping, classification
    original_value JSONB,
    corrected_value JSONB,
    
    correction_reason TEXT,
    applied_by UUID,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Pattern extraction
    pattern_identified BOOLEAN DEFAULT FALSE,
    learned_rule_id UUID REFERENCES learned_rules(rule_id),
    
    metadata JSONB
);

-- Workflow definitions
CREATE TABLE workflow_definitions (
    workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id),
    workflow_name VARCHAR(200) NOT NULL,
    workflow_description TEXT,
    workflow_type VARCHAR(50),  -- data_import, consolidation, reporting, alert
    
    trigger_type VARCHAR(50),  -- manual, scheduled, event_based
    trigger_config JSONB,
    
    steps_json JSONB NOT NULL,  -- array of workflow steps
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow execution logs
CREATE TABLE workflow_executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflow_definitions(workflow_id),
    
    execution_status VARCHAR(20) DEFAULT 'running',  -- running, completed, failed, cancelled
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    input_params JSONB,
    execution_steps_log JSONB,  -- detailed step-by-step log
    output_results JSONB,
    error_message TEXT,
    
    executed_by UUID
);

-- AI Conversation history
CREATE TABLE ai_conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id),
    user_id UUID NOT NULL,
    
    conversation_title VARCHAR(200),
    conversation_context JSONB,  -- relevant entities, accounts, periods
    
    messages JSONB NOT NULL,  -- array of {role, content, timestamp}
    
    -- For retrieval-augmented generation
    relevant_records UUID[],  -- array of record_ids used in this conversation
    embedding_vector vector(1536),  -- for semantic search
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data quality tracking
CREATE TABLE data_quality_checks (
    check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id),
    dataset_id UUID,
    
    check_type VARCHAR(50),  -- completeness, accuracy, consistency, timeliness
    check_name VARCHAR(200),
    check_description TEXT,
    
    records_checked INTEGER,
    records_passed INTEGER,
    records_failed INTEGER,
    
    issues_json JSONB,  -- detailed issues found
    
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    executed_by VARCHAR(50)  -- system or user_id
);
```

#### 2.2.3 BigQuery Schema (for Analytics)

```sql
-- BigQuery table for large-scale analytics
CREATE TABLE `project-id.financial_analytics.financial_facts` (
    record_id STRING NOT NULL,
    org_id STRING NOT NULL,
    entity_code STRING,
    entity_name STRING,
    account_code STRING,
    account_name STRING,
    period_date DATE,
    year INT64,
    month INT64,
    quarter INT64,
    period_type STRING,
    data_type STRING,
    
    amount FLOAT64,
    currency STRING,
    quantity FLOAT64,
    quantity_unit STRING,
    
    ytd_amount FLOAT64,
    yoy_growth_pct FLOAT64,
    
    source_file STRING,
    upload_timestamp TIMESTAMP,
    
    -- Partitioned by period_date for query performance
    _partitioned_by DATE
)
PARTITION BY period_date
CLUSTER BY org_id, entity_code, account_code;
```

### 2.3 Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  INPUT LAYER - Multiple File Formats & Languages               │
├────────────────────────────────────────────────────────────────┤
│  • XLSX/XLSB (Excel Binary)                                    │
│  • CSV/TSV                                                     │
│  • PDF (with tables)                                           │
│  • Images (OCR)                                                │
│  • JSON/XML                                                    │
│  • Multi-language: EN, GE (Georgian), RU, etc.                │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│  PARSING & EXTRACTION LAYER                                    │
├────────────────────────────────────────────────────────────────┤
│  • Format Detection Engine                                     │
│  • Structure Analysis (headers, dimensions, hierarchy)         │
│  • Multi-language OCR (Google Cloud Vision API)               │
│  • NLP for text extraction (Georgian, Russian, English)       │
│  • Table structure detection                                   │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│  SCHEMA DETECTION & MAPPING LAYER                              │
├────────────────────────────────────────────────────────────────┤
│  • Automatic schema inference                                  │
│  • Entity identification (regions, companies)                  │
│  • Account/Category mapping (revenue, COGS, etc.)             │
│  • Period detection (monthly, quarterly, annual)              │
│  • Currency & unit detection                                   │
│  • Template matching with knowledge base                       │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│  DATA TRANSFORMATION LAYER                                     │
├────────────────────────────────────────────────────────────────┤
│  • Language translation (Georgian → English if needed)         │
│  • Currency conversion                                         │
│  • Unit normalization (thousands, millions)                    │
│  • Hierarchy construction                                      │
│  • Data type conversion & validation                           │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│  VALIDATION & QUALITY LAYER                                    │
├────────────────────────────────────────────────────────────────┤
│  • Business rule validation                                    │
│  • Mathematical validation (parent = sum of children)          │
│  • Completeness checks                                         │
│  • Anomaly detection                                           │
│  • Data quality scoring                                        │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│  CANONICAL DATA MODEL - Unified Structure                      │
├────────────────────────────────────────────────────────────────┤
│  Organization → Entity → Account → Period → Metrics            │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│  PERSISTENCE LAYER                                             │
├────────────────────────────────────────────────────────────────┤
│  • Firestore (real-time operational data)                     │
│  • Cloud SQL (relational queries)                              │
│  • BigQuery (analytics & reporting)                            │
│  • Cloud Storage (raw files, backups)                          │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. DETERMINISTIC CALCULATION ENGINE

The Deterministic Engine is the **core financial intelligence** of the system, responsible for all financial calculations with 100% accuracy and auditability.

### 3.1 Engine Architecture

```python
class FinancialCalculationEngine:
    """
    Deterministic financial calculation engine with rule-based logic
    """
    
    def __init__(self, org_id: str):
        self.org_id = org_id
        self.calculation_graph = CalculationGraph()
        self.rule_engine = BusinessRuleEngine()
        self.formula_evaluator = FormulaEvaluator()
        
    def calculate_all(self, dataset_id: str) -> CalculationResult:
        """
        Execute all calculations for a dataset
        """
        # 1. Load data
        records = self.load_records(dataset_id)
        
        # 2. Build dependency graph
        graph = self.build_calculation_graph(records)
        
        # 3. Topological sort for calculation order
        calc_order = graph.topological_sort()
        
        # 4. Execute calculations in order
        for node in calc_order:
            if node.is_calculated:
                result = self.calculate_node(node, records)
                records.update(node.account_id, result)
        
        # 5. Validate results
        validation_result = self.validate_calculations(records)
        
        return CalculationResult(
            records=records,
            validation=validation_result,
            audit_trail=self.get_audit_trail()
        )
```

### 3.2 Calculation Types

#### 3.2.1 Hierarchical Aggregation

```python
def calculate_hierarchical_sum(
    parent_account: Account,
    child_accounts: List[Account],
    records: Dict[str, FinancialRecord]
) -> Decimal:
    """
    Calculate parent account value as sum of children
    
    Example: Total Revenue = Social Gas Sales + Commercial Gas Sales + Distribution Service
    """
    total = Decimal('0')
    
    for child in child_accounts:
        child_value = records.get(child.account_id).amount
        
        # Apply sign convention (debit/credit)
        if child.account_type == 'credit':
            total += child_value
        else:
            total -= child_value
    
    # Validation: Check tolerance
    expected = records.get(parent_account.account_id).amount
    tolerance = Decimal('0.01')
    
    if abs(total - expected) > tolerance:
        raise ValidationError(
            f"Hierarchical sum mismatch: {parent_account.account_name}. "
            f"Calculated: {total}, Expected: {expected}"
        )
    
    return total
```

#### 3.2.2 Multi-Entity Consolidation

```python
def consolidate_entities(
    parent_entity: Entity,
    child_entities: List[Entity],
    consolidation_rules: List[ConsolidationRule],
    period: Period
) -> Dict[str, Decimal]:
    """
    Consolidate financial statements across multiple entities
    """
    consolidated = {}
    
    # 1. Sum all child entity values
    for account_code in get_all_accounts():
        total = Decimal('0')
        
        for child_entity in child_entities:
            # Get ownership percentage
            rule = get_consolidation_rule(parent_entity, child_entity)
            ownership_pct = rule.ownership_percentage / 100
            
            # Get child entity value
            child_value = get_record_value(
                child_entity.entity_id,
                account_code,
                period.period_id
            )
            
            # Apply ownership percentage
            total += child_value * ownership_pct
        
        consolidated[account_code] = total
    
    # 2. Apply intercompany eliminations
    for rule in consolidation_rules:
        if rule.elimination_account_id:
            # Find and eliminate intercompany transactions
            ic_transactions = find_intercompany_transactions(
                child_entities,
                rule.elimination_account_id,
                period
            )
            
            for transaction in ic_transactions:
                consolidated[rule.elimination_account_id] -= transaction.amount
    
    # 3. Calculate minority interest (if ownership < 100%)
    minority_interest = calculate_minority_interest(
        child_entities,
        consolidation_rules,
        period
    )
    
    consolidated['minority_interest'] = minority_interest
    
    return consolidated
```

#### 3.2.3 Formula Evaluation

```python
class FormulaEvaluator:
    """
    Safe evaluation of financial formulas with audit trail
    """
    
    def evaluate(
        self,
        formula: str,
        context: Dict[str, Any],
        audit_trail: AuditTrail
    ) -> Decimal:
        """
        Evaluate formula with full audit trail
        
        Examples:
        - "EBITDA = Gross_Margin + Other_Revenue - GNA_Expenses"
        - "Net_Margin_Pct = Net_Income / Revenue * 100"
        - "Working_Capital = Current_Assets - Current_Liabilities"
        """
        # Parse formula
        ast = self.parse_formula(formula)
        
        # Validate all variables exist
        variables = ast.get_variables()
        for var in variables:
            if var not in context:
                raise FormulaError(f"Variable {var} not found in context")
        
        # Evaluate with audit
        result = self.evaluate_ast(ast, context, audit_trail)
        
        # Record calculation in audit trail
        audit_trail.record_calculation(
            formula=formula,
            inputs=context,
            output=result,
            timestamp=datetime.now()
        )
        
        return result
    
    def evaluate_ast(
        self,
        node: ASTNode,
        context: Dict[str, Any],
        audit_trail: AuditTrail
    ) -> Decimal:
        """
        Recursively evaluate abstract syntax tree
        """
        if node.type == 'NUMBER':
            return Decimal(node.value)
        
        elif node.type == 'VARIABLE':
            value = context[node.name]
            audit_trail.record_variable_access(node.name, value)
            return Decimal(value)
        
        elif node.type == 'BINARY_OP':
            left = self.evaluate_ast(node.left, context, audit_trail)
            right = self.evaluate_ast(node.right, context, audit_trail)
            
            if node.operator == '+':
                return left + right
            elif node.operator == '-':
                return left - right
            elif node.operator == '*':
                return left * right
            elif node.operator == '/':
                if right == 0:
                    raise FormulaError("Division by zero")
                return left / right
        
        elif node.type == 'FUNCTION':
            return self.evaluate_function(node, context, audit_trail)
```

#### 3.2.4 Cross-Period Calculations

```python
def calculate_yoy_growth(
    account_id: str,
    entity_id: str,
    current_period: Period,
    prior_period: Period
) -> Decimal:
    """
    Calculate year-over-year growth percentage
    """
    current_value = get_record_value(entity_id, account_id, current_period.period_id)
    prior_value = get_record_value(entity_id, account_id, prior_period.period_id)
    
    if prior_value == 0:
        if current_value == 0:
            return Decimal('0')
        else:
            return Decimal('999.99')  # Cap at 999.99% for infinity
    
    growth = ((current_value - prior_value) / prior_value) * 100
    
    return round(growth, 2)

def calculate_ytd(
    account_id: str,
    entity_id: str,
    end_period: Period
) -> Decimal:
    """
    Calculate year-to-date total
    """
    year_start_period = get_year_start_period(end_period.year)
    
    periods = get_periods_between(year_start_period, end_period)
    
    ytd_total = Decimal('0')
    for period in periods:
        value = get_record_value(entity_id, account_id, period.period_id)
        ytd_total += value
    
    return ytd_total
```

### 3.3 Validation Framework

```python
class ValidationFramework:
    """
    Multi-layer validation ensuring data integrity
    """
    
    def validate_dataset(self, dataset_id: str) -> ValidationReport:
        """
        Comprehensive dataset validation
        """
        report = ValidationReport()
        
        # Level 1: Schema Validation
        report.add_section(self.validate_schema(dataset_id))
        
        # Level 2: Business Rule Validation
        report.add_section(self.validate_business_rules(dataset_id))
        
        # Level 3: Mathematical Validation
        report.add_section(self.validate_mathematics(dataset_id))
        
        # Level 4: Cross-Reference Validation
        report.add_section(self.validate_cross_references(dataset_id))
        
        # Level 5: Statistical Anomaly Detection
        report.add_section(self.detect_anomalies(dataset_id))
        
        return report
    
    def validate_business_rules(self, dataset_id: str) -> ValidationSection:
        """
        Validate against business rules
        """
        section = ValidationSection("Business Rules")
        records = load_records(dataset_id)
        
        # Rule 1: Revenue accounts must be positive
        for record in records:
            if record.account.account_type == 'revenue' and record.amount < 0:
                section.add_error(
                    f"Negative revenue detected: {record.account.account_name} "
                    f"= {record.amount} for {record.entity.entity_name} "
                    f"in {record.period.period_id}"
                )
        
        # Rule 2: Parent = Sum of Children
        for account in get_accounts_with_children():
            parent_value = get_account_value(account.account_id, dataset_id)
            children_sum = sum(
                get_account_value(child.account_id, dataset_id)
                for child in account.children
            )
            
            tolerance = Decimal('0.01')
            if abs(parent_value - children_sum) > tolerance:
                section.add_error(
                    f"Hierarchical sum mismatch: {account.account_name}. "
                    f"Parent value: {parent_value}, Children sum: {children_sum}"
                )
        
        # Rule 3: EBITDA = Gross Margin + Other Revenue - G&A
        ebitda = get_calculated_metric('EBITDA', dataset_id)
        gross_margin = get_calculated_metric('Gross_Margin', dataset_id)
        other_revenue = get_calculated_metric('Other_Revenue', dataset_id)
        gna = get_calculated_metric('GNA_Expenses', dataset_id)
        
        expected_ebitda = gross_margin + other_revenue - gna
        
        if abs(ebitda - expected_ebitda) > tolerance:
            section.add_error(
                f"EBITDA calculation mismatch. "
                f"Reported: {ebitda}, Calculated: {expected_ebitda}"
            )
        
        return section
```

---

## 4. DATA TRANSFORMATION & PROCESSING

### 4.1 Universal File Parser

```python
class UniversalFileParser:
    """
    Parse any financial file format into canonical data model
    """
    
    def __init__(self):
        self.parsers = {
            'xlsx': ExcelParser(),
            'xlsb': ExcelBinaryParser(),
            'csv': CSVParser(),
            'pdf': PDFParser(),
            'image': ImageOCRParser(),
            'json': JSONParser()
        }
        self.language_detector = LanguageDetector()
        self.translator = MultiLanguageTranslator()
    
    async def parse_file(
        self,
        file_path: str,
        org_id: str,
        user_id: str
    ) -> ParsedDataset:
        """
        Main entry point for file parsing
        """
        # 1. Detect file format
        file_format = self.detect_format(file_path)
        
        # 2. Select appropriate parser
        parser = self.parsers.get(file_format)
        if not parser:
            raise UnsupportedFormatError(f"Format {file_format} not supported")
        
        # 3. Extract raw data
        raw_data = await parser.extract(file_path)
        
        # 4. Detect language
        primary_language = self.language_detector.detect(raw_data)
        
        # 5. Translate if needed
        if primary_language not in ['en', 'EN']:
            raw_data = await self.translator.translate(
                raw_data,
                source_lang=primary_language,
                target_lang='en'
            )
        
        # 6. Detect schema
        schema = await self.detect_schema(raw_data, org_id)
        
        # 7. Transform to canonical model
        canonical_data = await self.transform_to_canonical(
            raw_data,
            schema,
            org_id
        )
        
        # 8. Validate
        validation_result = self.validate(canonical_data)
        
        # 9. Store
        dataset_id = await self.store_dataset(
            canonical_data,
            validation_result,
            org_id,
            user_id,
            file_path
        )
        
        return ParsedDataset(
            dataset_id=dataset_id,
            records_count=len(canonical_data),
            validation=validation_result,
            schema=schema
        )
```

### 4.2 Excel Parsing (XLSX/XLSB)

```python
class ExcelParser:
    """
    Parse Excel files with complex structures
    """
    
    async def extract(self, file_path: str) -> RawData:
        """
        Extract data from Excel preserving structure
        """
        # Use openpyxl for .xlsx
        workbook = openpyxl.load_workbook(file_path, data_only=False)
        
        raw_data = RawData()
        
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
            
            # Extract structure
            structure = self.analyze_sheet_structure(sheet)
            
            # Extract data based on detected structure
            if structure.type == 'dimensional':
                sheet_data = self.extract_dimensional_data(sheet, structure)
            elif structure.type == 'hierarchical':
                sheet_data = self.extract_hierarchical_data(sheet, structure)
            elif structure.type == 'pivoted':
                sheet_data = self.extract_pivoted_data(sheet, structure)
            else:
                sheet_data = self.extract_tabular_data(sheet)
            
            raw_data.add_sheet(sheet_name, sheet_data, structure)
        
        return raw_data
    
    def analyze_sheet_structure(self, sheet) -> SheetStructure:
        """
        Analyze Excel sheet to detect structure
        """
        structure = SheetStructure()
        
        # Find header rows
        header_rows = self.find_header_rows(sheet)
        structure.header_rows = header_rows
        
        # Detect if hierarchical (like Detailed Budget sheet)
        if self.is_hierarchical_structure(sheet, header_rows):
            structure.type = 'hierarchical'
            structure.hierarchy_column = self.find_hierarchy_column(sheet)
            structure.account_name_column = self.find_account_name_column(sheet)
        
        # Detect if dimensional (entities × periods × accounts)
        elif self.is_dimensional_structure(sheet, header_rows):
            structure.type = 'dimensional'
            structure.entity_row = self.find_entity_row(sheet, header_rows)
            structure.period_row = self.find_period_row(sheet, header_rows)
            structure.account_column = self.find_account_column(sheet, header_rows)
        
        # Detect if pivoted table
        elif self.is_pivoted_structure(sheet):
            structure.type = 'pivoted'
        
        else:
            structure.type = 'tabular'
        
        return structure
    
    def extract_dimensional_data(
        self,
        sheet,
        structure: SheetStructure
    ) -> SheetData:
        """
        Extract data from dimensional structure
        
        Example:
                    Imereti         Kakheti         Kartli    ...
                    Jan  Feb  Mar  Jan  Feb  Mar  Jan  Feb  Mar
        Revenue     100  110  120  200  220  240  300  330  360
        COGS         60   66   72  120  132  144  180  198  216
        ...
        """
        data = SheetData()
        
        # Get entities from entity_row
        entities = self.extract_entities(sheet, structure.entity_row)
        
        # Get periods from period_row
        periods = self.extract_periods(sheet, structure.period_row)
        
        # Get accounts from account_column
        accounts = self.extract_accounts(sheet, structure.account_column)
        
        # Build entity-period mapping
        col_mapping = self.build_column_mapping(entities, periods, sheet)
        
        # Extract values
        for account_row_idx, account in enumerate(accounts):
            for (entity, period), col_idx in col_mapping.items():
                value = sheet.cell(
                    row=structure.data_start_row + account_row_idx,
                    column=col_idx
                ).value
                
                if value is not None and value != '':
                    data.add_record(
                        entity=entity,
                        account=account,
                        period=period,
                        value=value
                    )
        
        return data
```

### 4.3 Multi-Language Support

```python
class MultiLanguageProcessor:
    """
    Handle multi-language financial data (Georgian, Russian, English)
    """
    
    def __init__(self):
        self.translator = GoogleTranslateAPI()
        self.language_models = {
            'ka': GeorgianLanguageModel(),
            'ru': RussianLanguageModel(),
            'en': EnglishLanguageModel()
        }
    
    async def process_text(
        self,
        text: str,
        source_lang: str = 'auto'
    ) -> ProcessedText:
        """
        Process text in any language
        """
        # Detect language if not provided
        if source_lang == 'auto':
            source_lang = self.detect_language(text)
        
        # Get language-specific model
        lang_model = self.language_models.get(source_lang)
        
        # Extract financial entities (account names, categories)
        entities = await lang_model.extract_financial_entities(text)
        
        # Translate to English if needed
        english_text = text
        if source_lang != 'en':
            english_text = await self.translator.translate(
                text,
                source=source_lang,
                target='en'
            )
        
        # Map to canonical account names
        mapped_account = self.map_to_canonical_account(
            english_text,
            original_text=text,
            language=source_lang
        )
        
        return ProcessedText(
            original=text,
            language=source_lang,
            english_translation=english_text,
            extracted_entities=entities,
            mapped_account=mapped_account
        )
    
    def detect_language(self, text: str) -> str:
        """
        Detect language from text
        """
        # Check for Georgian characters (Unicode range)
        georgian_chars = sum(1 for c in text if '\u10A0' <= c <= '\u10FF')
        if georgian_chars > len(text) * 0.3:
            return 'ka'
        
        # Check for Cyrillic (Russian) characters
        cyrillic_chars = sum(1 for c in text if '\u0400' <= c <= '\u04FF')
        if cyrillic_chars > len(text) * 0.3:
            return 'ru'
        
        # Default to English
        return 'en'
    
    def map_to_canonical_account(
        self,
        english_text: str,
        original_text: str,
        language: str
    ) -> Optional[Account]:
        """
        Map account name to canonical account in system
        """
        # Use fuzzy matching and NLP
        canonical_accounts = get_all_canonical_accounts()
        
        best_match = None
        best_score = 0
        
        for account in canonical_accounts:
            # Check English name
            score_en = self.calculate_similarity(english_text, account.account_name)
            
            # Check translation if available
            score_orig = 0
            if language in account.account_name_translations:
                translated = account.account_name_translations[language]
                score_orig = self.calculate_similarity(original_text, translated)
            
            score = max(score_en, score_orig)
            
            if score > best_score and score > 0.8:  # 80% confidence threshold
                best_match = account
                best_score = score
        
        return best_match
```

### 4.4 OCR for Images and PDFs

```python
class ImageOCRParser:
    """
    Extract financial data from images using OCR
    """
    
    def __init__(self):
        self.vision_client = vision.ImageAnnotatorClient()
    
    async def extract(self, file_path: str) -> RawData:
        """
        Extract text from image using Google Cloud Vision API
        """
        # Load image
        with open(file_path, 'rb') as image_file:
            content = image_file.read()
        
        image = vision.Image(content=content)
        
        # Detect text
        response = self.vision_client.document_text_detection(image=image)
        
        if response.error.message:
            raise OCRError(response.error.message)
        
        # Extract text
        full_text = response.full_text_annotation.text
        
        # Detect language
        lang_detector = LanguageDetector()
        language = lang_detector.detect(full_text)
        
        # Extract structured data
        tables = self.extract_tables_from_text(full_text, language)
        
        # Convert to RawData
        raw_data = RawData()
        for table_idx, table in enumerate(tables):
            raw_data.add_sheet(f"Table_{table_idx+1}", table, None)
        
        return raw_data
    
    def extract_tables_from_text(
        self,
        text: str,
        language: str
    ) -> List[TableData]:
        """
        Parse text to extract table structures
        """
        # Use regex patterns to identify table structures
        lines = text.split('\n')
        
        tables = []
        current_table = None
        
        for line in lines:
            # Detect if line is table header
            if self.is_table_header(line):
                if current_table:
                    tables.append(current_table)
                current_table = TableData(headers=self.parse_header(line))
            
            # Detect if line is table row
            elif current_table and self.is_table_row(line):
                row_data = self.parse_row(line, language)
                current_table.add_row(row_data)
            
            # Detect table end
            elif current_table and self.is_table_end(line):
                tables.append(current_table)
                current_table = None
        
        # Add last table if exists
        if current_table:
            tables.append(current_table)
        
        return tables
```

---

## 5. WORKFLOW ENGINE

### 5.1 Workflow Architecture

The Workflow Engine orchestrates automated financial processes with full auditability and error handling.

```python
class WorkflowEngine:
    """
    Orchestrate automated financial workflows
    """
    
    def __init__(self):
        self.workflow_registry = WorkflowRegistry()
        self.step_executor = StepExecutor()
        self.event_bus = EventBus()
    
    async def execute_workflow(
        self,
        workflow_id: str,
        input_params: Dict[str, Any],
        executed_by: str
    ) -> WorkflowExecution:
        """
        Execute a workflow with full logging and error handling
        """
        # Load workflow definition
        workflow_def = self.workflow_registry.get(workflow_id)
        
        # Create execution record
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            input_params=input_params,
            executed_by=executed_by,
            status='running',
            started_at=datetime.now()
        )
        
        execution_id = await self.save_execution(execution)
        
        try:
            # Execute steps sequentially
            context = {'input': input_params}
            
            for step in workflow_def.steps:
                # Execute step
                step_result = await self.step_executor.execute(
                    step,
                    context,
                    execution_id
                )
                
                # Update context with step output
                context[step.name] = step_result.output
                
                # Check if step requires approval
                if step.requires_approval:
                    await self.request_approval(
                        execution_id,
                        step.name,
                        step_result
                    )
                    
                    # Wait for approval
                    approval = await self.wait_for_approval(execution_id, step.name)
                    
                    if not approval.approved:
                        raise WorkflowCancelledException(
                            f"Step {step.name} rejected: {approval.reason}"
                        )
                
                # Emit step completed event
                await self.event_bus.emit(StepCompletedEvent(
                    execution_id=execution_id,
                    step_name=step.name,
                    output=step_result.output
                ))
            
            # Mark as completed
            execution.status = 'completed'
            execution.completed_at = datetime.now()
            execution.output_results = context
            
            # Emit workflow completed event
            await self.event_bus.emit(WorkflowCompletedEvent(
                execution_id=execution_id,
                output=context
            ))
            
        except Exception as e:
            # Mark as failed
            execution.status = 'failed'
            execution.completed_at = datetime.now()
            execution.error_message = str(e)
            
            # Emit workflow failed event
            await self.event_bus.emit(WorkflowFailedEvent(
                execution_id=execution_id,
                error=str(e)
            ))
            
            raise
        
        finally:
            # Save final execution state
            await self.save_execution(execution)
        
        return execution
```

### 5.2 Pre-Built Workflows

#### 5.2.1 Data Import & Validation Workflow

```yaml
workflow_name: "Data Import & Validation"
workflow_type: "data_import"
trigger_type: "manual"

steps:
  - name: "upload_file"
    type: "file_upload"
    description: "User uploads financial file"
    action:
      handler: "upload_file_handler"
      
  - name: "parse_file"
    type: "data_processing"
    description: "Parse and extract data from file"
    action:
      handler: "universal_file_parser"
      params:
        file_path: "{{upload_file.file_path}}"
        org_id: "{{context.org_id}}"
    
  - name: "detect_schema"
    type: "data_processing"
    description: "Detect data schema and structure"
    action:
      handler: "schema_detector"
      params:
        raw_data: "{{parse_file.raw_data}}"
    
  - name: "map_to_canonical"
    type: "data_processing"
    description: "Map to canonical data model"
    action:
      handler: "canonical_mapper"
      params:
        raw_data: "{{parse_file.raw_data}}"
        schema: "{{detect_schema.schema}}"
    
  - name: "validate_data"
    type: "validation"
    description: "Validate data quality and business rules"
    action:
      handler: "validation_framework"
      params:
        data: "{{map_to_canonical.canonical_data}}"
    
  - name: "review_validation"
    type: "human_review"
    description: "User reviews validation results"
    requires_approval: true
    approval_params:
      message: "Please review validation results"
      show_data:
        - validation_errors
        - validation_warnings
    
  - name: "store_data"
    type: "data_storage"
    description: "Store validated data"
    action:
      handler: "data_storage_service"
      params:
        data: "{{map_to_canonical.canonical_data}}"
        validation: "{{validate_data.validation_result}}"
    
  - name: "calculate_metrics"
    type: "calculation"
    description: "Calculate derived metrics"
    action:
      handler: "calculation_engine"
      params:
        dataset_id: "{{store_data.dataset_id}}"
    
  - name: "send_notification"
    type: "notification"
    description: "Notify user of completion"
    action:
      handler: "notification_service"
      params:
        message: "Data import completed successfully"
        dataset_id: "{{store_data.dataset_id}}"
```

#### 5.2.2 Monthly Close Workflow

```yaml
workflow_name: "Monthly Financial Close"
workflow_type: "consolidation"
trigger_type: "scheduled"  # Triggers on last day of month
trigger_config:
  schedule: "0 23 28-31 * *"  # 11 PM on last days of month
  timezone: "Asia/Tbilisi"

steps:
  - name: "check_data_completeness"
    type: "validation"
    description: "Check if all entity data is available"
    action:
      handler: "data_completeness_checker"
      params:
        period: "{{context.current_period}}"
        required_entities: ["SGG", "TelavGas", "SOG", "SGGD"]
    failure_action:
      type: "alert"
      message: "Missing data for monthly close"
      escalate_to: ["cfo@company.com"]
  
  - name: "run_calculations"
    type: "calculation"
    description: "Calculate all derived metrics"
    action:
      handler: "calculation_engine"
      params:
        period: "{{context.current_period}}"
    
  - name: "consolidate_entities"
    type: "consolidation"
    description: "Consolidate all entities"
    action:
      handler: "consolidation_engine"
      params:
        period: "{{context.current_period}}"
        consolidation_groups: ["SGG_Total", "SOG_Total"]
    
  - name: "variance_analysis"
    type: "analysis"
    description: "Analyze variances vs budget"
    action:
      handler: "variance_analyzer"
      params:
        period: "{{context.current_period}}"
        comparison_type: "budget"
    
  - name: "generate_flash_report"
    type: "reporting"
    description: "Generate flash report for management"
    action:
      handler: "report_generator"
      params:
        template: "flash_report"
        period: "{{context.current_period}}"
        include_charts: true
    
  - name: "cfo_review"
    type: "human_review"
    description: "CFO reviews results before finalization"
    requires_approval: true
    approval_params:
      message: "Please review monthly close results"
      approvers: ["cfo@company.com"]
      show_data:
        - flash_report
        - variance_analysis
    timeout: "48h"
    
  - name: "finalize_period"
    type: "data_update"
    description: "Mark period as closed"
    action:
      handler: "period_finalizer"
      params:
        period: "{{context.current_period}}"
        status: "closed"
    
  - name: "distribute_reports"
    type: "notification"
    description: "Distribute reports to stakeholders"
    action:
      handler: "report_distributor"
      params:
        report: "{{generate_flash_report.report_url}}"
        recipients: ["management@company.com", "board@company.com"]
```

### 5.3 Event-Driven Architecture

```python
class EventBus:
    """
    Event-driven workflow triggers
    """
    
    def __init__(self):
        self.subscribers = defaultdict(list)
        self.firestore = firestore.client()
    
    async def emit(self, event: Event):
        """
        Emit event to all subscribers
        """
        # Store event in Firestore
        await self.store_event(event)
        
        # Notify subscribers
        subscribers = self.subscribers.get(event.event_type, [])
        
        for subscriber in subscribers:
            try:
                await subscriber.handle(event)
            except Exception as e:
                logger.error(f"Subscriber {subscriber} failed to handle event: {e}")
    
    def subscribe(self, event_type: str, handler: Callable):
        """
        Subscribe to event type
        """
        self.subscribers[event_type].append(handler)
    
    async def store_event(self, event: Event):
        """
        Store event for audit trail
        """
        await self.firestore.collection('events').add({
            'event_id': event.event_id,
            'event_type': event.event_type,
            'timestamp': event.timestamp,
            'payload': event.payload,
            'source': event.source
        })


# Example: Trigger workflow on data upload
class DataUploadedHandler:
    """
    Handle data upload events
    """
    
    async def handle(self, event: DataUploadedEvent):
        """
        Trigger validation workflow when data is uploaded
        """
        workflow_engine = WorkflowEngine()
        
        # Start validation workflow
        await workflow_engine.execute_workflow(
            workflow_id='data_validation',
            input_params={
                'file_path': event.file_path,
                'org_id': event.org_id,
                'uploaded_by': event.uploaded_by
            },
            executed_by='system'
        )


# Register handler
event_bus = EventBus()
event_bus.subscribe('data_uploaded', DataUploadedHandler())
```

---

**[DOCUMENT CONTINUES IN NEXT PART DUE TO LENGTH...]**

This is Part 1 of the comprehensive architecture. Would you like me to continue with:
- Part 2: Generative AI Integration, Knowledge Base & Learning System
- Part 3: Backend Architecture (FastAPI, Cloud Functions)
- Part 4: Frontend Architecture (React, Material-UI)
- Part 5: GCP/Firebase Infrastructure, Security, Deployment

Each part will be equally detailed with code examples, diagrams, and implementation specifics.
