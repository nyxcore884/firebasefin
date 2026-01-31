import Decimal from 'decimal.js';
import { intercompanyService, FinancialRecord as ICFinancialRecord } from './intercompanyDetectionService';

// --- HIERARCHY UTILS ---

export const buildHierarchy = (entities: any[]): EntityNode => {
    // Find root
    const root = entities.find(e => !e.parentId);
    if (!root) return { id: 'root', name: 'Group root', ownership_pct: 100 };

    const mapNode = (entity: any): EntityNode => ({
        id: entity.id,
        name: entity.name,
        ownership_pct: entity.ownershipPct,
        consolidationMethod: entity.consolidationMethod,
        children: entities.filter(e => e.parentId === entity.id).map(mapNode)
    });

    return mapNode(root);
};

// --- TYPES ---

export interface FinancialRecord {
    id: string;
    date: string;
    entityId: string;
    entity: string;
    account: string;
    accountId?: string;
    accountType?: string;
    description: string;
    reference?: string;
    amount: number;
    type: 'actual' | 'budget' | 'forecast';
}

export interface EntityFinancials {
    entity_id: string;
    entity_name: string;
    period: string;
    currency: string;

    // Summarized Statements
    revenue: number;
    cogs: number;
    gross_profit: number;
    operating_expenses: number;
    ebitda: number;
    net_income: number;

    total_assets: number;
    total_liabilities: number;
    equity: number;

    // Detailed accounts (code -> amount)
    income_statement: Record<string, number>;
    balance_sheet: Record<string, number>;
    cash_flow: Record<string, number>;
}

export interface ConsolidationScope {
    parent_entity_id: string;
    consolidation_id: string;
    period: string;
    consolidation_date: string;
    included_entities: string[];
    consolidation_method: 'full' | 'proportionate' | 'equity';
    eliminate_intercompany: boolean;
    calculate_minority_interest: boolean;
    translate_currency: boolean;
    target_currency: string;
}

export interface Elimination {
    id: string;
    elimination_type: string;
    debit_account: string;
    credit_account: string;
    amount: number;
    description: string;
    seller_entity?: string;
    buyer_entity?: string;
    entity_a?: string;
    entity_b?: string;
    affects_income_statement: boolean;
    affects_balance_sheet: boolean;
}

export interface MinorityInterestDetail {
    entity_id: string;
    entity_name: string;
    minority_percentage: number;
    net_income: number;
    minority_income: number;
    equity: number;
    minority_equity: number;
}

export interface MinorityInterest {
    total_income: number;
    total_equity: number;
    details: MinorityInterestDetail[];
}

export interface ValidationResult {
    passed: boolean;
    errors: { severity: 'critical' | 'warning'; message: string; details?: any }[];
    warnings: { message: string; details?: any }[];
}

export interface EntityNode {
    id: string;
    name: string;
    ownership_pct: number;
    consolidationMethod?: 'full' | 'proportionate' | 'equity' | 'cost';
    children?: EntityNode[];
    isSelected?: boolean;
}

export interface ConsolidatedResult {
    consolidation_id: string;
    consolidated_financials: EntityFinancials;
    entities_data: Record<string, EntityFinancials>;
    eliminations: Elimination[];
    minority_interest: MinorityInterest | null;
    validation: ValidationResult;
    reconciliation: any;
    audit_trail_id: string;
}

// --- SERVICE IMPLEMENTATION ---

export class ConsolidationEngineService {

    async getHierarchy(dynamicEntities?: any[]): Promise<EntityNode> {
        if (dynamicEntities && dynamicEntities.length > 0) {
            return buildHierarchy(dynamicEntities);
        }

        // Fallback for safety during transition
        return {
            id: 'socar_energy_georgia',
            name: 'SOCAR Energy Georgia (Parent)',
            ownership_pct: 100,
            consolidationMethod: 'full',
            children: []
        };
    }

