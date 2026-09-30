import React, { useState } from 'react';
import { ResumeData, EvidenceItem } from './types';
import Navbar, { NavTab } from './components/Navbar';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import AIAnalyzer from './components/AIAnalyzer';
import JobMatcher from './components/JobMatcher';
import EvidencePage from './components/EvidencePage';
import ReportsPage from './components/ReportsPage';
import WhyThisSkillModal from './components/WhyThisSkillModal';
import { demoResumeData, demoEvidenceList } from './services/demoData';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('builder');
  const [resumeData, setResumeData] = useState<ResumeData>(demoResumeData);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(demoEvidenceList);
  const [whySkillModalName, setWhySkillModalName] = useState<string | null>(null);

  const handleLoadDemoProfile = () => {
    setResumeData(demoResumeData);
    setEvidenceList(demoEvidenceList);
  };

  const handleAddEvidence = (item: EvidenceItem) => {
    setEvidenceList((prev) => [item, ...prev]);
  };

  const handleApplyRoleBasedResume = (updated: ResumeData) => {
    setResumeData(updated);
    setActiveTab('builder');
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.boxShadow = 'none';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.width = '210mm';
    clone.style.minHeight = '297mm';

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.appendChild(clone);
    document.body.appendChild(container);

    const filename = `${resumeData.fullName.trim().replace(/\s+/g, '_') || 'resume'}_resume.pdf`;
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    // @ts-ignore
    window.html2pdf().from(clone).set(opt).save().then(() => {
      document.body.removeChild(container);
    }).catch((err: any) => {
      console.error('PDF export error:', err);
      document.body.removeChild(container);
    });
  };

  const downloadWord = () => {
    const styles = Array.from(document.querySelectorAll('style'))
      .map((style) => style.innerHTML)
      .join('\n');

    const header =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      '<head><meta charset="utf-8"><title>Resume</title><style>' +
      styles +
      "\nbody { font-family: 'Inter', Arial, sans-serif; }\n" +
      '@page { size: A4; margin: 1.5cm 1.5cm 1.5cm 1.5cm; }\n' +
      '</style></head><body>';
    const footer = '</body></html>';
    const previewEl = document.getElementById('resume-preview');
    const sourceHTML = header + (previewEl ? previewEl.innerHTML : '') + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement('a');
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${resumeData.fullName.trim().replace(/\s+/g, '_') || 'resume'}_resume.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 text-slate-900 font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLoadDemo={handleLoadDemoProfile}
        onDownloadWord={downloadWord}
        onDownloadPDF={downloadPDF}
        onPrint={handlePrint}
        activeProfileName={resumeData.fullName}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'builder' && (
          <div className="flex h-full">
            {/* Left: Form Input */}
            <div className="w-full md:w-1/2 lg:w-5/12 h-full z-10 no-print overflow-y-auto border-r border-slate-200">
              <ResumeForm
                data={resumeData}
                onChange={setResumeData}
                onOpenEvidence={(skill) => setWhySkillModalName(skill || 'React.js')}
              />
            </div>

            {/* Right: Live Preview */}
            <div className="hidden md:block w-1/2 lg:w-7/12 h-full bg-slate-200 relative overflow-hidden">
              <div className="absolute inset-0">
                <ResumePreview
                  data={resumeData}
                  onSkillClick={(skill) => setWhySkillModalName(skill)}
                />
              </div>
            </div>

            {/* Print-only View */}
            <div className="hidden print-area">
              <ResumePreview data={resumeData} />
            </div>
          </div>
        )}

        {activeTab === 'analyzer' && (
          <AIAnalyzer
            resumeData={resumeData}
            evidenceList={evidenceList}
            onOpenWhyThisSkill={(skill) => setWhySkillModalName(skill)}
            onNavigateToJobMatcher={() => setActiveTab('matcher')}
            onNavigateToEvidence={() => setActiveTab('evidence')}
            onUpdateResume={(newResume) => setResumeData(newResume)}
            onNavigateToBuilder={() => setActiveTab('builder')}
          />
        )}

        {activeTab === 'matcher' && (
          <JobMatcher
            resumeData={resumeData}
            evidenceList={evidenceList}
            onApplyRoleBasedResume={handleApplyRoleBasedResume}
            onOpenWhyThisSkill={(skill) => setWhySkillModalName(skill)}
          />
        )}

        {activeTab === 'evidence' && (
          <EvidencePage
            resumeData={resumeData}
            evidenceList={evidenceList}
            onAddEvidence={handleAddEvidence}
            onOpenWhyThisSkill={(skill) => setWhySkillModalName(skill)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsPage
            resumeData={resumeData}
            evidenceList={evidenceList}
            onNavigateToBuilder={() => setActiveTab('builder')}
            onNavigateToEvidence={() => setActiveTab('evidence')}
          />
        )}
      </main>

      {/* Explainable Resume Modal */}
      <WhyThisSkillModal
        skillName={whySkillModalName}
        onClose={() => setWhySkillModalName(null)}
        resumeData={resumeData}
        evidenceList={evidenceList}
        targetRole={resumeData.targetRole || 'Frontend Developer'}
      />
    </div>
  );
};

export default App;