import React, { useState } from 'react';
import { ResumeData, EvidenceItem, JobDescriptionMatch } from '../types';
import { runJobMatchAnalysis, generateTailoredRoleResume } from '../services/aiService';
import { isResumeEmpty } from '../services/resumeAnalyzer';
import { Target, CheckCircle2, AlertTriangle, XCircle, Wand2, ShieldCheck, FileText } from 'lucide-react';
import TemplateSelectModal from './TemplateSelectModal';

interface JobMatcherProps {
  resumeData: ResumeData;
  evidenceList: EvidenceItem[];
  onApplyRoleBasedResume: (updatedResume: ResumeData) => void;
  onOpenWhyThisSkill: (skillName: string) => void;
}

const JobMatcher: React.FC<JobMatcherProps> = ({
  resumeData,
  evidenceList,
  onApplyRoleBasedResume,
  onOpenWhyThisSkill,
}) => {
  const [targetRole, setTargetRole] = useState(resumeData.targetRole || '');
  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState<JobDescriptionMatch | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepperStep, setStepperStep] = useState<number>(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [generatedResumeForModal, setGeneratedResumeForModal] = useState<ResumeData | null>(null);

  const isEmpty = isResumeEmpty(resumeData);

  const handleAnalyzeJob = async () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await runJobMatchAnalysis(jobDescription, targetRole, resumeData, evidenceList);
      setMatchResult(res);
    } catch (err) {
      console.error('[JobMatcher] Analyze error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRoleResume = async () => {
    if (!jobDescription.trim()) return;
    setIsGenerating(true);
    setStepperStep(1);
    setTimeout(() => setStepperStep(2), 400);
    setTimeout(() => setStepperStep(3), 800);
    setTimeout(async () => {
      setStepperStep(4);
      try {
        const updated = await generateTailoredRoleResume(resumeData, targetRole, jobDescription);
        setGeneratedResumeForModal(updated);
        setShowTemplateModal(true);
      } catch (err) {
        console.error('[JobMatcher] Failed to generate tailored resume:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 1200);
  };

  return (
    <>
      <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Target size={16} /> Role Optimization
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Job Description Matcher & Role Tailoring
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Compare your uploaded resume against target job requirements and tailor your summary and highlighted skills.
              </p>
            </div>
            <div>
              <button
                onClick={handleGenerateRoleResume}
                disabled={isGenerating || !jobDescription.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Wand2 size={16} className={isGenerating ? 'animate-spin' : ''} />
                {isGenerating ? 'Tailoring Resume…' : 'Generate Role-Based Resume'}
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar when generating */}
          {isGenerating && (
            <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-xl space-y-4 animate-in fade-in duration-300">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-200">
                Role-Based Generation Stepper
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className={`p-3 rounded-xl border text-center ${stepperStep >= 1 ? 'bg-blue-600 border-blue-400 font-bold' : 'bg-blue-950/60 border-blue-800 text-blue-400'}`}>
                  1. Parse Target JD
                </div>
                <div className={`p-3 rounded-xl border text-center ${stepperStep >= 2 ? 'bg-blue-600 border-blue-400 font-bold' : 'bg-blue-950/60 border-blue-800 text-blue-400'}`}>
                  2. Align Resume Skills
                </div>
                <div className={`p-3 rounded-xl border text-center ${stepperStep >= 3 ? 'bg-blue-600 border-blue-400 font-bold' : 'bg-blue-950/60 border-blue-800 text-blue-400'}`}>
                  3. Optimize Summary
                </div>
                <div className={`p-3 rounded-xl border text-center ${stepperStep >= 4 ? 'bg-blue-600 border-blue-400 font-bold' : 'bg-blue-950/60 border-blue-800 text-blue-400'}`}>
                  4. Apply Template
                </div>
              </div>
            </div>
          )}

          {/* Target Role & Job Description Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full Stack Engineer, Product Manager"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-600" /> Active Resume
                </span>
                <p>Candidate: <strong className="text-slate-900">{resumeData.fullName || 'None loaded'}</strong></p>
                <p>Skills listed: <strong className="text-slate-900">{(resumeData.skills || []).length}</strong></p>
                <p>Projects: <strong className="text-slate-900">{(resumeData.projects || []).length}</strong></p>
              </div>

              <button
                onClick={handleAnalyzeJob}
                disabled={isAnalyzing || !jobDescription.trim() || isEmpty}
                className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? 'Analyzing…' : 'Analyze Job Match'}
              </button>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Paste Job Description
              </label>
              <textarea
                rows={9}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description or requirements here to analyze how well your uploaded resume matches..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Match Analysis Results */}
          {matchResult ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Score Banner */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Match Compatibility</span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    Role Match: {matchResult.targetRole || targetRole || 'Target Role'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Based on keyword match against your uploaded skills and verified projects.
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-black text-blue-600">{matchResult.overallMatchScore}%</div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Match Score</span>
                  </div>
                  <div className="h-10 w-px bg-slate-200" />
                  <div className="text-center">
                    <div className="text-4xl font-black text-emerald-600">{matchResult.matchedSkillsCount}</div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Supported</span>
                  </div>
                  <div className="h-10 w-px bg-slate-200" />
                  <div className="text-center">
                    <div className="text-4xl font-black text-rose-600">{matchResult.missingSkillsCount}</div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Missing</span>
                  </div>
                </div>
              </div>

              {/* Matched Skills Breakdown */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Requirements Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {matchResult.matchedSkills.map((sk) => (
                    <div
                      key={sk.skill}
                      onClick={() => onOpenWhyThisSkill(sk.skill)}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                            {sk.skill}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{sk.explanation}</p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 border ${
                          sk.status === 'Supported'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : sk.status === 'Limited Evidence'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {sk.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
              <Target size={36} className="mx-auto text-slate-300" />
              <p className="font-semibold text-sm text-slate-600">No Job Description Analyzed Yet</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Paste a target job posting above and click <strong>Analyze Job Match</strong> to see compatibility scores and skill gaps.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Template Select Modal */}
      {showTemplateModal && generatedResumeForModal && (
        <TemplateSelectModal
          resumeData={generatedResumeForModal}
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSelectTemplate={(templateId) => {
            const finalResume = { ...generatedResumeForModal, templateId };
            onApplyRoleBasedResume(finalResume);
            setShowTemplateModal(false);
          }}
        />
      )}
    </>
  );
};

export default JobMatcher;
