import React, { useState, useRef } from 'react';
import { ResumeData, EvidenceItem, AnalysisResult } from '../types';
import { runFullResumeAnalysisSync, runFullResumeAnalysis } from '../services/aiService';
import { analyzePDFResumeAPI, checkBackendHealth } from '../services/apiClient';
import { Cpu, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight, ShieldCheck, BarChart2, Loader2, X, Eye } from 'lucide-react';
import { parseResumeTextClient, readFileContent } from '../services/resumeParser';

interface AIAnalyzerProps {
  resumeData: ResumeData;
  evidenceList: EvidenceItem[];
  onOpenWhyThisSkill: (skillName: string) => void;
  onNavigateToJobMatcher: () => void;
  onNavigateToEvidence: () => void;
  onUpdateResume?: (newResume: ResumeData) => void;
  onNavigateToBuilder?: () => void;
}

const AIAnalyzer: React.FC<AIAnalyzerProps> = ({
  resumeData,
  evidenceList,
  onOpenWhyThisSkill,
  onNavigateToJobMatcher,
  onNavigateToEvidence,
  onUpdateResume,
  onNavigateToBuilder,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(() =>
    runFullResumeAnalysisSync(resumeData, evidenceList, resumeData.targetRole || 'Frontend Developer')
  );
  const [activeTab, setActiveTab] = useState<'resume' | 'upload'>('resume');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfAnalyzing, setPdfAnalyzing] = useState(false);
  const [pdfResult, setPdfResult] = useState<{ analysis: AnalysisResult; extractedText: string; metadata: any; parsedResume?: ResumeData } | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [syncedToBuilder, setSyncedToBuilder] = useState(false);
  const [syncedName, setSyncedName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await runFullResumeAnalysis(
        resumeData,
        evidenceList,
        resumeData.targetRole || 'Frontend Developer'
      );
      setAnalysisResult(res);
    } catch (err) {
      console.error('[AIAnalyzer] Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    setPdfAnalyzing(true);
    setPdfError(null);
    setSyncedToBuilder(false);
    try {
      const backendOk = await checkBackendHealth();

      if (!backendOk) {
        // Backend offline — use client-side text extraction as fallback
        try {
          const { readFileContent } = await import('../services/resumeParser');
          const rawText = await readFileContent(pdfFile);
          if (rawText && rawText.trim().length > 30) {
            const parsed = parseResumeTextClient(rawText, resumeData.targetRole || 'Frontend Developer');
            if (onUpdateResume) {
              onUpdateResume(parsed);
              setSyncedToBuilder(true);
              setSyncedName(parsed.fullName);
              setPdfResult({
                analysis: { score: 0, atsScore: 0, roleAlignment: 0, skillCoverage: 0, evidenceCoverage: 0, projectStrength: 0, missingInformationScore: 0, summary: 'Backend offline — basic parsing only', strengths: [], weaknesses: [], missingKeywords: [], improvements: [], detectedSkills: [] },
                extractedText: rawText.substring(0, 500),
                metadata: { numpages: 1, wordCount: rawText.split(/\s+/).length, charCount: rawText.length },
                parsedResume: parsed,
              });
            }
            return;
          }
        } catch (clientErr) {
          // client parse also failed
        }
        setPdfError('Backend server is offline. Start it with: cd backend && npm run dev\n\nFor text-based TXT/JSON files, client-side parsing was attempted but failed. Please start the backend for full PDF support.');
        return;
      }

      const result = await analyzePDFResumeAPI(pdfFile, resumeData.targetRole || 'Frontend Developer');
      setPdfResult(result);

      // Auto-sync parsed resume into Resume Builder
      const parsed: ResumeData = result.parsedResume ||
        (result.extractedText
          ? parseResumeTextClient(result.extractedText, resumeData.targetRole || 'Frontend Developer')
          : { ...resumeData, fullName: pdfFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') }
        );

      if (parsed && onUpdateResume) {
        onUpdateResume(parsed);
        setSyncedToBuilder(true);
        setSyncedName(parsed.fullName);
      }
    } catch (err: any) {
      const msg = err?.message || 'Resume parsing failed. Please try another file.';
      if (msg.toLowerCase().includes('scanned') || msg.toLowerCase().includes('image-based')) {
        setPdfError('This PDF appears to be scanned or image-based and cannot be parsed. Please upload a text-based PDF or a .docx Word document.');
      } else if (msg.toLowerCase().includes('too large') || msg.toLowerCase().includes('maxfilesize')) {
        setPdfError('File is too large (max 10MB). Please compress the PDF or upload a smaller file.');
      } else if (msg.toLowerCase().includes('not supported') || msg.toLowerCase().includes('only pdf')) {
        setPdfError('Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx, .doc).');
      } else {
        setPdfError(msg);
      }
    } finally {
      setPdfAnalyzing(false);
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
              Analyze your resume, identify evidence gaps, and understand how well your profile matches your target role.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={16} className={analyzing ? 'animate-spin' : ''} />
              {analyzing ? 'Analyzing Profile...' : 'Analyze Resume'}
            </button>
          </div>
        </div>

        {/* Global Resume Synced Banner */}
        {syncedToBuilder && (
          <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="font-extrabold text-sm sm:text-base">
                  Uploaded Resume Synced with Resume Builder!
                </div>
                <div className="text-xs text-emerald-100 mt-0.5">
                  Candidate profile for <strong>{syncedName || resumeData.fullName}</strong> is now live in the Builder tab with 7 interactive templates and live preview.
                </div>
              </div>
            </div>
            {onNavigateToBuilder && (
              <button
                onClick={onNavigateToBuilder}
                className="w-full sm:w-auto px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <Eye size={15} />
                <span>Go to Resume Builder</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs w-fit">
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'resume' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1.5"><BarChart2 size={13} /> Analyze My Resume</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1.5"><Upload size={13} /> Upload Existing PDF</span>
          </button>
        </div>

        {/* PDF Upload Panel */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 mb-1">Upload Existing Resume (PDF / DOCX)</h2>
              <p className="text-sm text-slate-500">Upload a PDF or Word (.docx) resume. AI will extract all text, parse candidate details directly into your Resume Builder, and run a full analysis.</p>
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                pdfFile ? 'border-blue-400 bg-blue-50/40' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/20'
              }`}
            >
              {pdfFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText size={32} className="text-blue-600" />
                  <div className="text-left">
                    <div className="font-bold text-sm text-slate-900">{pdfFile.name}</div>
                    <div className="text-xs text-slate-500">
                      {(pdfFile.size / 1024).toFixed(1)} KB ·{' '}
                      {pdfFile.name.toLowerCase().endsWith('.docx') || pdfFile.name.toLowerCase().endsWith('.doc') ? 'Word Document' : 'PDF'}
                    </div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setPdfFile(null); setPdfResult(null); setPdfError(null); }} className="ml-4 text-slate-400 hover:text-red-500">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={36} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-600 text-sm">Click or drag to upload your resume</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX, or DOC · Max 10MB · Auto-imported to Builder</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0] || null; setPdfFile(f); setPdfResult(null); setPdfError(null); }} />
            </div>
            {pdfError && (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div><strong>Analysis Failed</strong><p className="mt-0.5">{pdfError}</p></div>
              </div>
            )}
            {pdfFile && !pdfResult && (
              <button onClick={handlePdfUpload} disabled={pdfAnalyzing}
                className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                {pdfAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Extracting & Syncing to Builder...</> : <><Sparkles size={16} /> Analyze & Load into Resume Builder</>}
              </button>
            )}
            {pdfResult && (
              <div className="space-y-4">
                {/* Resume Builder Sync Card */}
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-950">
                        Resume Imported & Live in Resume Builder!
                      </div>
                      <div className="text-xs text-emerald-700 mt-0.5">
                        Profile <strong>{syncedName || pdfResult.parsedResume?.fullName || resumeData.fullName}</strong> is now loaded into the Resume Builder with live preview and all 7 templates.
                      </div>
                    </div>
                  </div>
                  {onNavigateToBuilder && (
                    <button
                      onClick={onNavigateToBuilder}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
                    >
                      <Eye size={15} />
                      <span>View in Resume Builder</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 size={18} /> Analysis Complete — {pdfResult.metadata?.wordCount || 0} words extracted
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Overall Score', value: `${pdfResult.analysis.score}%` },
                    { label: 'ATS Score', value: `${pdfResult.analysis.atsScore}%` },
                    { label: 'Role Alignment', value: `${pdfResult.analysis.roleAlignment}%` },
                    { label: 'Evidence Coverage', value: `${pdfResult.analysis.evidenceCoverage}%` },
                    { label: 'Skill Coverage', value: `${pdfResult.analysis.skillCoverage}%` },
                    { label: 'Pages', value: `${pdfResult.metadata?.numpages || 1}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                      <div className="text-xl font-extrabold text-blue-700">{value}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-slate-700">{pdfResult.analysis.summary}</div>
                {pdfResult.analysis.improvements?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Key Improvements</h3>
                    {pdfResult.analysis.improvements.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <ArrowRight size={14} className="text-blue-500 mt-0.5 shrink-0" /><span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resume' && <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Upload size={16} className="text-blue-600" /> Upload / Select Resume
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Choose an existing profile or drag & drop a resume file to analyze.
              </p>

              {/* Drag & drop upload area — fully functional */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group relative ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                    : pdfFile
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300'
                }`}
                onClick={() => dropInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;

                  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                    setPdfFile(file);
                    setPdfResult(null);
                    setPdfError(null);
                    setActiveTab('upload');
                  } else if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
                    try {
                      const text = await readFileContent(file);
                      if (file.name.endsWith('.json')) {
                        const json = JSON.parse(text);
                        if (json.fullName && onUpdateResume) {
                          onUpdateResume(json);
                          setSyncedToBuilder(true);
                          setSyncedName(json.fullName);
                          return;
                        }
                      }
                      const parsed = parseResumeTextClient(text, resumeData.targetRole || 'Frontend Developer');
                      if (onUpdateResume) {
                        onUpdateResume(parsed);
                        setSyncedToBuilder(true);
                        setSyncedName(parsed.fullName);
                      }
                    } catch (err: any) {
                      setPdfError('Failed to parse file: ' + err.message);
                      setActiveTab('upload');
                    }
                  } else {
                    setPdfError('Please provide a .pdf, .txt, or .json resume file.');
                    setActiveTab('upload');
                  }
                }}
              >
                {isDragging ? (
                  <>
                    <Upload size={36} className="mx-auto text-blue-500 mb-2 animate-bounce" />
                    <p className="text-sm font-bold text-blue-700">Drop your resume here</p>
                  </>
                ) : pdfFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText size={28} className="text-emerald-600" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">{pdfFile.name}</p>
                      <p className="text-[11px] text-slate-500">{(pdfFile.size / 1024).toFixed(1)} KB · Ready to analyze & load</p>
                    </div>
                    <button
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); setPdfFile(null); setPdfResult(null); setPdfError(null); }}
                      className="ml-3 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <FileText size={32} className="mx-auto text-slate-400 group-hover:text-blue-600 transition-colors mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Drag & drop your resume here</p>
                    <p className="text-[11px] text-slate-400 mt-1">Supported: PDF, TXT, JSON (Max 5MB)</p>
                    <span className="inline-block mt-3 px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs group-hover:border-blue-300 transition-colors">
                      Browse Files
                    </span>
                  </>
                )}
                <input
                  ref={dropInputRef}
                  type="file"
                  accept=".pdf,.txt,.json"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0] || null;
                    if (!f) return;
                    if (f.name.endsWith('.json') || f.name.endsWith('.txt')) {
                      try {
                        const text = await readFileContent(f);
                        if (f.name.endsWith('.json')) {
                          const json = JSON.parse(text);
                          if (json.fullName && onUpdateResume) {
                            onUpdateResume(json);
                            setSyncedToBuilder(true);
                            setSyncedName(json.fullName);
                            return;
                          }
                        }
                        const parsed = parseResumeTextClient(text, resumeData.targetRole || 'Frontend Developer');
                        if (onUpdateResume) {
                          onUpdateResume(parsed);
                          setSyncedToBuilder(true);
                          setSyncedName(parsed.fullName);
                        }
                      } catch (err: any) {
                        setPdfError('Failed to parse file: ' + err.message);
                        setActiveTab('upload');
                      }
                    } else {
                      setPdfFile(f);
                      setPdfResult(null);
                      setPdfError(null);
                      setActiveTab('upload');
                    }
                  }}
                />
              </div>
              {pdfFile && activeTab === 'resume' && (
                <button
                  onClick={() => { setActiveTab('upload'); if (!pdfResult) handlePdfUpload(); }}
                  className="w-full mt-2 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} /> Analyze Uploaded PDF
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Active Profile:</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {resumeData.fullName || 'Joshva Rahul'}
              </span>
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ATS Compatibility</span>
              <div className="text-3xl font-extrabold text-blue-600">
                {analysisResult?.atsScore || 82}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1">Standard parse success</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role Alignment</span>
              <div className="text-3xl font-extrabold text-slate-900">
                {analysisResult?.roleAlignment || 71}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1">{resumeData.targetRole || 'Frontend Dev'}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skill Coverage</span>
              <div className="text-3xl font-extrabold text-slate-900">
                {analysisResult?.skillCoverage || 78}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1">Target skills present</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evidence Coverage</span>
              <div className="text-3xl font-extrabold text-emerald-600">
                {analysisResult?.evidenceCoverage || 64}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1">Skills with proof</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Strength</span>
              <div className="text-3xl font-extrabold text-slate-900">
                {analysisResult?.projectStrength || 76}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1">GitHub & complexity</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Missing Information</span>
              <div className="text-3xl font-extrabold text-amber-600">
                {analysisResult?.missingInformationScore || 21}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1">Gaps needing detail</p>
            </div>
          </div>
        </div>

        {/* Resume Overview & Detected Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resume Quick Overview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-blue-600" /> Resume Profile Summary
            </h3>
            <div className="space-y-3 text-xs text-slate-700 font-medium">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Full Name</span>
                <span className="font-bold text-slate-900">{resumeData.fullName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Target Role</span>
                <span className="font-bold text-blue-600">{resumeData.targetRole || 'Frontend Developer'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Education</span>
                <span className="font-semibold text-slate-900">{resumeData.education[0]?.degree || 'B.Tech IT'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Projects</span>
                <span className="font-semibold text-slate-900">{resumeData.projects.length} Projects Listed</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Certifications</span>
                <span className="font-semibold text-slate-900">{(resumeData.certifications || []).length} Verified</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onNavigateToJobMatcher}
                className="w-full py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
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
                  <ShieldCheck size={16} className="text-emerald-600" /> Detected Skills & Evidence Status
                </h3>
                <p className="text-xs text-slate-500">Click any skill to see system explainability rationale.</p>
              </div>
              <button
                onClick={onNavigateToEvidence}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Manage Evidence →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysisResult?.detectedSkills.map((sk) => (
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
                      {sk.proofCount > 0 ? `${sk.proofCount} Evidence Item(s)` : 'No direct project link'}
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
          </div>
        </div>

        {/* Strengths & Weak Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" /> Profile Strengths
            </h3>
            <ul className="space-y-2">
              {analysisResult?.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" /> Evidence Gaps & Opportunities
            </h3>
            <ul className="space-y-2">
              {analysisResult?.weaknesses.map((weak, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>{weak}</span>
                </li>
              ))}
              </ul>
          </div>
        </div>
        </>}
      </div>
    </div>
  );
};

export default AIAnalyzer;
