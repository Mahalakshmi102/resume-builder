import React, { useState } from 'react';
import { ResumeData, Experience, Education, Skill, Project, Certification } from '../types';
import { Plus, Trash2, Wand2, ChevronDown, ChevronUp, Layout, Award, Target, Sparkles } from 'lucide-react';
import { enhanceSectionText } from '../services/aiService';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onOpenEvidence?: (skillName?: string) => void;
  onOpenJobModal?: () => void;
}

const ResumeForm: React.FC<ResumeFormProps> = ({ data: rawData, onChange, onOpenEvidence, onOpenJobModal }) => {
  // Guarantee arrays are defined to prevent mapping errors when AI returns missing fields
  const data = {
    ...rawData,
    experience: rawData.experience || [],
    projects: rawData.projects || [],
    education: rawData.education || [],
    skills: rawData.skills || [],
    certifications: rawData.certifications || []
  };

  const [activeSection, setActiveSection] = useState<string | null>('personal');
  const [loadingEnhance, setLoadingEnhance] = useState<string | null>(null);

  const updateField = (field: keyof ResumeData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleEnhance = async (fieldId: string, text: string, type: 'summary' | 'experience' | 'project') => {
    if (!text) return;
    setLoadingEnhance(fieldId);
    try {
      const enhanced = await enhanceSectionText(text, type);
      if (type === 'summary') {
        updateField('summary', enhanced);
      } else if (type === 'experience') {
        const newExp = data.experience.map(exp =>
          exp.id === fieldId ? { ...exp, description: enhanced } : exp
        );
        updateField('experience', newExp);
      } else {
        const newProj = data.projects.map(proj =>
          proj.id === fieldId ? { ...proj, description: enhanced } : proj
        );
        updateField('projects', newProj);
      }
    } catch (err) {
      console.error('Enhance error:', err);
    } finally {
      setLoadingEnhance(null);
    }
  };

  // -- Certification Handlers --
  const addCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '', issuer: '', issueDate: '', credentialUrl: ''
    };
    updateField('certifications', [...(data.certifications || []), newCert]);
  };
  const removeCertification = (id: string) => {
    updateField('certifications', (data.certifications || []).filter(c => c.id !== id));
  };
  const updateCertification = (id: string, field: keyof Certification, value: any) => {
    updateField('certifications', (data.certifications || []).map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // -- Experience Handlers --
  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '', role: '', startDate: '', endDate: '', description: '', isCurrent: false
    };
    updateField('experience', [...data.experience, newExp]);
  };
  const removeExperience = (id: string) => {
    updateField('experience', data.experience.filter(e => e.id !== id));
  };
  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    updateField('experience', data.experience.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // -- Project Handlers --
  const addProject = () => {
    const newProj: Project = {
      id: Date.now().toString(),
      title: '', link: '', description: ''
    };
    updateField('projects', [...data.projects, newProj]);
  };
  const removeProject = (id: string) => {
    updateField('projects', data.projects.filter(p => p.id !== id));
  };
  const updateProject = (id: string, field: keyof Project, value: any) => {
    updateField('projects', data.projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // -- Education Handlers --
  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: '', degree: '', startDate: '', endDate: ''
    };
    updateField('education', [...data.education, newEdu]);
  };
  const removeEducation = (id: string) => {
    updateField('education', data.education.filter(e => e.id !== id));
  };
  const updateEducation = (id: string, field: keyof Education, value: any) => {
    updateField('education', data.education.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // -- Skill Handlers --
  const addSkill = () => {
    const newSkill: Skill = { id: Date.now().toString(), name: '', level: 'Intermediate' };
    updateField('skills', [...data.skills, newSkill]);
  };
  const removeSkill = (id: string) => {
    updateField('skills', data.skills.filter(s => s.id !== id));
  };
  const updateSkill = (id: string, name: string) => {
    updateField('skills', data.skills.map(s => s.id === id ? { ...s, name } : s));
  };

  const SectionHeader = ({ title, id, sectionKey }: { title: string, id: string, sectionKey?: string }) => {
    const isVisible = sectionKey ? data.sections?.[sectionKey] !== false : true;
    
    const handleToggleVisibility = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!sectionKey) return;
      const newSections = { ...(data.sections || {}), [sectionKey]: !isVisible };
      updateField('sections', newSections);
    };

    return (
      <div 
        role="button"
        tabIndex={0}
        onClick={() => toggleSection(id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(id); } }}
        className={`w-full flex items-center justify-between p-4 bg-white border-b hover:bg-slate-50 transition-colors cursor-pointer select-none ${!isVisible ? 'opacity-60 bg-slate-50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <span className={`font-semibold ${!isVisible ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{title}</span>
          {!isVisible && <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Hidden</span>}
        </div>
        <div className="flex items-center gap-3">
          {sectionKey && (
            <button
              type="button" 
              onClick={handleToggleVisibility}
              className={`p-1.5 rounded text-slate-400 hover:text-slate-700 transition-colors ${isVisible ? 'hover:bg-red-50 hover:text-red-500' : 'hover:bg-emerald-50 hover:text-emerald-600'}`}
              title={isVisible ? "Hide section from resume" : "Show section on resume"}
            >
              {isVisible ? <Trash2 size={16} /> : <Plus size={16} />}
            </button>
          )}
          {activeSection === id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-100 border-r border-slate-200">
      
      {/* AI Job Description Generator Banner */}
      {onOpenJobModal && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3.5 m-2.5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl shrink-0">
                <Sparkles size={18} className="text-yellow-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs tracking-wide text-white">Generate from Job Description</h4>
                <p className="text-[11px] text-blue-100 leading-tight">AI tailors skills, summary & projects to any job</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenJobModal}
              className="px-3.5 py-1.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      {/* Template Selection */}
      <div className="bg-white mb-2 shadow-sm p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
          <Layout size={14} /> Select Template
        </h3>
        <div className="flex flex-wrap gap-2">
          {['modern', 'classic', 'minimal', 'sidebar', 'executive', 'creative', 'developer'].map((t) => (
            <button
              key={t}
              onClick={() => updateField('templateId', t)}
              className={`px-3 py-2 rounded border text-xs font-medium capitalize transition-all ${
                data.templateId === t 
                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' 
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white mb-2 shadow-sm">
        <SectionHeader title="Personal Information" id="personal" />
        {activeSection === 'personal' && (
          <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={data.fullName}
                  onChange={e => updateField('fullName', e.target.value)}
                  className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Location</label>
                <input 
                  type="text" 
                  value={data.location}
                  onChange={e => updateField('location', e.target.value)}
                  className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="New York, NY"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Email</label>
                <input 
                  type="email" 
                  value={data.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Phone</label>
                <input 
                  type="text" 
                  value={data.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">LinkedIn</label>
                <input 
                  type="text" 
                  value={data.linkedin}
                  onChange={e => updateField('linkedin', e.target.value)}
                  className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="linkedin.com/in/john"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Website / GitHub</label>
                <input 
                  type="text" 
                  value={data.website}
                  onChange={e => updateField('website', e.target.value)}
                  className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="github.com/username"
                />
              </div>
            </div>

            {/* Target Role — Critical for AI analysis */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target size={14} className="text-blue-600" />
                <label className="text-xs font-bold text-blue-800 uppercase tracking-wide">Target Role</label>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Used for AI Analysis</span>
              </div>
              <input
                type="text"
                value={data.targetRole || ''}
                onChange={e => updateField('targetRole', e.target.value)}
                className="w-full p-2 border border-blue-200 rounded-lg mt-0.5 text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Frontend Developer, Full Stack Engineer, Data Analyst"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-500 uppercase">Professional Summary</label>
                  <button 
                    onClick={() => updateField('sections', { ...(data.sections || {}), summary: data.sections?.summary === false ? true : false })}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${data.sections?.summary !== false ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    {data.sections?.summary !== false ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button 
                  onClick={() => handleEnhance('summary', data.summary, 'summary')}
                  disabled={loadingEnhance === 'summary'}
                  className="text-xs flex items-center gap-1 text-primary hover:text-blue-700 disabled:opacity-50"
                >
                  <Wand2 size={12} /> {loadingEnhance === 'summary' ? 'Improving...' : 'AI Enhance'}
                </button>
              </div>
              <textarea 
                value={data.summary}
                onChange={e => updateField('summary', e.target.value)}
                className="w-full p-2 border rounded h-24 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Briefly describe your professional background..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="bg-white mb-2 shadow-sm">
        <SectionHeader title="Work Experience" id="experience" sectionKey="experience" />
        {activeSection === 'experience' && (
          <div className="p-4 space-y-6">
            {data.experience.map((exp) => (
              <div key={exp.id} className="relative p-4 border rounded bg-slate-50">
                <button 
                  onClick={() => removeExperience(exp.id)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <input 
                    placeholder="Job Title"
                    value={exp.role}
                    onChange={e => updateExperience(exp.id, 'role', e.target.value)}
                    className="p-2 border rounded text-sm font-medium"
                  />
                  <input 
                    placeholder="Company"
                    value={exp.company}
                    onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                    className="p-2 border rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <input 
                    type="month"
                    value={exp.startDate}
                    onChange={e => updateExperience(exp.id, 'startDate', e.target.value)}
                    className="p-2 border rounded text-sm text-slate-500"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="month"
                      value={exp.endDate}
                      disabled={exp.isCurrent}
                      onChange={e => updateExperience(exp.id, 'endDate', e.target.value)}
                      className="p-2 border rounded text-sm w-full text-slate-500 disabled:bg-slate-200"
                    />
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={exp.isCurrent}
                        onChange={e => updateExperience(exp.id, 'isCurrent', e.target.checked)}
                      /> Current
                    </label>
                  </div>
                </div>
                <div className="mt-2">
                   <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-500 uppercase">Key Achievements</label>
                    <button 
                       onClick={() => handleEnhance(exp.id, exp.description, 'experience')}
                       disabled={loadingEnhance === exp.id}
                       className="text-xs flex items-center gap-1 text-primary hover:text-blue-700 disabled:opacity-50"
                    >
                      <Wand2 size={12} /> {loadingEnhance === exp.id ? 'Improving...' : 'AI Enhance'}
                    </button>
                  </div>
                  <textarea 
                    value={exp.description}
                    onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                    className="w-full p-2 border rounded h-24 text-sm"
                    placeholder="• Achieved X by doing Y..."
                  />
                </div>
              </div>
            ))}
            <button 
              onClick={addExperience}
              className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-primary hover:text-primary transition-colors flex justify-center items-center gap-2"
            >
              <Plus size={16} /> Add Position
            </button>
          </div>
        )}
      </div>

       {/* Projects (New Section) */}
       <div className="bg-white mb-2 shadow-sm">
        <SectionHeader title="Projects" id="projects" sectionKey="projects" />
        {activeSection === 'projects' && (
          <div className="p-4 space-y-6">
            {data.projects.map((proj) => (
              <div key={proj.id} className="relative p-4 border rounded bg-slate-50">
                <button 
                  onClick={() => removeProject(proj.id)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <input 
                    placeholder="Project Title"
                    value={proj.title}
                    onChange={e => updateProject(proj.id, 'title', e.target.value)}
                    className="p-2 border rounded text-sm font-medium"
                  />
                  <input 
                    placeholder="Link (e.g. GitHub)"
                    value={proj.link}
                    onChange={e => updateProject(proj.id, 'link', e.target.value)}
                    className="p-2 border rounded text-sm"
                  />
                </div>
                <div className="mt-2">
                   <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-500 uppercase">Description</label>
                    <button 
                       onClick={() => handleEnhance(proj.id, proj.description, 'project')}
                       disabled={loadingEnhance === proj.id}
                       className="text-xs flex items-center gap-1 text-primary hover:text-blue-700 disabled:opacity-50"
                    >
                      <Wand2 size={12} /> {loadingEnhance === proj.id ? 'Improving...' : 'AI Enhance'}
                    </button>
                  </div>
                  <textarea 
                    value={proj.description}
                    onChange={e => updateProject(proj.id, 'description', e.target.value)}
                    className="w-full p-2 border rounded h-24 text-sm"
                    placeholder="Briefly describe what you built and the tech stack used..."
                  />
                </div>
              </div>
            ))}
            <button 
              onClick={addProject}
              className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-primary hover:text-primary transition-colors flex justify-center items-center gap-2"
            >
              <Plus size={16} /> Add Project
            </button>
          </div>
        )}
      </div>

      {/* Education */}
      <div className="bg-white mb-2 shadow-sm">
        <SectionHeader title="Education" id="education" sectionKey="education" />
        {activeSection === 'education' && (
          <div className="p-4 space-y-4">
             {data.education.map((edu) => (
              <div key={edu.id} className="relative p-4 border rounded bg-slate-50">
                <button 
                  onClick={() => removeEducation(edu.id)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-1 gap-2 mb-2">
                  <input 
                    placeholder="School / University"
                    value={edu.institution}
                    onChange={e => updateEducation(edu.id, 'institution', e.target.value)}
                    className="p-2 border rounded text-sm font-medium"
                  />
                  <input 
                    placeholder="Degree / Certificate"
                    value={edu.degree}
                    onChange={e => updateEducation(edu.id, 'degree', e.target.value)}
                    className="p-2 border rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="month"
                    value={edu.startDate}
                    onChange={e => updateEducation(edu.id, 'startDate', e.target.value)}
                    className="p-2 border rounded text-sm text-slate-500"
                  />
                   <input 
                    type="month"
                    value={edu.endDate}
                    onChange={e => updateEducation(edu.id, 'endDate', e.target.value)}
                    className="p-2 border rounded text-sm text-slate-500"
                  />
                </div>
              </div>
            ))}
            <button 
              onClick={addEducation}
              className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-primary hover:text-primary transition-colors flex justify-center items-center gap-2"
            >
              <Plus size={16} /> Add Education
            </button>
          </div>
        )}
      </div>

       {/* Skills */}
      <div className="bg-white mb-2 shadow-sm">
        <SectionHeader title="Skills" id="skills" sectionKey="skills" />
        {activeSection === 'skills' && (
          <div className="p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {data.skills.map((skill) => (
                <div key={skill.id} className="group flex items-center bg-slate-100 border border-slate-200 rounded-full pl-3 pr-1 py-1 text-sm gap-1 hover:border-blue-300 transition-colors">
                  <input 
                    value={skill.name}
                    onChange={e => updateSkill(skill.id, e.target.value)}
                    className="bg-transparent border-none focus:outline-none w-24 text-slate-700 font-medium"
                    placeholder="Skill"
                  />
                  {onOpenEvidence && skill.name && (
                    <button
                      onClick={() => onOpenEvidence(skill.name)}
                      className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors"
                      title="Inspect evidence proof"
                    >
                      Evidence
                    </button>
                  )}
                  <button 
                    onClick={() => removeSkill(skill.id)}
                    className="p-1 rounded-full text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
             <button 
              onClick={addSkill}
              className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-primary hover:text-primary transition-colors flex justify-center items-center gap-2"
            >
              <Plus size={16} /> Add Skill
            </button>
          </div>
        )}
      </div>

      {/* Certifications */}
      <div className="bg-white mb-2 shadow-sm">
        <SectionHeader title="Certifications" id="certifications" sectionKey="certifications" />
        {activeSection === 'certifications' && (
          <div className="p-4 space-y-4">
            {(data.certifications || []).length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Award size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="font-medium">No certifications added yet.</p>
                <p className="mt-0.5">Certifications strengthen your evidence coverage score.</p>
              </div>
            )}
            {(data.certifications || []).map((cert) => (
              <div key={cert.id} className="relative p-4 border rounded-xl bg-slate-50 space-y-2">
                <button
                  onClick={() => removeCertification(cert.id)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Certification Name</label>
                    <input
                      placeholder="e.g. React Developer Certificate"
                      value={cert.name}
                      onChange={e => updateCertification(cert.id, 'name', e.target.value)}
                      className="w-full p-2 border rounded mt-1 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Issuing Organization</label>
                    <input
                      placeholder="e.g. Meta, Google, HackerRank"
                      value={cert.issuer}
                      onChange={e => updateCertification(cert.id, 'issuer', e.target.value)}
                      className="w-full p-2 border rounded mt-1 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Issue Date</label>
                    <input
                      type="month"
                      value={cert.issueDate}
                      onChange={e => updateCertification(cert.id, 'issueDate', e.target.value)}
                      className="w-full p-2 border rounded mt-1 text-sm text-slate-500 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Credential URL</label>
                    <input
                      placeholder="https://credential.link"
                      value={cert.credentialUrl || ''}
                      onChange={e => updateCertification(cert.id, 'credentialUrl', e.target.value)}
                      className="w-full p-2 border rounded mt-1 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addCertification}
              className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-primary hover:text-primary transition-colors flex justify-center items-center gap-2"
            >
              <Plus size={16} /> Add Certification
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default ResumeForm;