import React, { useState } from 'react';
import { X, Sparkles, Wand2, Loader2, CheckCircle2, Target, FileText } from 'lucide-react';
import { ResumeData } from '../types';
import { generateTailoredRoleResume } from '../services/aiService';

interface GenerateJobResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResume: ResumeData;
  onGenerated: (tailored: ResumeData) => void;
}

const GenerateJobResumeModal: React.FC<GenerateJobResumeModalProps> = ({
  isOpen,
  onClose,
  currentResume,
  onGenerated,
}) => {
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState(currentResume.targetRole || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setStepIndex(1);

    const stepTimer1 = setTimeout(() => setStepIndex(2), 600);
    const stepTimer2 = setTimeout(() => setStepIndex(3), 1200);

    try {
      const generated = await generateTailoredRoleResume(
        currentResume,
        targetRole.trim() || 'Software Engineer',
        jobDescription.trim()
      );

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setStepIndex(4);

      setTimeout(() => {
        onGenerated(generated);
        setIsGenerating(false);
        onClose();
      }, 500);
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsGenerating(false);
      setError(err.message || 'Failed to generate tailored resume. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles size={20} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Generate from Job Description</h3>
              <p className="text-xs text-blue-100">Automatically builds and tailors your resume for any target job</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Target Role (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <Target size={14} className="text-blue-600" /> Target Role / Job Title (Optional)
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Developer, Full Stack Engineer, Data Analyst"
              disabled={isGenerating}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all disabled:opacity-60"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText size={14} className="text-blue-600" /> Job Description / Requirements *
            </label>
            <textarea
              required
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description, qualifications, and required tech stack here..."
              disabled={isGenerating}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-none leading-relaxed disabled:opacity-60 font-sans"
            />
          </div>

          {/* Stepper Status during Generation */}
          {isGenerating && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span>AI Resume Tailoring in progress…</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-center pt-1">
                <div className={`p-1.5 rounded-lg border font-medium ${stepIndex >= 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                  1. Parse JD
                </div>
                <div className={`p-1.5 rounded-lg border font-medium ${stepIndex >= 2 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                  2. Extract Skills
                </div>
                <div className={`p-1.5 rounded-lg border font-medium ${stepIndex >= 3 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                  3. Align Projects
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Updates your resume fields and live preview instantly
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || !jobDescription.trim()}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Wand2 size={14} /> Generate Resume
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateJobResumeModal;
