// EmptyResumeState.tsx
// Shown when no resume is uploaded yet.
// Offers two clean choices: Upload existing PDF/DOCX (primary) or Start from Scratch.
// No demo data or hardcoded values.
import React, { useRef, useState } from 'react';
import { FileText, Upload, PlusCircle, ArrowRight, ShieldCheck, Cpu, CheckCircle } from 'lucide-react';
import { ResumeData } from '../types';
import { analyzePDFResumeAPI } from '../services/apiClient';
import { parseResumeTextClient, readFileContent } from '../services/resumeParser';

export const BLANK_RESUME: ResumeData = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  summary: '',
  targetRole: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  templateId: 'modern',
  sections: {
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
  },
};

interface Props {
  onStartBlank: () => void;
  onUploadParsed: (data: ResumeData) => void;
}

const EmptyResumeState: React.FC<Props> = ({ onStartBlank, onUploadParsed }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await analyzePDFResumeAPI(file);
      if (result?.parsedResume) {
        onUploadParsed({ ...BLANK_RESUME, ...result.parsedResume });
      } else {
        // Fallback to client reader
        const text = await readFileContent(file);
        if (text && text.trim().length > 20) {
          const parsed = parseResumeTextClient(text);
          onUploadParsed({ ...BLANK_RESUME, ...parsed });
        } else {
          setUploadError('Could not extract text from this file. Please ensure it is a text-based PDF or Word document.');
        }
      }
    } catch (err: any) {
      try {
        const text = await readFileContent(file);
        if (text && text.trim().length > 20) {
          const parsed = parseResumeTextClient(text);
          onUploadParsed({ ...BLANK_RESUME, ...parsed });
          return;
        }
      } catch { /* ignore */ }

      setUploadError(err.message || 'Upload failed. Please ensure the file is a valid PDF or DOCX.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="h-full overflow-y-auto flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl w-full py-6">

        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/25 mb-4 sm:mb-5">
            <FileText size={32} className="text-white" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Welcome to Resume<span className="text-blue-600">Architect</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Upload your resume to instantly populate the AI analyzer, job matcher, skill evidence engine, and interactive resume builder.
          </p>
        </div>

        {/* Primary Action: Drag and Drop Upload Card */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`relative p-8 sm:p-10 bg-white border-2 border-dashed rounded-3xl transition-all text-center cursor-pointer shadow-sm hover:shadow-xl ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 shadow-blue-500/10'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
          } ${uploading ? 'opacity-70 pointer-events-none' : ''}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-105">
            {uploading ? (
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={32} />
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1.5">
            {uploading ? 'Parsing and Analyzing Resume…' : 'Upload Your Existing Resume'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
            Drag & drop your PDF or Word document (.docx) here, or click to browse files.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all">
            {uploading ? 'Extracting Content…' : 'Select PDF or DOCX File'}
            <ArrowRight size={16} />
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>✓ Text-based PDF & DOCX</span>
            <span>✓ Up to 10MB</span>
            <span>✓ 100% Confidential</span>
          </div>
        </div>

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-start gap-2.5 shadow-sm">
            <span className="shrink-0 text-base">⚠️</span>
            <div className="flex-1 text-xs sm:text-sm">{uploadError}</div>
            <button onClick={(e) => { e.stopPropagation(); setUploadError(null); }} className="font-bold text-slate-400 hover:text-slate-600">×</button>
          </div>
        )}

        {/* Secondary Option: Start Blank */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 mb-2">Prefer building manually without an existing file?</p>
          <button
            onClick={onStartBlank}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle size={15} className="text-slate-500" />
            <span>Start from Scratch with Blank Form</span>
          </button>
        </div>

        {/* Features Highlights */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <Cpu size={18} />
            </div>
            <p className="text-xs font-bold text-slate-800">Instant AI Extraction</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Parses sections, skills, work experience & projects</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck size={18} />
            </div>
            <p className="text-xs font-bold text-slate-800">Skill Evidence Engine</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Validates claims against GitHub & project artifacts</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle size={18} />
            </div>
            <p className="text-xs font-bold text-slate-800">7 Interactive Templates</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Export clean, ATS-compliant PDF & Word files</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmptyResumeState;
