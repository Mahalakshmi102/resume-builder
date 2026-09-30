import React, { useState } from 'react';
import { ResumeData, EvidenceItem, SkillEvidenceMapping, ResumeClaim } from '../types';
import { calculateSkillEvidenceMapping, verifyResumeClaims, getCareerMetrics } from '../services/evidenceEngine';
import AddEvidenceModal from './AddEvidenceModal';
import { ShieldCheck, Plus, CheckCircle2, AlertCircle, ExternalLink, HelpCircle, Layers, Award, FileCode, CheckSquare } from 'lucide-react';

interface EvidencePageProps {
  resumeData: ResumeData;
  evidenceList: EvidenceItem[];
  onAddEvidence: (item: EvidenceItem) => void;
  onOpenWhyThisSkill: (skillName: string) => void;
}

const EvidencePage: React.FC<EvidencePageProps> = ({
  resumeData,
  evidenceList,
  onAddEvidence,
  onOpenWhyThisSkill,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSkillForModal, setSelectedSkillForModal] = useState<string>('');

  const mappings: SkillEvidenceMapping[] = calculateSkillEvidenceMapping(
    resumeData.skills,
    resumeData.projects,
    resumeData.certifications,
    evidenceList
  );

  const claims: ResumeClaim[] = verifyResumeClaims(resumeData, evidenceList);
  const metrics = getCareerMetrics(resumeData, evidenceList);

  const handleOpenAddForSkill = (skillName?: string) => {
    setSelectedSkillForModal(skillName || '');
    setIsModalOpen(true);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck size={16} /> Main Differentiator
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Skill Evidence & Career Intelligence
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Connect your skills with supporting proof from GitHub repositories, coding assessments, certifications, and live projects.
            </p>
          </div>
          <button
            onClick={() => handleOpenAddForSkill()}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus size={16} /> Add Evidence
          </button>
        </div>

        {/* Career Evidence Dashboard Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Projects</span>
            <div className="text-2xl font-black text-slate-900">{metrics.totalProjects}</div>
            <p className="text-[10px] text-slate-500">Live & GitHub</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Certifications</span>
            <div className="text-2xl font-black text-slate-900">{metrics.totalCertifications}</div>
            <p className="text-[10px] text-slate-500">Verified courses</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Assessments</span>
            <div className="text-2xl font-black text-slate-900">{metrics.totalAssessments}</div>
            <p className="text-[10px] text-slate-500">Coding checks</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Evidence Skills</span>
            <div className="text-2xl font-black text-emerald-600">{metrics.evidenceBackedSkills}</div>
            <p className="text-[10px] text-slate-500">Strong/Supported</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Needs Evidence</span>
            <div className="text-2xl font-black text-amber-600">{metrics.skillsNeedingEvidence}</div>
            <p className="text-[10px] text-slate-500">Limited/Missing</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Role Matches</span>
            <div className="text-2xl font-black text-blue-600">{metrics.roleMatchesCount}</div>
            <p className="text-[10px] text-slate-500">Verified fits</p>
          </div>
        </div>

        {/* Skill Evidence Pipeline Visualization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Layers size={16} className="text-blue-600" /> Evidence Pipeline Mapping
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900 text-sm">1. Skill</div>
              <p className="text-slate-500 font-medium">React.js / JavaScript</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-emerald-700 text-sm">2. Evidence</div>
              <p className="text-slate-500 font-medium">ExamVerse GitHub Repo</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-blue-700 text-sm">3. Resume Claim</div>
              <p className="text-slate-500 font-medium font-mono text-[11px]">"Developed React App"</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900 text-sm">4. Target Role</div>
              <p className="text-slate-500 font-medium">Frontend Developer</p>
            </div>
          </div>
        </div>

        {/* Main Skill Evidence Table / Cards List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Your Skill Evidence Portfolio</h3>
              <p className="text-xs text-slate-500">Every skill status is computed from attached evidence items.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {mappings.length} Skills Tracked
            </span>
          </div>

          <div className="space-y-4">
            {mappings.map((item) => (
              <div
                key={item.skill}
                className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-base text-slate-900">{item.skill}</h4>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                        item.status === 'Strong Evidence'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'Supported'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : item.status === 'Limited Evidence'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddForSkill(item.skill)}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Proof
                    </button>
                    <button
                      onClick={() => onOpenWhyThisSkill(item.skill)}
                      className="px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <HelpCircle size={14} /> View Details
                    </button>
                  </div>
                </div>

                {/* Evidence items checklist */}
                <div className="space-y-1.5 pt-1">
                  {item.evidenceList.length > 0 ? (
                    item.evidenceList.map((ev) => (
                      <div
                        key={ev.id}
                        className="bg-white p-3 rounded-xl border border-slate-200/70 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800">{ev.title}</span>
                            <span className="ml-2 text-[10px] text-slate-500 font-semibold uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                              {ev.type}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{ev.description}</p>
                          </div>
                        </div>

                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 font-semibold text-[11px] shrink-0"
                          >
                            Link <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                      <span>No project or assessment evidence attached for {item.skill} yet.</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Claim Verification Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare size={16} className="text-blue-600" /> Resume Claims Verification
            </h3>
            <p className="text-xs text-slate-500">
              Evaluates technical claims for supporting evidence using neutral verification standards.
            </p>
          </div>

          <div className="space-y-3">
            {claims.map((cl) => (
              <div
                key={cl.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{cl.claim}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      cl.status === 'Supported'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {cl.status}
                  </span>
                </div>

                <div className="text-slate-600">
                  <span className="font-semibold text-slate-700">Suggested Wording:</span> "{cl.suggestedWording}"
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Evidence Modal */}
      <AddEvidenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onAddEvidence}
        defaultSkill={selectedSkillForModal}
      />
    </div>
  );
};

export default EvidencePage;
