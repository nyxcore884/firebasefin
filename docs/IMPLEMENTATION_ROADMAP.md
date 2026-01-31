# Implementation Roadmap: Specification → Production
## Prioritized Development Plan Based on Architecture Audit

---

## EXECUTIVE SUMMARY

**Current State:**
- ✅ **UI/UX:** 70% complete (Dashboard, P&L, BS, CF, AI Chat)
- ✅ **Real-time Updates:** 90% complete (Redux, Firestore listeners)
- ⚠️ **AI/Reasoning:** 40% complete (RAG works, missing task decomposition)
- ❌ **Consolidation Engine:** 20% complete (mocked, needs real IC elimination)
- ❌ **Export System:** 0% complete (not built)
- ❌ **Entity Management:** 0% complete (hardcoded)
- ❌ **Production Hardening:** 10% complete (missing policy engine, DAG)

**Target State:**
- Production-ready system with all enterprise features functional

**Timeline:** 6 months (Phases 1-12)

---

## PHASE-BY-PHASE IMPLEMENTATION PLAN

### 🎯 PHASE 1: Entity Management Foundation (Weeks 1-2)
**Priority:** CRITICAL (Prerequisite for consolidation)
**Status:** 🔴 Not Built (0%)

#### 1.1 Database Schema

```sql
-- Create entity management tables
CREATE TABLE entities (
    entity_id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL,
    entity_code VARCHAR(20) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50), -- 'parent', 'subsidiary', 'division', 'region'
    
    -- Operational
    is_active BOOLEAN DEFAULT true,
    fiscal_year_end DATE,
    functional_currency VARCHAR(3) DEFAULT 'GEL',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (org_id) REFERENCES organizations(org_id)
);

CREATE TABLE entity_relationships (
    relationship_id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL,
    parent_entity_id VARCHAR(50) NOT NULL,
    child_entity_id VARCHAR(50) NOT NULL,
    
    -- Ownership
    ownership_percentage DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
    voting_percentage DECIMAL(5,2),
    
    -- Control
    control_type VARCHAR(50), -- 'full', 'joint', 'significant_influence', 'none'
    consolidation_method VARCHAR(50), -- 'full', 'proportionate', 'equity', 'cost'
    
    -- Validity
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    FOREIGN KEY (parent_entity_id) REFERENCES entities(entity_id),
    FOREIGN KEY (child_entity_id) REFERENCES entities(entity_id),
    
    -- Prevent circular relationships
    CHECK (parent_entity_id != child_entity_id)
);

-- Indexes
CREATE INDEX idx_entities_org ON entities(org_id);
CREATE INDEX idx_entity_rels_parent ON entity_relationships(parent_entity_id);
CREATE INDEX idx_entity_rels_child ON entity_relationships(child_entity_id);
CREATE INDEX idx_entity_rels_active ON entity_relationships(is_active, effective_from, effective_to);
```

#### 1.2 Backend API Endpoints

```typescript
// server/routes/entities.ts
import { Router } from 'express';
import { EntityController } from '../controllers/entityController';

const router = Router();
const controller = new EntityController();

// Entity CRUD
router.get('/api/entities', controller.listEntities);
router.get('/api/entities/:id', controller.getEntity);
router.post('/api/entities', controller.createEntity);
router.put('/api/entities/:id', controller.updateEntity);
router.delete('/api/entities/:id', controller.deleteEntity);

// Entity Relationships
router.get('/api/entities/:id/relationships', controller.getRelationships);
router.post('/api/entity-relationships', controller.createRelationship);
router.put('/api/entity-relationships/:id', controller.updateRelationship);
router.delete('/api/entity-relationships/:id', controller.deleteRelationship);

// Hierarchy
router.get('/api/entities/hierarchy/:parentId', controller.getHierarchy);
router.post('/api/entities/hierarchy/validate', controller.validateHierarchy);

export default router;
```

```typescript
// server/controllers/entityController.ts
import { Request, Response } from 'express';
import { EntityService } from '../services/entityService';

export class EntityController {
    private entityService: EntityService;
    
    constructor() {
        this.entityService = new EntityService();
    }
    
    async listEntities(req: Request, res: Response) {
        try {
            const { org_id } = req.query;
            const entities = await this.entityService.listEntities(org_id as string);
            res.json({ success: true, data: entities });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async createEntity(req: Request, res: Response) {
        try {
            const entity = await this.entityService.createEntity(req.body);
            res.json({ success: true, data: entity });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async getHierarchy(req: Request, res: Response) {
        try {
            const { parentId } = req.params;
            const { asOfDate } = req.query;
            
            const hierarchy = await this.entityService.buildHierarchy(
                parentId,
                asOfDate ? new Date(asOfDate as string) : new Date()
            );
            
            res.json({ success: true, data: hierarchy });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async validateHierarchy(req: Request, res: Response) {
        try {
            const { relationships } = req.body;
            const validation = await this.entityService.validateHierarchy(relationships);
            res.json({ success: true, data: validation });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
```

