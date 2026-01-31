import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResponseRendererProps {
    response: {
        answer: string;
        visualizations?: any[];
        confidence?: number;
        reasoning_path?: string[];
        explanations?: string[];
    };
}

export const ResponseRenderer: React.FC<ResponseRendererProps> = ({ response }) => {
    return (
        <div className="space-y-4">
            {/* Confidence Indicator */}
            {response.confidence !== undefined && response.confidence > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                            style={{ width: `${response.confidence * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                        {Math.round(response.confidence * 100)}% confident
                    </span>
                </div>
            )}

            {/* Reasoning Path (The Nervous System) */}
            {response.reasoning_path && response.reasoning_path.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        Reasoning Path
                    </h4>
                    <div className="space-y-1.5 pl-4 border-l border-indigo-500/30">
                        {response.reasoning_path.map((step, i) => (
                            <div key={i} className="text-[11px] text-slate-400 flex items-start gap-2">
                                <span className="text-indigo-500 font-bold shrink-0">{i + 1}.</span>
                                <span>{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Deterministic Findings (The Skeleton) */}
            {response.explanations && response.explanations.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Deterministic Findings
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5 pl-4">
                        {response.explanations.map((finding, i) => (
                            <div key={i} className="px-3 py-1.5 bg-emerald-500/5 rounded border border-emerald-500/20 text-[11px] text-emerald-50/70 border-l-2 border-l-emerald-500">
                                {finding}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                    components={{
                        code(props) {
                            const { inline, className, children, ...rest } = props as any;
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    {...rest}
                                    style={vscDarkPlus as any}
                                    language={match[1]}
                                    PreTag="div"
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-400" {...rest}>
                                    {children}
                                </code>
                            );
                        },
                        table(props) {
                            const { children } = props;
                            return (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border border-white/10 rounded-lg overflow-hidden">
                                        {children}
                                    </table>
                                </div>
                            );
                        },
                        th(props) {
                            const { children } = props;
                            return (
                                <th className="bg-white/5 px-4 py-2 text-left text-xs font-semibold text-slate-300 border-b border-white/10">
                                    {children}
                                </th>
                            );
                        },
                        td(props) {
                            const { children } = props;
                            return (
                                <td className="px-4 py-2 text-sm text-slate-400 border-b border-white/5">
                                    {children}
                                </td>
                            );
                        },
                        ul(props) {
                            const { children } = props;
                            return <ul className="list-disc list-inside space-y-1 text-slate-300">{children}</ul>;
                        },
                        ol(props) {
                            const { children } = props;
                            return <ol className="list-decimal list-inside space-y-1 text-slate-300">{children}</ol>;
                        },
                        p(props) {
                            const { children } = props;
                            return <p className="text-slate-300 leading-relaxed mb-3">{children}</p>;
                        },
                        h1(props) {
                            const { children } = props;
                            return <h1 className="text-xl font-bold text-white mb-2">{children}</h1>;
                        },
                        h2(props) {
                            const { children } = props;
                            return <h2 className="text-lg font-bold text-white mb-2">{children}</h2>;
                        },
                        h3(props) {
                            const { children } = props;
                            return <h3 className="text-base font-bold text-white mb-2">{children}</h3>;
                        },
                        blockquote(props) {
                            const { children } = props;
                            return (
                                <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-slate-400">
                                    {children}
                                </blockquote>
                            );
                        },
                        a(props) {
                            const { href, children } = props;
                            return (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-400 hover:text-indigo-300 underline"
                                >
                                    {children}
                                </a>
                            );
                        },
                    }}
                >
                    {response.answer}
                </ReactMarkdown>
            </div>

            {/* Visualizations - Tables and Charts */}
            {response.visualizations && response.visualizations.length > 0 && (
                <div className="space-y-4">
                    {response.visualizations.map((viz, index) => (
                        <div
                            key={index}
                            className="p-4 bg-white/5 rounded-xl border border-white/10"
                        >
                            {viz.type === 'table' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border border-white/10">
                                        <thead>
                                            <tr>
                                                {viz.columns?.map((col: string, i: number) => (
                                                    <th key={i} className="bg-white/5 px-4 py-2 text-left text-xs font-semibold text-slate-300 border-b border-white/10">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viz.data?.map((row: any, rowIndex: number) => (
                                                <tr key={rowIndex}>
                                                    {viz.columns?.map((col: string, colIndex: number) => (
                                                        <td key={colIndex} className="px-4 py-2 text-sm text-slate-400 border-b border-white/5">
                                                            {row[col]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {viz.type === 'chart' && viz.chart_type === 'line' && (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={viz.data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis
                                                dataKey={viz.x_axis || 'name'}
                                                stroke="#94a3b8"
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                style={{ fontSize: '12px' }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid #334155',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            {viz.series?.map((s: string, i: number) => (
                                                <Line
                                                    key={i}
                                                    type="monotone"
                                                    dataKey={s}
                                                    stroke={['#6366f1', '#8b5cf6', '#06b6d4'][i % 3]}
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {viz.type === 'chart' && viz.chart_type === 'bar' && (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={viz.data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis
                                                dataKey={viz.x_axis || 'name'}
                                                stroke="#94a3b8"
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                style={{ fontSize: '12px' }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid #334155',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            {viz.series?.map((s: string, i: number) => (
                                                <Bar
                                                    key={i}
                                                    dataKey={s}
                                                    fill={['#6366f1', '#8b5cf6', '#06b6d4'][i % 3]}
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {!viz.type && (
                                <>
                                    <p className="text-xs text-slate-500 mb-2">
                                        Visualization {index + 1}
                                    </p>
                                    <pre className="text-xs text-slate-400">
                                        {JSON.stringify(viz, null, 2)}
                                    </pre>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
