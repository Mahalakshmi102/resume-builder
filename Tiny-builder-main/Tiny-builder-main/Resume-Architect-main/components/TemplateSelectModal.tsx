import React, { useState } from 'react';
import { X, Check, Layout, Download, Printer, ArrowRight, Sparkles } from 'lucide-react';
import { ResumeData } from '../types';
import ResumePreview from './ResumePreview';

type TemplateId = 'modern' | 'classic' | 'minimal' | 'sidebar' | 'executive' | 'creative' | 'developer';

interface TemplateSelectModalProps {
  isOpen: boolean;
  generatedResume: ResumeData | null;
  onSelectTemplate: (templateId: TemplateId) => void;
  onUseAndOpenBuilder: (resume: ResumeData) => void;
  onClose: () => void;
}

const TEMPLATES: { id: TemplateId; label: string; description: string; accent: string }[] = [
  { id: 'modern', label: 'Modern', description: 'Clean two-tone header, great for tech roles', accent: 'bg-blue-600' },
  { id: 'classic', label: 'Classic', description: 'Traditional layout, trusted by HR professionals', accent: 'bg-slate-700' },
  { id: 'minimal', label: 'Minimal', description: 'Ultra-clean, maximum whitespace, premium look', accent: 'bg-slate-400' },
  { id: 'sidebar', label: 'Sidebar', description: 'Two-column sidebar for dense skill-heavy CVs', accent: 'bg-indigo-600' },
  { id: 'executive', label: 'Executive', description: 'Bold and structured, ideal for leadership roles', accent: 'bg-slate-900' },
  { id: 'creative', label: 'Creative', description: 'Colourful gradient header, stands out visually', accent: 'bg-purple-600' },
  { id: 'developer', label: 'Developer', description: 'Dark sidebar, monospace accents, code-friendly', accent: 'bg-emerald-700' },
];

const TemplateSelectModal: React.FC<TemplateSelectModalProps> = ({
  isOpen,
  generatedResume,
  onSelectTemplate,
  onUseAndOpenBuilder,
  onClose,
}) => {
  const [selected, setSelected] = useState<TemplateId>('modern');

  if (!isOpen || !generatedResume) return null;

  const previewResume: ResumeData = { ...generatedResume, templateId: selected };

  const handleUse = () => {
    onUseAndOpenBuilder({ ...generatedResume, templateId: selected });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 rounded-xl">
              <Layout size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">Choose Your Template</h2>
              <p className="text-xs text-slate-400">
                Your role-based resume for <span className="text-blue-300 font-semibold">{generatedResume.targetRole || 'Frontend Developer'}</span> is ready. Select a layout.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* Left — Template Grid */}
          <div className="lg:w-72 xl:w-80 shrink-0 border-r border-slate-200 overflow-y-auto p-4 space-y-2 bg-slate-50">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
              7 Available Templates
            </p>

            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => { setSelected(tmpl.id); onSelectTemplate(tmpl.id); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  selected === tmpl.id
                    ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                {/* Color swatch */}
                <div className={`w-8 h-8 rounded-lg ${tmpl.accent} shrink-0 flex items-center justify-center`}>
                  <Layout size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-sm ${selected === tmpl.id ? 'text-blue-700' : 'text-slate-900'}`}>
                      {tmpl.label}
                    </span>
                    {selected === tmpl.id && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-white stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">{tmpl.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right — Live Preview */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Preview — {TEMPLATES.find(t => t.id === selected)?.label}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Role-optimized content · {selected} layout
              </span>
            </div>

            <div className="flex-1 overflow-auto bg-slate-200 p-4">
              <div
                className="mx-auto shadow-2xl"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  transform: 'scale(0.55)',
                  transformOrigin: 'top center',
                  marginBottom: '-280px',
                }}
              >
                <ResumePreview data={previewResume} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Check size={14} className="text-emerald-600" />
            <span>Role-based content has been applied to the selected template.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUse}
              className="px-6 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              Use {TEMPLATES.find(t => t.id === selected)?.label} Template
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectModal;
