import React, { useState } from 'react';
import { analyzeResume } from '../services/geminiService';
import { AnalysisResult } from '../types';
import { AlertCircle, CheckCircle2, Loader2, Target, ThumbsUp, ThumbsDown, ArrowRight, Key } from 'lucide-react';

const CVChecker: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDesc.trim()) {
      setError("Please provide both your resume text and the job description.");
      return;
    }
    
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await analyzeResume(resumeText, jobDesc);
      setResult(data);
    } catch (err) {
      setError("Failed to analyze resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AI CV Checker</h1>
          <p className="text-slate-600">Paste your resume and a job description to get a detailed match analysis.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Job Description</label>
              <textarea 
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                className="w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                placeholder="Paste the job description here..."
              />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Resume Content</label>
              <textarea 
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full h-48 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                placeholder="Paste your resume text here (Ctrl+A, Ctrl+C from your PDF)..."
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Analyze Match'}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-8">
                <Target size={48} className="mb-4 opacity-50" />
                <p>Results will appear here</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-primary">
                <Loader2 size={48} className="animate-spin mb-4" />
                <p className="animate-pulse">Analyzing your profile...</p>
              </div>
            )}

            {result && (
              <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
                
                {/* Score Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Match Score</h2>
                    <p className="text-slate-500 text-sm">Based on ATS keywords & relevance</p>
                  </div>
                  <div className={`relative w-20 h-20 flex items-center justify-center rounded-full border-4 font-bold text-2xl ${
                    result.score >= 70 ? 'border-green-500 text-green-600' : 
                    result.score >= 50 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'
                  }`}>
                    {result.score}%
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} className="text-primary" /> Executive Summary
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
                </div>

                 {/* Missing Keywords (New) */}
                 <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                   <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                     <Key size={18} /> Missing Keywords
                   </h3>
                   <div className="flex flex-wrap gap-2">
                      {result.missingKeywords && result.missingKeywords.length > 0 ? (
                        result.missingKeywords.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-white border border-orange-200 text-orange-700 text-sm rounded-full font-medium">
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-orange-600 italic">No critical missing keywords identified.</span>
                      )}
                   </div>
                 </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <ThumbsUp size={16} /> Strengths
                    </h3>
                    <ul className="space-y-2">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <CheckCircle2 size={14} className="mt-1 shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                    <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                      <ThumbsDown size={16} /> Weaknesses
                    </h3>
                    <ul className="space-y-2">
                      {result.weaknesses.map((w, i) => (
                        <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                          <AlertCircle size={14} className="mt-1 shrink-0" /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Improvements */}
                <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Target size={18} className="text-yellow-400" /> Recommended Improvements
                  </h3>
                  <ul className="space-y-3">
                    {result.improvements.map((imp, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-3">
                        <ArrowRight size={16} className="mt-0.5 text-primary shrink-0" /> {imp}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVChecker;