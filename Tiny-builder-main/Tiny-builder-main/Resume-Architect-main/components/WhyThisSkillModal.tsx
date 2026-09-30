import React from 'react';
import { X, CheckCircle2, AlertCircle, HelpCircle, ShieldCheck, ExternalLink } from 'lucide-react';
import { ResumeData, EvidenceItem } from '../types';
import { getWhyThisSkill } from '../services/evidenceEngine';

interface WhyThisSkillModalProps {
  skillName: string | null;
  onClose: () => void;
  resumeData: ResumeData;
  evidenceList: EvidenceItem[];
  targetRole?: string;
}

const WhyThisSkillModal: React.FC<WhyThisSkillModalProps> = ({
  skillName,
  onClose,
  resumeData,
  evidenceList,
  targetRole = 'Frontend Developer',
}) => {
  if (!skillName) return null;

  const info = getWhyThisSkill(skillName, resumeData, evidenceList, targetRole);
  const isSupported = info.status === 'Evidence Supported';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide text-slate-200 uppercase">Explainable Resume</h3>
              <p className="text-xs text-slate-400">Why is this skill included?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Skill Title Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Target Skill</span>
              <h2 className="text-2xl font-bold text-slate-900">{info.skill}</h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isSupported
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isSupported ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {info.status}
            </span>
          </div>

          {/* Evidence Found Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Supporting Evidence Found</h4>
            <ul className="space-y-2.5">
              {info.evidenceFound.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Explanation Reason */}
          <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-600" /> System Analysis Reason
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              "{info.reason}"
            </p>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Proof Method: Prototype Evidence Check</span>
            <span className="font-mono text-slate-500">ID: EV-{Math.abs(skillName.length * 99)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhyThisSkillModal;