#### 1.3 Frontend Components

```typescript
// src/features/entities/EntityManagement.tsx
import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Dialog, 
    Tree,
    IconButton 
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchEntities, 
    fetchHierarchy,
    selectAllEntities,
    selectEntityHierarchy 
} from './entitiesSlice';

export const EntityManagement: React.FC = () => {
    const dispatch = useDispatch();
    const entities = useSelector(selectAllEntities);
    const hierarchy = useSelector(selectEntityHierarchy);
    const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    useEffect(() => {
        dispatch(fetchEntities());
        dispatch(fetchHierarchy());
    }, [dispatch]);
    
    return (
        <Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h4">Entity Management</Typography>
                <Button 
                    startIcon={<Add />}
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                >
                    Add Entity
                </Button>
            </Box>
            
            {/* Entity Hierarchy Tree */}
            <EntityHierarchyTree 
                hierarchy={hierarchy}
                onSelect={setSelectedEntity}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
            
            {/* Add/Edit Dialog */}
            <EntityDialog 
                open={dialogOpen}
                entity={selectedEntity}
                onClose={() => setDialogOpen(false)}
                onSave={handleSave}
            />
        </Box>
    );
};
```

**Deliverables:**
- ✅ Database tables created
- ✅ Backend API functional
- ✅ Frontend entity management page
- ✅ CRUD operations working
- ✅ Hierarchy visualization
- ✅ Validation (no circular refs)

**Testing:**
- Create SOCAR hierarchy (SGG → Regions)
- Verify relationships persist
- Test hierarchy calculation
- Validate circular reference prevention

---

### 🎯 PHASE 2: Intercompany Transaction Detection (Weeks 3-4)
**Priority:** HIGH (Core consolidation requirement)
**Status:** 🔴 Not Built (5%)

#### 2.1 Database Schema

```sql
CREATE TABLE intercompany_transactions (
    ic_transaction_id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL,
    period_id VARCHAR(50) NOT NULL,
    
    -- Parties
    entity_from_id VARCHAR(50) NOT NULL,
    entity_to_id VARCHAR(50) NOT NULL,
    
    -- Transaction details
    transaction_type VARCHAR(50), -- 'sale', 'purchase', 'loan', 'dividend', 'fee'
    transaction_date DATE NOT NULL,
    amount DECIMAL(20,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GEL',
    
    -- Accounts
    account_debit VARCHAR(50),
    account_credit VARCHAR(50),
    
    -- Source
    source_type VARCHAR(50), -- 'auto_detected', 'manual', 'imported'
    source_record_id VARCHAR(50),
    reference VARCHAR(255),
    
    -- Matching
    matched_transaction_id VARCHAR(50),
    match_confidence DECIMAL(3,2), -- 0.00 to 1.00
    match_method VARCHAR(50), -- 'account_code', 'amount', 'description', 'manual'
    
    -- Elimination
    requires_elimination BOOLEAN DEFAULT true,
    elimination_percentage DECIMAL(5,2) DEFAULT 100.00,
    elimination_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'eliminated'
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(100),
    
    FOREIGN KEY (entity_from_id) REFERENCES entities(entity_id),
    FOREIGN KEY (entity_to_id) REFERENCES entities(entity_id)
);

CREATE INDEX idx_ic_txn_period ON intercompany_transactions(period_id);
CREATE INDEX idx_ic_txn_entities ON intercompany_transactions(entity_from_id, entity_to_id);
CREATE INDEX idx_ic_txn_status ON intercompany_transactions(elimination_status);
```

#### 2.2 Detection Engine

