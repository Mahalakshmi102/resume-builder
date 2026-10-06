import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, EvidenceItem, AnalysisResult } from '../types';
import { runFullResumeAnalysisSync, runFullResumeAnalysis } from '../services/aiService';
import { analyzePDFResumeAPI } from '../services/apiClient';
import { parseResumeTextClient, readFileContent } from '../services/resumeParser';
import { isResumeEmpty } from '../services/resumeAnalyzer';
import {
  Cpu, FileText, CheckCircle2, AlertCircle, Sparkles,
  ArrowRight, ShieldCheck, Loader2, Upload, Mic
} from 'lucide-react';

interface AIAnalyzerProps {
  resumeData: ResumeData;
  evidenceList: EvidenceItem[];
  onOpenWhyThisSkill: (skillName: string) => void;
  onNavigateToJobMatcher: () => void;
  onNavigateToEvidence: () => void;
  onUpdateResume?: (newResume: ResumeData) => void;
  onNavigateToBuilder?: () => void;
  onNavigateToRehearsal?: () => void;
}

const AIAnalyzer: React.FC<AIAnalyzerProps> = ({
  resumeData,
  evidenceList,
  onOpenWhyThisSkill,
  onNavigateToJobMatcher,
  onNavigateToEvidence,
  onUpdateResume,
  onNavigateToRehearsal,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(() =>
    runFullResumeAnalysisSync(resumeData, evidenceList, resumeData.targetRole || '')
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEmpty = isResumeEmpty(resumeData);

  useEffect(() => {
    setAnalysisResult(
      runFullResumeAnalysisSync(resumeData, evidenceList, resumeData.targetRole || '')
    );
  }, [resumeData, evidenceList]);

  const handleRunAnalysis = async () => {
    if (isEmpty) return;
    setAnalyzing(true);
    try {
      const res = await runFullResumeAnalysis(
        resumeData,
        evidenceList,
        resumeData.targetRole || ''
      );
      setAnalysisResult(res);
    } catch (err) {
      console.error('[AIAnalyzer] Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const result = await analyzePDFResumeAPI(file);
      if (result?.parsedResume && onUpdateResume) {
        onUpdateResume(result.parsedResume);
      } else {
        const text = await readFileContent(file);
        if (text && text.trim().length > 20 && onUpdateResume) {
          const parsed = parseResumeTextClient(text);
          onUpdateResume(parsed);
        } else {
          setUploadError('Could not extract text from file.');
        }
      }
    } catch (err: any) {
      try {
        const text = await readFileContent(file);
        if (text && text.trim().length > 20 && onUpdateResume) {
          const parsed = parseResumeTextClient(text);
          onUpdateResume(parsed);
          return;
        }
      } catch { /* ignore */ }
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Strong Evidence':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Supported':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Limited Evidence':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Cpu size={16} /> Intelligence Layer
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Resume Analyzer
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Audit your resume for ATS parse compatibility, verified skills, and evidence coverage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {uploading ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <Upload size={16} />}
              {uploading ? 'Parsing File…' : 'Upload Resume'}
            </button>

            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || isEmpty}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles size={16} className={analyzing ? 'animate-spin' : ''} />
              {analyzing ? 'Auditing…' : 'Run AI Audit'}
            </button>
          </div>
        </div>

        {/* Empty State Banner if no resume is loaded */}
        {isEmpty && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">No Resume Loaded Yet</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Upload a PDF or Word (.docx) resume to populate all metrics, ATS audit scores, and verified skill items.
                </p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              Upload Resume (PDF/DOCX)
            </button>
          </div>
        )}

        {/* Upload error banner if any */}
        {uploadError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <span>⚠️ {uploadError}</span>
            <button onClick={() => setUploadError(null)} className="font-bold">×</button>
          </div>
        )}

        {/* Metrics Overview Cards (0 before upload) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ATS Score</span>
            <div className="text-3xl font-extrabold text-blue-600">
              {isEmpty ? 0 : (analysisResult?.atsScore || 0)}%
            </div>
            <p className="text-[10px] text-slate-500 font-medium pt-1">Standard parse success</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role Alignment</span>
            <div className="text-3xl font-extrabold text-slate-900">
              {isEmpty ? 0 : (analysisResult?.roleAlignment || 0)}%
            </div>
            <p className="text-[10px] text-slate-500 font-medium pt-1 truncate">{resumeData.targetRole || 'Not specified'}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Skill Coverage</span>
            <div className="text-3xl font-extrabold text-slate-900">
              {isEmpty ? 0 : (analysisResult?.skillCoverage || 0)}%
            </div>
            <p className="text-[10px] text-slate-500 font-medium pt-1">Target skills present</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evidence %</span>
            <div className="text-3xl font-extrabold text-emerald-600">
              {isEmpty ? 0 : (analysisResult?.evidenceCoverage || 0)}%
            </div>
            <p className="text-[10px] text-slate-500 font-medium pt-1">Skills with proof</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project Strength</span>
            <div className="text-3xl font-extrabold text-slate-900">
              {isEmpty ? 0 : (analysisResult?.projectStrength || 0)}%
            </div>
            <p className="text-[10px] text-slate-500 font-medium pt-1">GitHub & complexity</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Score</span>
            <div className="text-3xl font-extrabold text-indigo-600">
              {isEmpty ? 0 : (analysisResult?.score || 0)}%
            </div>
            <p className="text-[10px] text-slate-500 font-medium pt-1">Composite rating</p>
          </div>
        </div>

        {/* AI Rehearsal Callout Banner */}
        {!isEmpty && onNavigateToRehearsal && (
          <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-purple-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 text-purple-300 shadow-inner">
                <Mic size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30">Mock Interview</span>
                  <h3 className="font-extrabold text-base text-white">AI Rehearsal Mode</h3>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Let Gemini examine your resume's projects and skills to grill you with real-world interview questions and evaluate your responses.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToRehearsal}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-950 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Practice Mock Interview</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}


        {/* Profile Overview & Detected Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Profile Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-blue-600" /> Resume Profile
            </h3>
            <div className="space-y-3 text-xs text-slate-700 font-medium">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Candidate Name</span>
                <span className="font-bold text-slate-900">{resumeData.fullName || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Target Role</span>
                <span className="font-bold text-blue-600">{resumeData.targetRole || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Education</span>
                <span className="font-semibold text-slate-900">{resumeData.education?.[0]?.degree || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Experience</span>
                <span className="font-semibold text-slate-900">{(resumeData.experience || []).length} Position(s)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Projects</span>
                <span className="font-semibold text-slate-900">{(resumeData.projects || []).length} Project(s)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Certifications</span>
                <span className="font-semibold text-slate-900">{(resumeData.certifications || []).length} Verified</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onNavigateToJobMatcher}
                className="w-full py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Compare Against Job Description <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Detected Skills breakdown */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" /> Detected Skills & Evidence
                </h3>
                <p className="text-xs text-slate-500">Extracted strictly from your uploaded resume.</p>
              </div>
              <button
                onClick={onNavigateToEvidence}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                Manage Evidence →
              </button>
            </div>

            {(!analysisResult?.detectedSkills || analysisResult.detectedSkills.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No skills detected yet. Upload your resume to extract and verify skills.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {analysisResult.detectedSkills.map((sk) => (
                  <div
                    key={sk.name}
                    onClick={() => onOpenWhyThisSkill(sk.name)}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                        {sk.name}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {sk.proofCount > 0 ? `${sk.proofCount} Evidence Item(s)` : 'From resume skill section'}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${getStatusBadge(
                        sk.status
                      )}`}
                    >
                      {sk.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Strengths & Weak Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" /> Profile Strengths
            </h3>
            {(!analysisResult?.strengths || analysisResult.strengths.length === 0) ? (
              <p className="text-xs text-slate-400 py-3">No strengths generated yet. Upload a resume to evaluate.</p>
            ) : (
              <ul className="space-y-2">
                {analysisResult.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" /> Evidence Gaps & Opportunities
            </h3>
            {(!analysisResult?.weaknesses || analysisResult.weaknesses.length === 0) ? (
              <p className="text-xs text-slate-400 py-3">No gaps identified yet.</p>
            ) : (
              <ul className="space-y-2">
                {analysisResult.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                    <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIAnalyzer;