    /**
     * Converts flat records into summarized EntityFinancials (deterministic)
     */
    summarizeRecords(entityId: string, entityName: string, records: FinancialRecord[]): EntityFinancials {
        const entityRecords = records.filter(r => r.entityId === entityId || r.entity === entityName);

        const summary: EntityFinancials = {
            entity_id: entityId,
            entity_name: entityName,
            period: records[0]?.date?.substring(0, 7) || '2025-12',
            currency: 'GEL',
            revenue: 0, cogs: 0, gross_profit: 0, operating_expenses: 0, ebitda: 0, net_income: 0,
            total_assets: 0, total_liabilities: 0, equity: 0,
            income_statement: {}, balance_sheet: {}, cash_flow: {}
        };

        const dRev = new Decimal(0);
        const dCogs = new Decimal(0);
        const dOpex = new Decimal(0);
        const dAssets = new Decimal(0);
        const dLiabs = new Decimal(0);
        const dEquity = new Decimal(0);

        entityRecords.forEach(r => {
            const acc = (r.account || '').toLowerCase();
            const amt = new Decimal(r.amount || 0);

            // Categorization logic - more robust matching
            if (acc.includes('revenue') || acc.includes('sales') || r.accountType === 'revenue') {
                summary.income_statement[r.account] = (summary.income_statement[r.account] || 0) + amt.toNumber();
                summary.revenue = new Decimal(summary.revenue).plus(amt).toNumber();
            } else if (acc.includes('cogs') || acc.includes('cost of sales') || r.accountType === 'cogs') {
                summary.income_statement[r.account] = (summary.income_statement[r.account] || 0) + amt.toNumber();
                summary.cogs = new Decimal(summary.cogs).plus(amt).toNumber();
            } else if (acc.includes('expense') || acc.includes('salary') || acc.includes('rent') || r.accountType === 'operating_expense') {
                summary.income_statement[r.account] = (summary.income_statement[r.account] || 0) + amt.toNumber();
                summary.operating_expenses = new Decimal(summary.operating_expenses).plus(amt).toNumber();
            } else if (acc.includes('asset') || acc.includes('cash') || acc.includes('receivable') || r.accountType === 'asset') {
                summary.balance_sheet[r.account] = (summary.balance_sheet[r.account] || 0) + amt.toNumber();
                summary.total_assets = new Decimal(summary.total_assets).plus(amt).toNumber();
            } else if (acc.includes('liability') || acc.includes('payable') || r.accountType === 'liability') {
                summary.balance_sheet[r.account] = (summary.balance_sheet[r.account] || 0) + amt.toNumber();
                summary.total_liabilities = new Decimal(summary.total_liabilities).plus(amt).toNumber();
            } else if (acc.includes('equity') || r.accountType === 'equity') {
                summary.balance_sheet[r.account] = (summary.balance_sheet[r.account] || 0) + amt.toNumber();
                summary.equity = new Decimal(summary.equity).plus(amt).toNumber();
            }
        });

        const dR = new Decimal(summary.revenue);
        const dC = new Decimal(summary.cogs);
        const dO = new Decimal(summary.operating_expenses);

        summary.gross_profit = dR.plus(dC).toNumber();
        summary.ebitda = dR.plus(dC).plus(dO).toNumber();
        summary.net_income = summary.ebitda;

        return summary;
    }