```typescript
// server/services/intercompanyDetectionService.ts
export class IntercompanyDetectionService {
    
    async detectIntercompanyTransactions(
        orgId: string,
        periodId: string,
        entityIds: string[]
    ): Promise<IntercompanyTransaction[]> {
        
        const detected: IntercompanyTransaction[] = [];
        
        // Method 1: Account code matching (designated IC accounts)
        const accountBased = await this.detectByAccountCode(
            orgId, 
            periodId, 
            entityIds
        );
        detected.push(...accountBased);
        
        // Method 2: Amount matching (debit in one = credit in another)
        const amountBased = await this.detectByAmountMatching(
            orgId,
            periodId,
            entityIds
        );
        detected.push(...amountBased);
        
        // Method 3: Description/reference matching
        const descriptionBased = await this.detectByDescription(
            orgId,
            periodId,
            entityIds
        );
        detected.push(...descriptionBased);
        
        // Deduplicate
        const unique = this.deduplicateTransactions(detected);
        
        // Save to database
        await this.saveDetectedTransactions(unique);
        
        return unique;
    }
    
    private async detectByAmountMatching(
        orgId: string,
        periodId: string,
        entityIds: string[]
    ): Promise<IntercompanyTransaction[]> {
        
        // Get all transactions for period
        const transactions = await db.query(`
            SELECT 
                record_id,
                entity_id,
                account_id,
                amount,
                transaction_date,
                description,
                reference
            FROM financial_records
            WHERE org_id = $1
              AND period_id = $2
              AND entity_id = ANY($3)
        `, [orgId, periodId, entityIds]);
        
        const detected: IntercompanyTransaction[] = [];
        const tolerance = 0.01; // 1% tolerance
        
        // Group by amount (rounded)
        const byAmount = new Map<number, typeof transactions>();
        
        for (const txn of transactions) {
            const rounded = Math.round(Math.abs(txn.amount) * 100) / 100;
            if (!byAmount.has(rounded)) {
                byAmount.set(rounded, []);
            }
            byAmount.get(rounded)!.push(txn);
        }
        
        // Find matching pairs
        for (const [amount, txns] of byAmount.entries()) {
            if (txns.length < 2) continue;
            
            for (let i = 0; i < txns.length; i++) {
                for (let j = i + 1; j < txns.length; j++) {
                    const txn1 = txns[i];
                    const txn2 = txns[j];
                    
                    // Different entities
                    if (txn1.entity_id === txn2.entity_id) continue;
                    
                    // Opposite signs
                    if (!this.areOppositeSigns(txn1.amount, txn2.amount)) continue;
                    
                    // Similar dates (within 5 days)
                    const daysDiff = Math.abs(
                        (new Date(txn1.transaction_date).getTime() - 
                         new Date(txn2.transaction_date).getTime()) / 
                        (1000 * 60 * 60 * 24)
                    );
                    
                    if (daysDiff > 5) continue;
                    
                    // Calculate confidence
                    const confidence = this.calculateMatchConfidence(txn1, txn2);
                    
                    if (confidence >= 0.7) {
                        detected.push({
                            ic_transaction_id: generateId(),
                            org_id: orgId,
                            period_id: periodId,
                            entity_from_id: txn1.amount > 0 ? txn1.entity_id : txn2.entity_id,
                            entity_to_id: txn1.amount > 0 ? txn2.entity_id : txn1.entity_id,
                            transaction_type: 'transfer',
                            transaction_date: txn1.transaction_date,
                            amount: Math.abs(txn1.amount),
                            account_debit: txn1.amount > 0 ? txn1.account_id : txn2.account_id,
                            account_credit: txn1.amount > 0 ? txn2.account_id : txn1.account_id,
                            source_type: 'auto_detected',
                            match_method: 'amount',
                            match_confidence: confidence,
                            matched_transaction_id: txn2.record_id
                        });
                    }
                }
            }
        }
        
        return detected;
    }
    
    private calculateMatchConfidence(txn1: any, txn2: any): number {
        let score = 0;
        
        // Exact amount match
        if (Math.abs(txn1.amount + txn2.amount) < 0.01) {
            score += 0.4;
        }
        
        // Same date
        if (txn1.transaction_date === txn2.transaction_date) {
            score += 0.3;
        }
        
        // Similar description
        if (txn1.description && txn2.description) {
            const similarity = this.calculateStringSimilarity(
                txn1.description,
                txn2.description
            );
            score += similarity * 0.2;
        }
        
        // Same reference
        if (txn1.reference && txn2.reference && txn1.reference === txn2.reference) {
            score += 0.1;
        }
        
        return Math.min(score, 1.0);
    }
}
```

#### 2.3 Frontend Review Interface

