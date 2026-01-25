import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import React from 'react';

export function SmartLineEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data
}: EdgeProps) {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Determine color based on data type if provided, or default
    const edgeType = (data?.type as string) || 'default';

    let edgeColor = '#64748b'; // Default slate
    let strokeWidth = 2;
    let animationClass = '';

    switch (edgeType) {
        case 'data':
            edgeColor = '#0ea5e9'; // Blue
            strokeWidth = 2;
            animationClass = 'animate-pulse-slow'; // We can add CSS for this later or use SVG animate
            break;
        case 'ai':
            edgeColor = '#a855f7'; // Purple
            strokeWidth = 3;
            break;
        case 'alert':
            edgeColor = '#f59e0b'; // Amber
            strokeWidth = 2;
            break;
    }

    return (
        <>
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{ ...style, stroke: edgeColor, strokeWidth, filter: 'url(#glow)', opacity: 0.6 }}
            />
            {/* Flying particles for active flows - enhanced visibility */}
            <circle r="2.5" fill={edgeColor} filter="url(#glow)">
                <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
            </circle>
            <circle r="1.5" fill="white" opacity="0.8">
                <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
            </circle>
        </>
    );
}
