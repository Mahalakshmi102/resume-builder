import React, { useState } from 'react';
import { ResumeData, EvidenceItem, AnalysisResult } from '../types';
import { runFullResumeAnalysis, runFullResumeAnalysisSync } from '../services/aiService';
import { isResumeEmpty } from '../services/resumeAnalyzer';
import BeforeAfterCard from './BeforeAfterCard';
import {
  BarChart3, CheckCircle2, AlertTriangle, ArrowRight,
  ShieldCheck, Sparkles, Loader2, RefreshCw
} from 'lucide-react';

interface ReportsPageProps {
  resumeData: ResumeData;
  tailoredResume?: ResumeData | null;
  evidenceList: EvidenceItem[];
  onNavigateToBuilder: () => void;
  onNavigateToEvidence: () => void;
  onNavigateToMatcher?: () => void;
}

const ScoreRing: React.FC<{ score: number; label: string; color: string }> = ({ score, label, color }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center bg-white border-4 ${color}`}>
      <span className="text-lg font-black text-slate-900">{score}</span>
    </div>
    <span className="text-[11px] font-semibold text-slate-500 text-center leading-tight">{label}</span>
  </div>
);

const ReportsPage: React.FC<ReportsPageProps> = ({
  resumeData,
  tailoredResume,
  evidenceList,
  onNavigateToBuilder,
  onNavigateToEvidence,
  onNavigateToMatcher,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const isEmpty = isResumeEmpty(resumeData);

  // Local sync analysis
  const localAnalysis = runFullResumeAnalysisSync(
    resumeData,
    evidenceList,
    resumeData.targetRole || ''
  );

  const analysis = aiAnalysis || localAnalysis;

  const handleRunAIAnalysis = async () => {
    if (isEmpty) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await runFullResumeAnalysis(
        resumeData,
        evidenceList,
        resumeData.targetRole || ''
      );
      setAiAnalysis(result);
    } catch (err: any) {
      setAnalysisError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate dynamic before/after cards from user's actual projects
  const beforeAfterExamples = (resumeData.projects || [])
    .filter((p) => p.title && p.description && p.description.length > 20)
    .slice(0, 2)
    .map((p) => ({
      skillName: p.title,
      beforeText: p.description.split('.')[0] + '.',
      afterText: p.description,
    }));

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
              Resume Intelligence Report
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {isEmpty
                ? 'Upload a resume to generate comprehensive ATS compatibility and evidence reports.'
                : aiAnalysis
                ? 'AI analysis complete. Metrics reflect verified resume content and evidence.'
                : 'Showing local analysis. Run AI Analysis for deeper insights.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleRunAIAnalysis}
              disabled={analyzing || isEmpty}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {analyzing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : aiAnalysis ? (
                <RefreshCw size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {analyzing ? 'Analyzing…' : aiAnalysis ? 'Re-analyze' : 'Run AI Analysis'}
            </button>
            <button
              onClick={onNavigateToBuilder}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              Go to Builder <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Analysis Error */}
        {analysisError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            ⚠️ {analysisError}
          </div>
        )}

        {/* Tailored Resume Notice */}
        {tailoredResume && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm text-indigo-800">
              <strong>Tailored resume active</strong> — Report reflects your Master Resume.
              Your tailored version for <strong>{tailoredResume.targetRole}</strong> is ready in Builder.
            </div>
            {onNavigateToMatcher && (
              <button
                onClick={onNavigateToMatcher}
                className="ml-4 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0"
              >
                View Match →
              </button>
            )}
          </div>
        )}

        {/* Score Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Target Role</span>
            <div className="text-sm font-extrabold text-blue-600 truncate">{resumeData.targetRole || 'Not set'}</div>
            <p className="text-[11px] text-slate-500">Selected target</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Strong Areas</span>
            <div className="text-3xl font-extrabold text-emerald-600">{isEmpty ? 0 : (analysis.strengths?.length || 0)}</div>
            <p className="text-[11px] text-slate-500">Verified strengths</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Action Items</span>
            <div className="text-3xl font-extrabold text-amber-600">{isEmpty ? 0 : (analysis.improvements?.length || 0)}</div>
            <p className="text-[11px] text-slate-500">Improvement steps</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Skill Gaps</span>
            <div className="text-3xl font-extrabold text-rose-600">{isEmpty ? 0 : (analysis.missingKeywords?.length || 0)}</div>
            <p className="text-[11px] text-slate-500">Missing keywords</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Evidence %</span>
            <div className="text-3xl font-extrabold text-blue-600">{isEmpty ? 0 : (analysis.evidenceCoverage || 0)}%</div>
            <p className="text-[11px] text-slate-500">Verified proof</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Overall Score</span>
            <div className="text-3xl font-extrabold text-slate-900">{isEmpty ? 0 : (analysis.score || 0)}%</div>
            <p className="text-[11px] text-slate-500">Composite score</p>
          </div>
        </div>

        {/* Score Rings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5">Score Breakdown</h3>
          <div className="flex flex-wrap gap-6 justify-around">
            <ScoreRing score={isEmpty ? 0 : (analysis.atsScore || 0)} label="ATS Score" color="border-blue-400" />
            <ScoreRing score={isEmpty ? 0 : (analysis.roleAlignment || 0)} label="Role Alignment" color="border-indigo-400" />
            <ScoreRing score={isEmpty ? 0 : (analysis.skillCoverage || 0)} label="Skill Coverage" color="border-emerald-400" />
            <ScoreRing score={isEmpty ? 0 : (analysis.evidenceCoverage || 0)} label="Evidence" color="border-amber-400" />
            <ScoreRing score={isEmpty ? 0 : (analysis.projectStrength || 0)} label="Projects" color="border-violet-400" />
          </div>
        </div>

        {/* AI Summary */}
        {analysis.summary && !isEmpty && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl text-white space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Resume Intelligence Summary
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{analysis.summary}</p>
          </div>
        )}

        {/* Action Items List */}
        {analysis.improvements && analysis.improvements.length > 0 && !isEmpty && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recommended Improvements
            </h3>
            <ul className="space-y-2.5">
              {analysis.improvements.map((imp, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                  <span className="font-bold text-blue-600 shrink-0">{idx + 1}.</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Before / After Impact Cards */}
        {beforeAfterExamples.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Project Statement Enhancements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {beforeAfterExamples.map((ex, idx) => (
                <BeforeAfterCard
                  key={idx}
                  skillName={ex.skillName}
                  beforeText={ex.beforeText}
                  afterText={ex.afterText}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportsPage;