```typescript
// src/features/consolidation/IntercompanyReview.tsx
import React, { useState, useEffect } from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableRow,
    Checkbox,
    IconButton,
    Chip
} from '@mui/material';
import { Check, Close, Edit, Visibility } from '@mui/icons-material';

export const IntercompanyReview: React.FC = () => {
    const [transactions, setTransactions] = useState<ICTransaction[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    
    useEffect(() => {
        loadICTransactions();
    }, []);
    
    const handleApprove = async (id: string) => {
        await api.post(`/api/intercompany-transactions/${id}/approve`);
        await loadICTransactions();
    };
    
    const handleApproveSelected = async () => {
        await Promise.all(
            Array.from(selected).map(id => 
                api.post(`/api/intercompany-transactions/${id}/approve`)
            )
        );
        setSelected(new Set());
        await loadICTransactions();
    };
    
    return (
        <Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h5">Review Intercompany Transactions</Typography>
                <Button 
                    disabled={selected.size === 0}
                    onClick={handleApproveSelected}
                >
                    Approve Selected ({selected.size})
                </Button>
            </Box>
            
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <Checkbox 
                                checked={selected.size === transactions.length}
                                onChange={handleSelectAll}
                            />
                        </TableCell>
                        <TableCell>From</TableCell>
                        <TableCell>To</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Confidence</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {transactions.map(txn => (
                        <TableRow key={txn.ic_transaction_id}>
                            <TableCell padding="checkbox">
                                <Checkbox 
                                    checked={selected.has(txn.ic_transaction_id)}
                                    onChange={() => handleToggleSelect(txn.ic_transaction_id)}
                                />
                            </TableCell>
                            <TableCell>{txn.entity_from_name}</TableCell>
                            <TableCell>{txn.entity_to_name}</TableCell>
                            <TableCell>{txn.transaction_type}</TableCell>
                            <TableCell>{formatCurrency(txn.amount)}</TableCell>
                            <TableCell>
                                <Chip 
                                    label={`${(txn.match_confidence * 100).toFixed(0)}%`}
                                    color={txn.match_confidence >= 0.9 ? 'success' : 'warning'}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>
                                <Chip 
                                    label={txn.elimination_status}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>
                                <IconButton 
                                    size="small"
                                    onClick={() => handleApprove(txn.ic_transaction_id)}
                                >
                                    <Check />
                                </IconButton>
                                <IconButton 
                                    size="small"
                                    onClick={() => handleReject(txn.ic_transaction_id)}
                                >
                                    <Close />
                                </IconButton>
                                <IconButton 
                                    size="small"
                                    onClick={() => handleEdit(txn.ic_transaction_id)}
                                >
                                    <Edit />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};
```

**Deliverables:**
- ✅ IC transaction detection engine
- ✅ Multi-method detection (account, amount, description)
- ✅ Confidence scoring
- ✅ Review interface
- ✅ Approve/reject workflow

**Testing:**
- Upload SOCAR data with IC transactions
- Verify detection accuracy
- Test confidence thresholds
- Approve high-confidence matches

---

### 🎯 PHASE 3: Consolidation Engine Core (Weeks 5-6)
**Priority:** HIGH
**Status:** 🔴 20% Complete (mocked)

#### 3.1 Consolidation Service

