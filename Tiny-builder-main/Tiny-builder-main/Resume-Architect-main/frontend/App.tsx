import React, { useState } from 'react';
import { NavTab } from './components/Navbar';
import Navbar from './components/Navbar';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import AIAnalyzer from './components/AIAnalyzer';
import JobMatcher from './components/JobMatcher';
import EvidencePage from './components/EvidencePage';
import ReportsPage from './components/ReportsPage';
import WhyThisSkillModal from './components/WhyThisSkillModal';
import GenerateJobResumeModal from './components/GenerateJobResumeModal';
import { useResume, BLANK_RESUME } from './contexts/ResumeContext';
import { ResumeData } from './types';
import { isResumeEmpty } from './services/resumeAnalyzer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('builder');
  const [whySkillModalName, setWhySkillModalName] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);

  const {
    masterResume,
    tailoredResume,
    activeResume,
    evidenceList,
    isSaving,
    isLoading,
    lastSavedAt,
    saveError,
    hasLoadedOnce,
    setMasterResume,
    setTailoredResume,
    addEvidence,
    saveNow,
    discardTailored,
    applyTailoredAsMaster,
    clearResume,
  } = useResume();

  // ── Initial loading skeleton while reading state ────────────
  if (isLoading || !hasLoadedOnce) {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 animate-pulse">
          <div className="w-8 h-8 bg-slate-200 rounded-xl" />
          <div className="w-36 h-5 bg-slate-200 rounded-lg" />
          <div className="flex-1" />
          <div className="w-24 h-8 bg-slate-200 rounded-lg" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-400">Loading ResumeArchitect…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── PDF export ──────────────────────────────────────────────
  const downloadPDF = () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;
    if (typeof (window as any).html2pdf !== 'function') {
      window.print();
      return;
    }
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.cssText = 'transform:none;box-shadow:none;margin:0;padding:0;width:210mm;min-height:297mm;';
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
    container.appendChild(clone);
    document.body.appendChild(container);
    const safeName = ((activeResume || masterResume).fullName || 'resume').replace(/\s+/g, '_');
    const suffix = tailoredResume ? `_${(tailoredResume.targetRole || 'tailored').replace(/\s+/g, '_')}` : '';
    try {
      (window as any).html2pdf().from(clone).set({
        margin: 0,
        filename: `${safeName}${suffix}_resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).save().then(() => {
        if (document.body.contains(container)) document.body.removeChild(container);
      }).catch(() => {
        if (document.body.contains(container)) document.body.removeChild(container);
        window.print();
      });
    } catch {
      if (document.body.contains(container)) document.body.removeChild(container);
      window.print();
    }
  };

  // ── Word export ─────────────────────────────────────────────
  const downloadWord = () => {
    const styles = Array.from(document.querySelectorAll('style')).map((s) => s.innerHTML).join('\n');
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset="utf-8"><title>Resume</title><style>${styles}\nbody{font-family:'Inter',Arial,sans-serif;}\n@page{size:A4;margin:1.5cm;}\n</style></head><body>`;
    const el = document.getElementById('resume-preview');
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header + (el?.innerHTML || '') + '</body></html>');
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = source;
    a.download = `${((activeResume || masterResume).fullName || 'resume').replace(/\s+/g, '_')}_resume.doc`;
    a.click();
    document.body.removeChild(a);
  };

  const handleBuilderChange = (data: ResumeData) => setMasterResume(data);

  return (
    <div className="h-full flex flex-col bg-slate-100 text-slate-900 font-sans">

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUploadResume={(parsed) => setMasterResume(parsed)}
        onClearResume={clearResume}
        onDownloadWord={downloadWord}
        onDownloadPDF={downloadPDF}
        onPrint={() => window.print()}
        onSave={saveNow}
        onOpenGenerateJobModal={() => setShowJobModal(true)}
        activeProfileName={(activeResume || masterResume).fullName}
        isSaving={isSaving}
        hasTailored={!!tailoredResume}
        onDiscardTailored={discardTailored}
        onApplyTailoredAsMaster={applyTailoredAsMaster}
      />

      {/* Tailored Resume Banner */}
      {tailoredResume && (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between no-print shadow-sm">
          <span>
            📋 Viewing tailored resume for <strong>{tailoredResume.targetRole || 'target role'}</strong>
            {' '}— your Master Resume is preserved.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={applyTailoredAsMaster}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors cursor-pointer"
            >
              Set as Master
            </button>
            <button
              onClick={discardTailored}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              Discard ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">

        {/* BUILDER */}
        {activeTab === 'builder' && (
          <div className="flex h-full">
            <div className="w-full md:w-1/2 lg:w-5/12 h-full z-10 no-print overflow-y-auto border-r border-slate-200">
              <ResumeForm
                data={masterResume}
                onChange={handleBuilderChange}
                onOpenEvidence={(skill) => setWhySkillModalName(skill || '')}
                onOpenJobModal={() => setShowJobModal(true)}
              />
            </div>
            <div className="hidden md:block w-1/2 lg:w-7/12 h-full bg-slate-200 relative overflow-hidden">
              <div className="absolute inset-0">
                <ResumePreview
                  data={tailoredResume || masterResume}
                  onSkillClick={(skill) => setWhySkillModalName(skill)}
                />
              </div>
            </div>
            <div className="hidden print-area">
              <ResumePreview data={tailoredResume || masterResume} isPrintView />
            </div>
          </div>
        )}

        {/* AI ANALYZER */}
        {activeTab === 'analyzer' && (
          <AIAnalyzer
            resumeData={masterResume}
            evidenceList={evidenceList}
            onOpenWhyThisSkill={(skill) => setWhySkillModalName(skill)}
            onNavigateToJobMatcher={() => setActiveTab('matcher')}
            onNavigateToEvidence={() => setActiveTab('evidence')}
            onUpdateResume={(newResume) => setMasterResume(newResume)}
            onNavigateToBuilder={() => setActiveTab('builder')}
          />
        )}

        {/* JOB MATCHER */}
        {activeTab === 'matcher' && (
          <JobMatcher
            resumeData={masterResume}
            evidenceList={evidenceList}
            onApplyRoleBasedResume={(tailored) => {
              setTailoredResume(tailored);
              setActiveTab('builder');
            }}
            onOpenWhyThisSkill={(skill) => setWhySkillModalName(skill)}
          />
        )}

        {/* EVIDENCE */}
        {activeTab === 'evidence' && (
          <EvidencePage
            resumeData={masterResume}
            evidenceList={evidenceList}
            onAddEvidence={addEvidence}
            onOpenWhyThisSkill={(skill) => setWhySkillModalName(skill)}
          />
        )}

        {/* REPORTS */}
        {activeTab === 'reports' && (
          <ReportsPage
            resumeData={masterResume}
            tailoredResume={tailoredResume}
            evidenceList={evidenceList}
            onNavigateToBuilder={() => setActiveTab('builder')}
            onNavigateToEvidence={() => setActiveTab('evidence')}
            onNavigateToMatcher={() => setActiveTab('matcher')}
          />
        )}
      </main>

      {/* Why This Skill Modal */}
      <WhyThisSkillModal
        skillName={whySkillModalName}
        onClose={() => setWhySkillModalName(null)}
        resumeData={activeResume || masterResume}
        evidenceList={evidenceList}
        targetRole={(activeResume || masterResume).targetRole || ''}
      />

      {/* Generate Resume from Job Description Modal */}
      <GenerateJobResumeModal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        currentResume={activeResume || masterResume}
        onGenerated={(tailored) => {
          setMasterResume(tailored);
          setActiveTab('builder');
        }}
      />
    </div>
  );
};

export default App;