import {
  FileText, Cpu, Target, ShieldCheck, BarChart3,
  Download, Printer, Menu, X, Loader2, Save, Upload, RotateCcw, Sparkles, Bot
} from 'lucide-react';
import { ResumeData } from '../types';
import { analyzePDFResumeAPI } from '../services/apiClient';
import { parseResumeTextClient, readFileContent } from '../services/resumeParser';

export type NavTab = 'builder' | 'analyzer' | 'matcher' | 'rehearsal' | 'evidence' | 'reports';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onUploadResume: (data: ResumeData) => void;
  onClearResume?: () => void;
  onDownloadWord: () => void;
  onDownloadPDF: () => void;
  onPrint: () => void;
  onSave?: () => void;
  onOpenGenerateJobModal?: () => void;
  activeProfileName?: string;
  isSaving?: boolean;
  hasTailored?: boolean;
  onDiscardTailored?: () => void;
  onApplyTailoredAsMaster?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onUploadResume,
  onClearResume,
  onDownloadWord,
  onDownloadPDF,
  onPrint,
  onSave,
  onOpenGenerateJobModal,
  activeProfileName = '',
  isSaving = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems: { id: NavTab; label: string; icon: any }[] = [
    { id: 'builder', label: 'Builder', icon: FileText },
    { id: 'analyzer', label: 'AI Analyzer', icon: Cpu },
    { id: 'matcher', label: 'Job Matcher', icon: Target },
    { id: 'rehearsal', label: 'AI Rehearsal', icon: Bot },
    { id: 'evidence', label: 'Evidence', icon: ShieldCheck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await analyzePDFResumeAPI(file);
      if (result?.parsedResume) {
        onUploadResume(result.parsedResume);
      } else {
        // Fallback to client reader
        const text = await readFileContent(file);
        if (text && text.trim().length > 20) {
          const parsed = parseResumeTextClient(text);
          onUploadResume(parsed);
        } else {
          setUploadError('Could not read resume text from this file.');
        }
      }
    } catch (err: any) {
      // Try local text parse fallback
      try {
        const text = await readFileContent(file);
        if (text && text.trim().length > 20) {
          const parsed = parseResumeTextClient(text);
          onUploadResume(parsed);
          return;
        }
      } catch { /* ignore */ }

      setUploadError(err.message || 'Failed to upload and parse resume.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center">
              <FileText size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                Resume<span className="text-blue-600">Architect</span>
              </span>
              <span className="hidden sm:inline-block ml-2.5 px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold text-[10px] rounded-full border border-blue-200 uppercase tracking-wide">
                Evidence AI
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Header Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Generate from Job Description Button */}
            {onOpenGenerateJobModal && (
              <button
                onClick={onOpenGenerateJobModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                title="Generate or tailor resume from job description"
              >
                <Sparkles size={14} className="text-yellow-300" />
                <span>Generate from JD</span>
              </button>
            )}

            {/* Upload Resume Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
              title="Upload PDF or DOCX Resume"
            >
              {isUploading ? (
                <Loader2 size={14} className="animate-spin text-blue-600" />
              ) : (
                <Upload size={14} className="text-blue-600" />
              )}
              {isUploading ? 'Parsing…' : 'Upload Resume'}
            </button>

            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                title="Save changes"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin text-emerald-600" />
                ) : (
                  <Save size={14} className="text-emerald-600" />
                )}
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            )}

            {onClearResume && (
              <button
                onClick={onClearResume}
                className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
                title="Start with new resume"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}

            {/* Export Actions */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <button
                onClick={onDownloadWord}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Export Word Document (.doc)"
              >
                <Download size={14} /> Word
              </button>
              <button
                onClick={onDownloadPDF}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Export Direct PDF"
              >
                <FileText size={14} /> PDF
              </button>
              <button
                onClick={onPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                title="Print or Vector PDF"
              >
                <Printer size={14} /> Print
              </button>
            </div>

            {/* Candidate Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div
                className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200"
                title={activeProfileName || 'No profile loaded'}
              >
                {activeProfileName && activeProfileName.trim().length > 0
                  ? activeProfileName.trim().charAt(0).toUpperCase()
                  : '👤'}
              </div>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-xs font-semibold flex items-center gap-1"
            >
              <Upload size={14} /> {isUploading ? 'Parsing…' : 'Upload'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Upload error banner if any */}
      {uploadError && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-xs text-red-700 flex items-center justify-between">
          <span>⚠️ {uploadError}</span>
          <button onClick={() => setUploadError(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onDownloadWord}
                className="py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg text-center"
              >
                Word
              </button>
              <button
                onClick={onDownloadPDF}
                className="py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg text-center"
              >
                PDF
              </button>
              <button
                onClick={onPrint}
                className="py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg text-center"
              >
                Print
              </button>
            </div>
            {onClearResume && (
              <button
                onClick={() => {
                  onClearResume();
                  setMobileMenuOpen(false);
                }}
                className="py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg text-center"
              >
                Reset Resume
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