    async runConsolidation(
        scope: ConsolidationScope,
        rawRecords: FinancialRecord[],
        hierarchy: EntityNode,
        onProgress: (step: string, progress: number, detail?: string) => void
    ): Promise<ConsolidatedResult> {

        const auditId = `audit_${Math.random().toString(36).substr(2, 9)}`;

        // STEP 1: Process and Aggregate (Deterministic Recursive)
        onProgress("Aggregation", 20, "Traversing hierarchy and applying consolidation methods...");

        const entitiesData: Record<string, EntityFinancials> = {};
        const consolidatedFinancials: EntityFinancials = {
            entity_id: 'consolidated',
            entity_name: 'Consolidated Group',
            period: scope.period,
            currency: scope.target_currency,
            revenue: 0, cogs: 0, gross_profit: 0, operating_expenses: 0, ebitda: 0, net_income: 0,
            total_assets: 0, total_liabilities: 0, equity: 0,
            income_statement: {}, balance_sheet: {}, cash_flow: {}
        };

        const miDetails: MinorityInterestDetail[] = [];
        let miTotalIncome = new Decimal(0);
        let miTotalEquity = new Decimal(0);

        const dConsol = {
            revenue: new Decimal(0),
            cogs: new Decimal(0),
            opex: new Decimal(0),
            assets: new Decimal(0),
            liabs: new Decimal(0),
            equity: new Decimal(0),
            is: {} as Record<string, Decimal>,
            bs: {} as Record<string, Decimal>
        };

        const traverse = (node: EntityNode) => {
            const financials = this.summarizeRecords(node.id, node.name, rawRecords);
            entitiesData[node.id] = financials;

            const method = node.consolidationMethod || 'full';
            const ownership = new Decimal(node.ownership_pct).div(100);

            if (method === 'full') {
                // FULL CONSOLIDATION: Add 100%
                dConsol.revenue = dConsol.revenue.plus(financials.revenue);
                dConsol.cogs = dConsol.cogs.plus(financials.cogs);
                dConsol.opex = dConsol.opex.plus(financials.operating_expenses);
                dConsol.assets = dConsol.assets.plus(financials.total_assets);
                dConsol.liabs = dConsol.liabs.plus(financials.total_liabilities);
                dConsol.equity = dConsol.equity.plus(financials.equity);

                // Detailed accounts
                Object.entries(financials.income_statement).forEach(([acc, val]) => {
                    dConsol.is[acc] = (dConsol.is[acc] || new Decimal(0)).plus(val);
                });
                Object.entries(financials.balance_sheet).forEach(([acc, val]) => {
                    dConsol.bs[acc] = (dConsol.bs[acc] || new Decimal(0)).plus(val);
                });

                // Calculate Minority Interest if < 100%
                if (node.ownership_pct < 100 && scope.calculate_minority_interest) {
                    const minorityPct = new Decimal(1).minus(ownership);
                    const mIncome = new Decimal(financials.net_income).times(minorityPct);
                    const mEquity = new Decimal(financials.equity).times(minorityPct);

                    miDetails.push({
                        entity_id: node.id,
                        entity_name: node.name,
                        minority_percentage: minorityPct.times(100).toNumber(),
                        net_income: financials.net_income,
                        minority_income: mIncome.toNumber(),
                        equity: financials.equity,
                        minority_equity: mEquity.toNumber()
                    });
                    miTotalIncome = miTotalIncome.plus(mIncome);
                    miTotalEquity = miTotalEquity.plus(mEquity);
                }
            } else if (method === 'proportionate') {
                // PROPORTIONATE: Add ownership %
                dConsol.revenue = dConsol.revenue.plus(new Decimal(financials.revenue).times(ownership));
                dConsol.cogs = dConsol.cogs.plus(new Decimal(financials.cogs).times(ownership));
                dConsol.opex = dConsol.opex.plus(new Decimal(financials.operating_expenses).times(ownership));
                dConsol.assets = dConsol.assets.plus(new Decimal(financials.total_assets).times(ownership));
                dConsol.liabs = dConsol.liabs.plus(new Decimal(financials.total_liabilities).times(ownership));
                dConsol.equity = dConsol.equity.plus(new Decimal(financials.equity).times(ownership));

                Object.entries(financials.income_statement).forEach(([acc, val]) => {
                    dConsol.is[acc] = (dConsol.is[acc] || new Decimal(0)).plus(new Decimal(val).times(ownership));
                });
                Object.entries(financials.balance_sheet).forEach(([acc, val]) => {
                    dConsol.bs[acc] = (dConsol.bs[acc] || new Decimal(0)).plus(new Decimal(val).times(ownership));
                });
            } else if (method === 'equity') {
                // EQUITY METHOD: Single line item
                const shareOfIncome = new Decimal(financials.net_income).times(ownership);
                const investmentValue = new Decimal(financials.equity).times(ownership);

                dConsol.is['Share of Associate Income'] = (dConsol.is['Share of Associate Income'] || new Decimal(0)).plus(shareOfIncome);
                dConsol.bs['Investment in Associates'] = (dConsol.bs['Investment in Associates'] || new Decimal(0)).plus(investmentValue);

                dConsol.assets = dConsol.assets.plus(investmentValue);
                dConsol.equity = dConsol.equity.plus(investmentValue); // Investment is an asset, balanced by own equity in consolidated view
            }

            node.children?.forEach(traverse);
        };

        traverse(hierarchy);

        // Map back to result object
        consolidatedFinancials.revenue = dConsol.revenue.toNumber();
        consolidatedFinancials.cogs = dConsol.cogs.toNumber();
        consolidatedFinancials.operating_expenses = dConsol.opex.toNumber();
        consolidatedFinancials.total_assets = dConsol.assets.toNumber();
        consolidatedFinancials.total_liabilities = dConsol.liabs.toNumber();
        consolidatedFinancials.equity = dConsol.equity.toNumber();

        Object.entries(dConsol.is).forEach(([acc, val]) => consolidatedFinancials.income_statement[acc] = val.toNumber());
        Object.entries(dConsol.bs).forEach(([acc, val]) => consolidatedFinancials.balance_sheet[acc] = val.toNumber());

        consolidatedFinancials.gross_profit = dConsol.revenue.plus(dConsol.cogs).toNumber();
        consolidatedFinancials.ebitda = dConsol.revenue.plus(dConsol.cogs).plus(dConsol.opex).toNumber();
        consolidatedFinancials.net_income = consolidatedFinancials.ebitda; // Simplified

        // STEP 2: Eliminations (Deterministic Detection)
        const eliminations: Elimination[] = [];
        if (scope.eliminate_intercompany) {
            onProgress("Eliminations", 75, "Detecting intercompany symmetric balances...");

            // Map our local records to IC Service format
            const icRecords: ICFinancialRecord[] = rawRecords.map(r => ({
                id: r.id,
                entityId: r.entityId,
                accountId: r.accountId || r.account,
                accountType: r.accountType || '',
                amount: r.amount,
                date: r.date,
                description: r.description,
                reference: r.reference || '',
                currency: 'GEL'
            }));

            const detected = await intercompanyService.detect(scope.parent_entity_id, scope.period, icRecords);

            detected.forEach(ic => {
                const amount = new Decimal(ic.amount);

                // Real subtraction from P&L (assuming these are revenue/cogs eliminations for now)
                if (consolidatedFinancials.revenue >= ic.amount) {
                    consolidatedFinancials.revenue = new Decimal(consolidatedFinancials.revenue).minus(amount).toNumber();
                    consolidatedFinancials.cogs = new Decimal(consolidatedFinancials.cogs).plus(amount).toNumber(); // Increase negative cogs

                    eliminations.push({
                        id: ic.id,
                        elimination_type: 'intercompany_sale',
                        debit_account: ic.accountDebit,
                        credit_account: ic.accountCredit,
                        amount: ic.amount,
                        description: `Eliminate matched IC balance: ${ic.matchMethod} match (${(ic.matchConfidence * 100).toFixed(0)}%)`,
                        affects_income_statement: true,
                        affects_balance_sheet: false
                    });
                }
            });
        }

        // Final summary recalc
        consolidatedFinancials.gross_profit = new Decimal(consolidatedFinancials.revenue).plus(consolidatedFinancials.cogs).toNumber();
        consolidatedFinancials.ebitda = new Decimal(consolidatedFinancials.gross_profit).plus(consolidatedFinancials.operating_expenses).toNumber();
        consolidatedFinancials.net_income = consolidatedFinancials.ebitda;

        // STEP 3: Minority Interest Adjustment
        let minority_interest: MinorityInterest | null = null;
        if (scope.calculate_minority_interest && miDetails.length > 0) {
            onProgress("Minority Interest", 90, "Applying non-controlling interest adjustments...");

            minority_interest = {
                total_income: miTotalIncome.toNumber(),
                total_equity: miTotalEquity.toNumber(),
                details: miDetails
            };

            // Subtract Minority Income from Group Net Income
            consolidatedFinancials.net_income = new Decimal(consolidatedFinancials.net_income).minus(miTotalIncome).toNumber();
        }

        onProgress("Complete", 100, "Deterministic consolidation complete.");

        return {
            consolidation_id: scope.consolidation_id,
            consolidated_financials: consolidatedFinancials,
            entities_data: entitiesData,
            eliminations,
            minority_interest,
            validation: { passed: true, errors: [], warnings: [] },
            reconciliation: {},
            audit_trail_id: auditId
        };
    }
}

export const consolidationService = new ConsolidationEngineService();
