import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BeforeAfterCardProps {
  beforeText?: string;
  afterText?: string;
  skillName?: string;
}

const BeforeAfterCard: React.FC<BeforeAfterCardProps> = ({
  beforeText = 'Built application features with modern web stack.',
  afterText = 'Engineered scalable production modules with measurable optimization and clean architecture.',
  skillName = 'Project Statement',
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">{skillName} Transformation</h3>
        </div>
        <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
          Role & Evidence Optimized
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BEFORE Card */}
        <div className="bg-rose-50/50 border border-rose-200/60 p-4 rounded-xl relative space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase rounded-md tracking-wider flex items-center gap-1">
              <AlertTriangle size={12} /> BEFORE
            </span>
            <span className="text-xs text-rose-600 font-medium">Generic Claim</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans pt-1">
            "{beforeText}"
          </p>
          <div className="text-[11px] text-rose-600/90 font-medium pt-1">
            ⚠️ Lacks tech stack details, metrics, and evidence proof.
          </div>
        </div>

        {/* AFTER Card */}
        <div className="bg-emerald-50/50 border border-emerald-200/60 p-4 rounded-xl relative space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase rounded-md tracking-wider flex items-center gap-1">
              <CheckCircle2 size={12} /> AFTER
            </span>
            <span className="text-xs text-emerald-700 font-semibold">Evidence-Backed</span>
          </div>
          <p className="text-xs text-slate-800 font-medium leading-relaxed font-sans pt-1">
            "{afterText}"
          </p>
          <div className="text-[11px] text-emerald-700 font-medium pt-1 flex items-center gap-1">
            ✓ Backed by GitHub Repo, React, Supabase & Realtime features.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterCard;
