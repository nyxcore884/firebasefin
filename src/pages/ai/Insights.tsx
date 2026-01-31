import React, { useEffect, useState } from 'react';
import {
  Sparkles, TrendingUp, AlertOctagon,
  Lightbulb, ArrowRight, Activity, MoreHorizontal,
  ThumbsUp, ThumbsDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { aiService, Insight } from '../../services/aiService';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export const Insights: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await aiService.getInsights('org_demo');
      setInsights(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'warning': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'anomaly': return <AlertOctagon />;
      case 'trend': return <TrendingUp />;
      case 'opportunity': return <Lightbulb />;
      default: return <Activity />;
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">

      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-bold flex items-center gap-3 mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 lowercase">
            <Sparkles className="text-indigo-400" size={32} />
            ai insights
          </h3>
          <h6 className="text-slate-400 font-normal lowercase">
            proactive anomaly detection and strategic opportunities.
          </h6>
        </div>
        <Button
          variant="outline"
          onClick={loadInsights}
          className="rounded-xl border-white/10 text-slate-300 hover:text-white hover:border-white/20 hover:bg-white/5 normal-case gap-2"
        >
          <Activity size={18} />
          refresh scan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className="glass-card p-6 rounded-[24px] relative overflow-hidden group hover:bg-white/5 transition-all cursor-pointer border border-white/5 hover:border-indigo-500/30 bg-slate-900/40"
              onClick={() => setSelectedInsight(insight)}
            >
              <div className={`absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-20 transition-opacity -mt-2 -mr-2`}>
                <div className={`w-24 h-24 rounded-full blur-3xl ${insight.severity === 'critical' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
              </div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${getSeverityColor(insight.severity)}`}>
                  {getIcon(insight.category)}
                </div>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-white/10">
                  <MoreHorizontal size={20} />
                </Button>
              </div>

              <h6 className="font-bold text-slate-200 mb-2 relative z-10 text-lg lowercase">
                {insight.title}
              </h6>

              <p className="text-slate-400 mb-4 line-clamp-2 h-[40px] relative z-10 text-sm lowercase">
                {insight.description}
              </p>

              {insight.impact && (
                <Badge
                  variant="outline"
                  className="bg-slate-800 text-slate-300 font-mono text-xs border border-white/10 mb-6 lowercase hover:bg-slate-800 rounded-md"
                >
                  {insight.impact}
                </Badge>
              )}

              <div className="border-t border-white/10 pt-4 flex items-center text-indigo-400 font-bold text-sm group-hover:translate-x-1 transition-transform relative z-10 lowercase">
                view analysis <ArrowRight size={16} className="ml-2" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Sheet */}
      <Sheet open={Boolean(selectedInsight)} onOpenChange={(open) => !open && setSelectedInsight(null)}>
        <SheetContent className="glass-sidebar w-[500px] sm:max-w-[500px] border-l border-white/10 p-0 text-white bg-slate-950/90 backdrop-blur-xl">
          {selectedInsight && (
            <div className="h-full flex flex-col">
              <SheetHeader className="p-6 border-b border-white/10 bg-white/5 flex flex-row justify-between items-center space-y-0">
                <div className={`flex items-center gap-3 px-3 py-1 rounded-full border ${getSeverityColor(selectedInsight.severity)}`}>
                  {getIcon(selectedInsight.category)}
                  <span className="text-xs font-bold tracking-wider lowercase">{selectedInsight.category}</span>
                </div>
                {/* Close button is handled by SheetContent automatically, but we can keep semantic header structure */}
                <SheetTitle className="sr-only">Insight Details</SheetTitle>
                <SheetDescription className="sr-only">Details about the selected insight</SheetDescription>
              </SheetHeader>

              <div className="p-8 flex-grow overflow-y-auto">
                <h4 className="font-bold mb-4 leading-tight text-2xl lowercase">{selectedInsight.title}</h4>

                <div className="bg-slate-950/50 p-6 rounded-xl border border-white/10 mb-8">
                  <p className="text-slate-300 text-lg leading-relaxed lowercase">
                    {selectedInsight.description}
                  </p>
                  {selectedInsight.impact && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3 lowercase">
                      <Activity className="text-rose-400" size={20} />
                      <span className="font-bold text-white">impact: {selectedInsight.impact}</span>
                    </div>
                  )}
                </div>

                <h6 className="font-bold mb-3 flex items-center gap-2 lowercase text-lg">
                  <Lightbulb size={20} className="text-amber-400" />
                  recommended action
                </h6>
                <div className="mb-8 pl-4 border-l-2 border-indigo-500">
                  <p className="text-slate-300 mb-4 lowercase">{selectedInsight.action}</p>
                  <Button className="bg-indigo-600 hover:bg-indigo-500 shadow-vivid text-white font-bold rounded-lg px-6 normal-case">
                    execute action
                  </Button>
                </div>

                <span className="text-slate-500 font-bold uppercase tracking-wider mb-2 block text-xs">root cause analysis</span>
                <div className="h-40 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-slate-500 mb-8 lowercase">
                  [chart visualization placeholder]
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5">
                <span className="text-center block text-slate-500 mb-3 lowercase">was this insight helpful?</span>
                <div className="flex justify-center gap-4">
                  <Button variant="ghost" size="icon" className="border border-white/10 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-transparent">
                    <ThumbsUp size={20} />
                  </Button>
                  <Button variant="ghost" size="icon" className="border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-transparent">
                    <ThumbsDown size={20} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div >
  );
};
