import React from 'react';
import { ResumeData, EvidenceItem } from '../types';
import { runFullResumeAnalysisSync } from '../services/aiService';
import BeforeAfterCard from './BeforeAfterCard';
import { BarChart3, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface ReportsPageProps {
  resumeData: ResumeData;
  evidenceList: EvidenceItem[];
  onNavigateToBuilder: () => void;
  onNavigateToEvidence: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({
  resumeData,
  evidenceList,
  onNavigateToBuilder,
  onNavigateToEvidence,
}) => {
  const analysis = runFullResumeAnalysisSync(
    resumeData,
    evidenceList,
    resumeData.targetRole || 'Frontend Developer'
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <BarChart3 size={16} /> Final Intelligence Output
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Resume Improvement Report
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Comprehensive report detailing profile strengths, evidence coverage, and actionable recommendations.
            </p>
          </div>
          <button
            onClick={onNavigateToBuilder}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
          >
            Apply Fixes in Builder <ArrowRight size={16} />
          </button>
        </div>

        {/* Report Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Target Role</span>
            <div className="text-sm font-extrabold text-blue-600 truncate">{resumeData.targetRole || 'Frontend Dev'}</div>
            <p className="text-[11px] text-slate-500">Selected target</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Strong Areas</span>
            <div className="text-3xl font-extrabold text-emerald-600">5</div>
            <p className="text-[11px] text-slate-500">Verified strengths</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Needs Improvement</span>
            <div className="text-3xl font-extrabold text-amber-600">4</div>
            <p className="text-[11px] text-slate-500">Action items</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Missing Skills</span>
            <div className="text-3xl font-extrabold text-rose-600">3</div>
            <p className="text-[11px] text-slate-500">Key JD gaps</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Evidence Coverage</span>
            <div className="text-3xl font-extrabold text-blue-600">{analysis.evidenceCoverage}%</div>
            <p className="text-[11px] text-slate-500">Verified proof ratio</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Overall Analysis</span>
            <div className="text-3xl font-extrabold text-slate-900">{analysis.score}%</div>
            <p className="text-[11px] text-slate-500">Composite score</p>
          </div>
        </div>

        {/* Actionable Recommendations List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-600" /> Prioritized Actionable Recommendations
          </h3>

          <div className="space-y-3">
            {analysis.improvements.map((rec, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{rec}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Recommended to boost evidence index and role match percentage.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onNavigateToEvidence}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold rounded-lg shrink-0 transition-colors"
                >
                  Fix Item →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* BEFORE vs AFTER Transformation Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" /> Hackathon Before vs After Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Demonstrating how AI Evidence Optimization transforms generic resumes into evidence-backed profiles.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <BeforeAfterCard
              skillName="ExamVerse Project"
              beforeText="Built a quiz website using React."
              afterText="Developed a React-based competitive quiz platform with Supabase integration, real-time multiplayer functionality, and automated score tracking."
            />
            <BeforeAfterCard
              skillName="ResumeArchitect Platform"
              beforeText="Created a resume builder application."
              afterText="Architected a high-performance AI resume builder & career intelligence platform with 7 dynamic resume templates, instant ATS compatibility analysis, and evidence-backed skill verification."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