```typescript
// server/services/consolidationService.ts
export class ConsolidationService {
    
    async executeConsolidation(
        orgId: string,
        periodId: string,
        config: ConsolidationConfig
    ): Promise<ConsolidatedResult> {
        
        // STEP 1: Build entity hierarchy
        const hierarchy = await this.buildEntityHierarchy(
            config.parent_entity_id,
            config.included_entities
        );
        
        // STEP 2: Load entity financials
        const entityFinancials = await this.loadEntityFinancials(
            orgId,
            periodId,
            config.included_entities
        );
        
        // STEP 3: Validate inputs
        await this.validateInputs(entityFinancials, hierarchy);
        
        // STEP 4: Aggregate entities
        let aggregated = await this.aggregateEntities(
            entityFinancials,
            hierarchy
        );
        
        // STEP 5: Detect and eliminate IC transactions
        if (config.eliminate_intercompany) {
            const icTransactions = await this.icDetectionService.detectIntercompanyTransactions(
                orgId,
                periodId,
                config.included_entities
            );
            
            const eliminations = await this.generateEliminations(icTransactions);
            
            aggregated = this.applyEliminations(aggregated, eliminations);
        }
        
        // STEP 6: Calculate minority interest
        let minorityInterest = null;
        if (config.calculate_minority_interest) {
            minorityInterest = await this.calculateMinorityInterest(
                aggregated,
                hierarchy
            );
            
            aggregated = this.adjustForMinorityInterest(
                aggregated,
                minorityInterest
            );
        }
        
        // STEP 7: Validate results
        const validation = await this.validateConsolidation(
            aggregated,
            entityFinancials
        );
        
        if (!validation.passed) {
            throw new Error(`Consolidation validation failed: ${validation.errors.join(', ')}`);
        }
        
        // STEP 8: Save consolidated results
        const consolidatedId = await this.saveConsolidatedResults(
            orgId,
            periodId,
            aggregated,
            minorityInterest
        );
        
        return {
            consolidation_id: consolidatedId,
            consolidated_financials: aggregated,
            minority_interest: minorityInterest,
            validation
        };
    }
    
    private async aggregateEntities(
        entityFinancials: Map<string, EntityFinancials>,
        hierarchy: EntityHierarchy
    ): Promise<AggregatedFinancials> {
        
        const result: AggregatedFinancials = {
            income_statement: {},
            balance_sheet: {},
            entity_details: {}
        };
        
        for (const [entityId, financials] of entityFinancials.entries()) {
            const node = hierarchy.getNode(entityId);
            
            if (!node) continue;
            
            // Determine consolidation method
            const method = node.consolidation_method;
            
            if (method === 'full') {
                // Add 100% of entity
                this.addFullConsolidation(result, financials, entityId);
            } else if (method === 'proportionate') {
                // Add proportionate share
                const ownership = node.ownership_percentage / 100;
                this.addProportionateConsolidation(result, financials, entityId, ownership);
            } else if (method === 'equity') {
                // Equity method (one-line investment)
                this.addEquityMethod(result, financials, entityId, node.ownership_percentage);
            }
            
            // Store entity details for minority interest calc
            result.entity_details[entityId] = financials;
        }
        
        return result;
    }
    
    private addFullConsolidation(
        result: AggregatedFinancials,
        financials: EntityFinancials,
        entityId: string
    ): void {
        
        // Add income statement line by line
        for (const [account, amount] of Object.entries(financials.income_statement)) {
            if (!result.income_statement[account]) {
                result.income_statement[account] = 0;
            }
            result.income_statement[account] += amount;
        }
        
        // Add balance sheet line by line
        for (const [account, amount] of Object.entries(financials.balance_sheet)) {
            if (!result.balance_sheet[account]) {
                result.balance_sheet[account] = 0;
            }
            result.balance_sheet[account] += amount;
        }
    }
}
```

**Deliverables:**
- ✅ Full consolidation method working
- ✅ Proportionate consolidation
- ✅ Equity method
- ✅ IC elimination integration
- ✅ Minority interest calculation
- ✅ Validation framework

---

### 🎯 PHASE 4: Export System (Weeks 7-8)
**Priority:** HIGH (User-facing requirement)
**Status:** 🔴 0% Complete

#### 4.1 Excel Export

```typescript
// server/services/exportService.ts
import ExcelJS from 'exceljs';

export class ExportService {
    
    async generateExcelReport(
        consolidatedData: ConsolidatedResult,
        config: ExportConfig
    ): Promise<Buffer> {
        
        const workbook = new ExcelJS.Workbook();
        
        // Create worksheets
        if (config.include_pl) {
            await this.createPLWorksheet(workbook, consolidatedData);
        }
        
        if (config.include_bs) {
            await this.createBSWorksheet(workbook, consolidatedData);
        }
        
        if (config.include_eliminations) {
            await this.createEliminationsWorksheet(workbook, consolidatedData);
        }
        
        if (config.include_reconciliation) {
            await this.createReconciliationWorksheet(workbook, consolidatedData);
        }
        
        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        return buffer as Buffer;
    }
    
    private async createPLWorksheet(
        workbook: ExcelJS.Workbook,
        data: ConsolidatedResult
    ): Promise<void> {
        
        const ws = workbook.addWorksheet('P&L Statement');
        
        // Header
        ws.getCell('A1').value = 'Consolidated Income Statement';
        ws.getCell('A1').font = { bold: true, size: 14 };
        
        ws.getCell('A2').value = `Period: ${data.period}`;
        ws.getCell('A2').font = { italic: true };
        
        // Column headers
        const headerRow = ws.getRow(4);
        headerRow.values = ['Account', 'Amount', '% of Revenue'];
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };
        
        // Data rows
        let row = 5;
        const plData = data.consolidated_financials.income_statement;
        
        for (const [account, amount] of Object.entries(plData)) {
            ws.getCell(`A${row}`).value = account;
            ws.getCell(`B${row}`).value = amount;
            ws.getCell(`B${row}`).numFmt = '#,##0';
            
            // Calculate % of revenue
            if (account !== 'Revenue') {
                ws.getCell(`C${row}`).value = {
                    formula: `B${row}/B5*100`,
                    result: (amount / plData['Revenue']) * 100
                };
                ws.getCell(`C${row}`).numFmt = '0.0"%"';
            }
            
            row++;
        }
        
        // Auto-fit columns
        ws.columns.forEach(column => {
            column.width = 20;
        });
    }
}
```

