import React, { useState } from 'react';
import { ResumeData, EvidenceItem, JobDescriptionMatch } from '../types';
import { runJobMatchAnalysisSync, runJobMatchAnalysis, generateTailoredRoleResume } from '../services/aiService';
import { sampleJobDescriptions } from '../services/demoData';
import { Target, Sparkles, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Wand2, ShieldCheck } from 'lucide-react';
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
  const [targetRole, setTargetRole] = useState(resumeData.targetRole || 'Frontend Developer');
  const [jobDescription, setJobDescription] = useState(sampleJobDescriptions[0].text);
  const [matchResult, setMatchResult] = useState<JobDescriptionMatch | null>(() =>
    runJobMatchAnalysisSync(sampleJobDescriptions[0].text, 'Frontend Developer', resumeData, evidenceList)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepperStep, setStepperStep] = useState<number>(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [generatedResumeForModal, setGeneratedResumeForModal] = useState<ResumeData | null>(null);

  const handleAnalyzeJob = async () => {
    const res = await runJobMatchAnalysis(jobDescription, targetRole, resumeData, evidenceList);
    setMatchResult(res);
  };

  const handleLoadSampleJD = async (jdId: string) => {
    const sample = sampleJobDescriptions.find((s) => s.id === jdId);
    if (sample) {
      setTargetRole(sample.title);
      setJobDescription(sample.text);
      const res = await runJobMatchAnalysis(sample.text, sample.title, resumeData, evidenceList);
      setMatchResult(res);
    }
  };

  const handleGenerateRoleResume = async () => {
    setIsGenerating(true);
    setStepperStep(1);
    setTimeout(() => setStepperStep(2), 400);
    setTimeout(() => setStepperStep(3), 800);
    setTimeout(async () => {
      setStepperStep(4);
      const updated = await generateTailoredRoleResume(resumeData, targetRole, jobDescription);
      // Open Template Picker instead of directly applying
      setGeneratedResumeForModal(updated);
      setShowTemplateModal(true);
      setIsGenerating(false);
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
              Job Description Matcher & Role Generator
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Compare your evidence-backed profile against target job postings and generate a tailored role-aligned resume.
            </p>
          </div>
          <div>
            <button
              onClick={handleGenerateRoleResume}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <Wand2 size={16} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Tailoring Resume...' : 'Generate Role-Based Resume'}
            </button>
          </div>
        </div>

        {/* Stepper Progress Bar when generating */}
        {isGenerating && (
          <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-xl space-y-4 animate-in fade-in duration-300">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-200">
              Role-Based Generation Stepper
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div className={`p-3 rounded-xl border text-center ${stepperStep >= 1 ? 'bg-blue-600 border-blue-400 font-bold' : 'bg-blue-950/60 border-blue-800 text-blue-400'}`}>
                1. Analyze JD
              </div>
              <div className={`p-3 rounded-xl border text-center ${stepperStep >= 2 ? 'bg-blue-600 border-blue-400 font-bold' : 'bg-blue-950/60 border-blue-800 text-blue-400'}`}>
                2. Match Skills
              </div>
              <div className={`p-3 rounded-xl border text-center ${stepperStep >= 3 ? 'bg-blue-600 border-blue-400 font-bold' : 'bg-blue-950/60 border-blue-800 text-blue-400'}`}>
                3. Select Content
              </div>
              <div className={`p-3 rounded-xl border text-center ${stepperStep >= 4 ? 'bg-blue-600 border-blue-400 font-bold' : 'bg-blue-950/60 border-blue-800 text-blue-400'}`}>
                4. Generate Resume
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
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Data Analyst">Data Analyst / Python Dev</option>
                <option value="Software Engineer">Software Engineer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preset Sample Job Descriptions
              </label>
              <div className="flex flex-col gap-2">
                {sampleJobDescriptions.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleLoadSampleJD(sample.id)}
                    className="py-2 px-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 text-left transition-all"
                  >
                    Load {sample.title} JD
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyzeJob}
              className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Analyze Job Match
            </button>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Paste Target Job Description
            </label>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job posting text here..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>
        </div>

        {/* Job Match Analysis Summary */}
        {matchResult && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-blue-600">{matchResult.overallMatchScore}%</span>
                  <span className="text-[10px] font-bold text-blue-800 uppercase">Match Score</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{matchResult.targetRole} Match Analysis</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated against your evidence portfolio and resume profile.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-center">
                  <span className="block font-black text-base">{matchResult.matchedSkillsCount}</span>
                  <span className="text-[10px] font-bold uppercase">Supported</span>
                </div>
                <div className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-center">
                  <span className="block font-black text-base">{matchResult.partialMatchCount}</span>
                  <span className="text-[10px] font-bold uppercase">Limited</span>
                </div>
                <div className="px-3 py-1.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-center">
                  <span className="block font-black text-base">{matchResult.missingSkillsCount}</span>
                  <span className="text-[10px] font-bold uppercase">Missing</span>
                </div>
              </div>
            </div>

            {/* Skill Gap Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* SUPPORTED */}
              <div className="bg-white p-6 rounded-2xl border border-emerald-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Supported Skills ({matchResult.skillGaps.supported.length})
                </h3>
                <ul className="space-y-2">
                  {matchResult.skillGaps.supported.map((s) => (
                    <li
                      key={s}
                      onClick={() => onOpenWhyThisSkill(s)}
                      className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 flex items-center justify-between cursor-pointer hover:bg-emerald-100/50 transition-colors"
                    >
                      <span className="font-bold text-xs text-emerald-950">{s}</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                        View Proof →
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* LIMITED EVIDENCE */}
              <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600" /> Limited Evidence ({matchResult.skillGaps.limited.length})
                </h3>
                <ul className="space-y-2">
                  {matchResult.skillGaps.limited.map((s) => (
                    <li
                      key={s}
                      onClick={() => onOpenWhyThisSkill(s)}
                      className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-colors"
                    >
                      <span className="font-bold text-xs text-amber-950">{s}</span>
                      <span className="text-[10px] font-semibold text-amber-700 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                        Attach Proof →
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* MISSING */}
              <div className="bg-white p-6 rounded-2xl border border-rose-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-2">
                  <XCircle size={16} className="text-rose-600" /> Missing Skills ({matchResult.skillGaps.missing.length})
                </h3>
                <ul className="space-y-2">
                  {matchResult.skillGaps.missing.map((s) => (
                    <li key={s} className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/60 flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-950">{s}</span>
                      <span className="text-[10px] font-semibold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200">
                        Action Required
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detailed Skill Match Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" /> Skill Match Breakdown & Rationale
              </h3>

              <div className="space-y-3">
                {matchResult.matchedSkills.map((item) => (
                  <div
                    key={item.skill}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{item.skill}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.status === 'Supported'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Limited Evidence'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.explanation}</p>
                    </div>

                    {item.evidenceFound.length > 0 && (
                      <div className="text-[11px] text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                        Proof: {item.evidenceFound.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Template Selection Modal — opens after role-based resume generation */}
    <TemplateSelectModal
      isOpen={showTemplateModal}
      generatedResume={generatedResumeForModal}
      onSelectTemplate={() => {}}
      onUseAndOpenBuilder={(resume) => {
        onApplyRoleBasedResume(resume);
        setShowTemplateModal(false);
        setGeneratedResumeForModal(null);
        setStepperStep(0);
      }}
      onClose={() => {
        setShowTemplateModal(false);
        setGeneratedResumeForModal(null);
        setStepperStep(0);
      }}
    />
    </>
  );
};

export default JobMatcher;
