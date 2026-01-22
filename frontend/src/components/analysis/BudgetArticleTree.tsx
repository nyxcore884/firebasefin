import React, { useState, useEffect } from 'react';
import { TreeView, TreeItem } from '@/components/ui/tree-view';
import { VarianceDataItem } from '@/pages/Analysis';

interface BudgetArticleTreeProps {
    data: VarianceDataItem[];
    expanded?: boolean;
}

interface TreeNode {
    id: string;
    label: string;
    children: TreeNode[];
    data?: VarianceDataItem;
}

export function BudgetArticleTree({ data, expanded = false }: BudgetArticleTreeProps) {
    // Transform flat data into category-based hierarchy
    const buildTree = (items: VarianceDataItem[]): TreeNode[] => {
        const groups = items.reduce((acc, item) => {
            const category = item.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as Record<string, VarianceDataItem[]>);

        const rootChildren: TreeNode[] = Object.entries(groups).map(([category, groupItems], idx) => ({
            id: `cat-${idx}`,
            label: category,
            children: groupItems.map(item => ({
                id: `item-${item.id}`,
                label: `${item.article} (${item.id})`,
                children: [],
                data: item
            }))
        }));

        return [{
            id: 'root',
            label: `Budget Articles (FY ${new Date().getFullYear() + 1})`,
            children: rootChildren
        }];
    };

    const treeData = buildTree(data);

    // Recursive Tree Rendering Helper
    const renderTree = (nodes: TreeNode[]) => {
        return nodes.map((node) => (
            <TreeItem
                key={node.id}
                nodeId={node.id}
                label={node.label}
                // Force fully expanded if "expanded" prop is true, otherwise let component handle it
                isOpen={expanded || undefined}
            >
                {node.children.length > 0 && renderTree(node.children)}
            </TreeItem>
        ));
    };

    return (
        <TreeView>
            {renderTree(treeData)}
        </TreeView>
    );
}
