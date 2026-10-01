import React, { useState } from 'react';
import { X, ShieldCheck, Plus, CheckCircle2, Github, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { EvidenceItem, EvidenceType } from '../types';
import { verifyGitHubEvidence } from '../services/aiService';

interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (evidence: EvidenceItem) => void;
  defaultSkill?: string;
}

const evidenceTypes: EvidenceType[] = [
  'GitHub Project',
  'Project',
  'Certification',
  'Assessment',
  'Internship',
  'Course',
  'Competition',
  'Achievement',
];

interface GitHubResult {
  isValid: boolean;
  evidenceStatus: EvidenceItem['status'];
  message: string;
  repoName?: string;
  language?: string;
  stars?: number;
  commitCount?: number;
  topics?: string[];
}

const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultSkill = '',
}) => {
  const [skill, setSkill] = useState(defaultSkill || '');
  const [type, setType] = useState<EvidenceType>('GitHub Project');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [scoreOrResult, setScoreOrResult] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // GitHub verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [ghResult, setGhResult] = useState<GitHubResult | null>(null);

  if (!isOpen) return null;

  const isGitHubType = type === 'GitHub Project';
  const isGitHubUrl = url.includes('github.com');

  const handleVerifyGitHub = async () => {
    if (!url.trim() || !isGitHubUrl) return;
    setIsVerifying(true);
    setGhResult(null);
    try {
      const result = await verifyGitHubEvidence(url.trim(), skill);
      setGhResult(result as GitHubResult);
      // Auto-fill title if empty
      if (!title && result.repoName) {
        setTitle(result.repoName);
      }
      // Auto-fill description from result
      if (result.message && !description) {
        setDescription(result.message);
      }
    } catch (err: any) {
      setGhResult({
        isValid: false,
        evidenceStatus: 'Limited Evidence',
        message: err.message || 'Verification failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill.trim() || !title.trim()) return;

    const resolvedStatus = ghResult?.evidenceStatus || 'Prototype Evidence Check';

    const newEvidence: EvidenceItem = {
      id: `ev-${Date.now()}`,
      skill: skill.trim(),
      type,
      title: title.trim(),
      url: url.trim() || undefined,
      description: description.trim() || 'Attached supporting evidence for technical validation.',
      scoreOrResult: scoreOrResult.trim() || undefined,
      date: date || undefined,
      status: resolvedStatus,
    };

    onSave(newEvidence);
    onClose();
  };

  const statusColor = (status: string) => {
    if (status === 'Strong Evidence') return 'bg-emerald-50 border-emerald-300 text-emerald-800';
    if (status === 'Supported') return 'bg-blue-50 border-blue-300 text-blue-800';
    if (status === 'Limited Evidence') return 'bg-amber-50 border-amber-300 text-amber-800';
    return 'bg-slate-50 border-slate-300 text-slate-700';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Add Skill Evidence</h3>
              <p className="text-xs text-slate-400">Connect your skill with a GitHub repo or certificate link.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

          {/* Skill Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Skill Name *
            </label>
            <input
              type="text"
              required
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. React.js, Python, SQL, REST API"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Evidence Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Evidence Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {evidenceTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setGhResult(null); }}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-xl border text-center transition-all ${
                    type === t
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* URL with GitHub Verify Button */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              URL / Link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setGhResult(null); }}
                placeholder="https://github.com/user/project"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
              {isGitHubUrl && (
                <button
                  type="button"
                  onClick={handleVerifyGitHub}
                  disabled={isVerifying}
                  className="shrink-0 px-3 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 disabled:opacity-60 flex items-center gap-1.5 transition-all"
                  title="Verify GitHub Repository"
                >
                  {isVerifying
                    ? <><Loader2 size={14} className="animate-spin" /> Checking</>
                    : <><Github size={14} /> Verify</>
                  }
                </button>
              )}
            </div>
            {/* GitHub Verification Result */}
            {ghResult && (
              <div className={`mt-2 p-3 rounded-xl border text-xs flex items-start gap-2 ${statusColor(ghResult.evidenceStatus)}`}>
                {ghResult.isValid
                  ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  : <AlertCircle size={14} className="shrink-0 mt-0.5" />
                }
                <div>
                  <div className="font-bold">{ghResult.evidenceStatus}</div>
                  <div className="mt-0.5 text-[11px] opacity-80">{ghResult.message}</div>
                  {ghResult.isValid && (
                    <div className="flex flex-wrap gap-2 mt-1.5 text-[11px]">
                      {ghResult.language && <span className="bg-white/60 px-2 py-0.5 rounded-full font-semibold">🔵 {ghResult.language}</span>}
                      {(ghResult.stars ?? 0) > 0 && <span className="bg-white/60 px-2 py-0.5 rounded-full font-semibold">⭐ {ghResult.stars}</span>}
                      {(ghResult.commitCount ?? 0) > 0 && <span className="bg-white/60 px-2 py-0.5 rounded-full font-semibold">📝 {ghResult.commitCount} commits</span>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Evidence Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GitHub Project Repository or Professional Certificate"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Score + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Score / Result (Optional)
              </label>
              <input
                type="text"
                value={scoreOrResult}
                onChange={(e) => setScoreOrResult(e.target.value)}
                placeholder="e.g. 98/100, Top 5%, Verified"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how this project or assessment proves your skill..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Verification Disclaimer */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-800">
            <ShieldCheck size={16} className="text-amber-600 shrink-0" />
            <span>
              {ghResult?.isValid
                ? <>Evidence will be saved as <strong>{ghResult.evidenceStatus}</strong> — verified via GitHub API.</>
                : <>This item will be saved with <strong className="font-semibold">Prototype Evidence Check</strong> label. Click <strong>Verify</strong> on a GitHub URL for real verification.</>
              }
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} /> Save Evidence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEvidenceModal;