#### 4.2 PDF Export

```typescript
import PDFDocument from 'pdfkit';

export class PDFExportService {
    
    async generatePDF(
        consolidatedData: ConsolidatedResult,
        config: ExportConfig
    ): Promise<Buffer> {
        
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // Title page
            doc.fontSize(20).text('Consolidated Financial Statements', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Period: ${consolidatedData.period}`, { align: 'center' });
            doc.moveDown(2);
            
            // P&L Statement
            this.renderPLStatement(doc, consolidatedData);
            
            // Balance Sheet
            doc.addPage();
            this.renderBalanceSheet(doc, consolidatedData);
            
            // Finalize
            doc.end();
        });
    }
    
    private renderPLStatement(doc: PDFDocument, data: ConsolidatedResult): void {
        doc.fontSize(14).text('Income Statement', { underline: true });
        doc.moveDown();
        
        const pl = data.consolidated_financials.income_statement;
        
        // Table header
        doc.fontSize(10);
        doc.text('Account', 50, doc.y, { width: 200 });
        doc.text('Amount', 300, doc.y - 10, { width: 100, align: 'right' });
        doc.moveDown();
        
        // Draw line
        doc.moveTo(50, doc.y).lineTo(450, doc.y).stroke();
        doc.moveDown();
        
        // Data rows
        for (const [account, amount] of Object.entries(pl)) {
            const y = doc.y;
            doc.text(account, 50, y, { width: 200 });
            doc.text(this.formatCurrency(amount), 300, y, { width: 100, align: 'right' });
            doc.moveDown(0.5);
        }
    }
}
```

**Deliverables:**
- ✅ Excel export with formulas
- ✅ PDF export with formatting
- ✅ PowerPoint export
- ✅ Template system
- ✅ Email delivery

---

## REMAINING PHASES (Summary)

### Phase 5: Production Hardening (Weeks 9-10)
- Enterprise policy engine
- Idempotent DAG execution
- Comprehensive error handling

### Phase 6: Advanced AI (Weeks 11-12)
- Task decomposition
- Parallel execution
- Confidence scoring

### Phase 7-12: Additional Features
- Advanced analytics
- Budgeting module
- Forecasting
- Compliance reporting
- Performance optimization
- Security hardening

---

## IMPLEMENTATION PRIORITY MATRIX

| Feature | Business Value | Technical Complexity | Priority | Status |
|---------|---------------|---------------------|----------|--------|
| Entity Management | CRITICAL | Medium | P0 | 🔴 0% |
| IC Detection | CRITICAL | High | P0 | 🔴 5% |
| Consolidation Core | CRITICAL | High | P0 | 🟠 20% |
| Export System | HIGH | Medium | P1 | 🔴 0% |
| Advanced UI Controls | HIGH | Low | P1 | 🟡 60% |
| What-If Scenarios | MEDIUM | Medium | P2 | 🔴 0% |
| Approval Workflows | MEDIUM | Low | P2 | 🔴 0% |
| Production Hardening | HIGH | High | P1 | 🔴 10% |

---

## SUCCESS CRITERIA

### Phase 1-2 (Entity + IC Detection)
- ✅ Can create SOCAR hierarchy in UI
- ✅ System detects IC transactions >85% accuracy
- ✅ Users can review and approve eliminations

### Phase 3 (Consolidation)
- ✅ Consolidated P&L balances
- ✅ Eliminations calculated correctly
- ✅ Minority interest accurate

### Phase 4 (Export)
- ✅ Excel export with working formulas
- ✅ PDF looks professional
- ✅ Users can email reports

---

## NEXT STEPS

1. **Immediate (This Week):**
   - Create entity management database tables
   - Build entity CRUD API
   - Start frontend entity management page

2. **Week 2:**
   - Complete entity hierarchy builder
   - Implement relationship validation
   - Test with SOCAR data

3. **Week 3:**
   - Begin IC detection engine
   - Implement amount matching
   - Build review interface

**Ready to start Phase 1 implementation?**
