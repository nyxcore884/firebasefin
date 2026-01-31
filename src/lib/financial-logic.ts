import { FinancialNode, FinancialHierarchy } from "../types/structure";

/**
 * Calculates variance between actual and budget.
 */
export const calculateVariance = (budget: number, actual: number): number => {
    return actual - budget;
};

/**
 * Recursively calculates totals for a node based on its children.
 * If a node has children, its value is the sum of its children's values.
 * If a node has no children, its value is preserved (leaf node).
 */
export const aggregateNode = (node: FinancialNode): FinancialNode => {
    if (!node.children || node.children.length === 0) {
        // Leaf node: ensure variance is correct
        return {
            ...node,
            value: {
                ...node.value,
                variance: calculateVariance(node.value.budget, node.value.actual)
            }
        };
    }

    // Process children first (bottom-up aggregation)
    const aggregatedChildren = node.children.map(aggregateNode);

    // Sum up values from children
    const totalBudget = aggregatedChildren.reduce((sum, child) => sum + child.value.budget, 0);
    const totalActual = aggregatedChildren.reduce((sum, child) => sum + child.value.actual, 0);

    return {
        ...node,
        children: aggregatedChildren,
        value: {
            budget: totalBudget,
            actual: totalActual,
            variance: calculateVariance(totalBudget, totalActual)
        }
    };
};

/**
 * Validates the fundamental accounting equation: Assets = Liabilities + Equity
 */
export interface BalanceSheetValidationResult {
    isValid: boolean;
    diff: number;
    assetsTotal: number;
    liabilitiesTotal: number;
    equityTotal: number;
}

export const validateBalanceSheet = (financials: FinancialHierarchy): BalanceSheetValidationResult => {
    // Ensure we are working with aggregated values
    const aggAssets = aggregateNode(financials.assets);
    const aggLiabilities = aggregateNode(financials.liabilities);
    const aggEquity = aggregateNode(financials.equity);

    const assetsTotal = aggAssets.value.actual;
    const liabilitiesTotal = aggLiabilities.value.actual;
    const equityTotal = aggEquity.value.actual;

    const diff = assetsTotal - (liabilitiesTotal + equityTotal);
    // Allow for small floating point errors if necessary, but financial systems usually require exact matches.
    // Using a tiny epsilon for safety in JS numbers.
    const isValid = Math.abs(diff) < 0.01;

    return {
        isValid,
        diff,
        assetsTotal,
        liabilitiesTotal,
        equityTotal
    };
};
