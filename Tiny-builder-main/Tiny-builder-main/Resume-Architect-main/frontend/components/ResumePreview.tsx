import React from 'react';
import { ResumeData } from '../types';
import { MapPin, Mail, Phone, Globe, Linkedin, Link as LinkIcon } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  scale?: number;
  onSkillClick?: (skillName: string) => void;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data: rawData, scale = 1, onSkillClick }) => {
  // Ensure array fields are never undefined to prevent crash during rendering
  const data = {
    ...rawData,
    experience: rawData.experience || [],
    projects: rawData.projects || [],
    education: rawData.education || [],
    skills: rawData.skills || [],
    certifications: rawData.certifications || []
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const ContactItem = ({ icon: Icon, text, link }: { icon: any, text: string, link?: string }) => {
    if (!text) return null;
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <Icon size={14} className="shrink-0" />
        {link ? <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="hover:underline">{text}</a> : <span>{text}</span>}
      </div>
    );
  };

  const renderTemplate = () => {
    switch (data.templateId) {
      case 'creative':
        return (
          <div className="p-8 font-sans text-slate-800">
            {/* Header with rounded corner gradient banner */}
            <header className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-8 rounded-2xl shadow-md mb-8 overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 font-bold text-9xl select-none translate-x-12 translate-y-12">
                {data.fullName ? data.fullName.charAt(0) : 'R'}
              </div>
              <div className="relative z-10 font-sans">
                <h1 className="text-4xl font-extrabold tracking-tight mb-2 uppercase">{data.fullName || 'YOUR NAME'}</h1>
                <div className="text-lg text-purple-100 font-light tracking-wide mb-6">{data.experience[0]?.role || 'Professional'}</div>
                <div className="flex flex-wrap gap-4 text-xs bg-black/15 p-3 rounded-lg backdrop-blur-sm max-w-max border border-white/10">
                  {data.email && <ContactItem icon={Mail} text={data.email} />}
                  {data.phone && <ContactItem icon={Phone} text={data.phone} />}
                  {data.location && <ContactItem icon={MapPin} text={data.location} />}
                  {data.linkedin && <ContactItem icon={Linkedin} text={data.linkedin} />}
                  {data.website && <ContactItem icon={Globe} text={data.website} />}
                </div>
              </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
              {/* Left Column (Main details) */}
              <div className="col-span-8 space-y-8">
                {data.summary && data.sections?.summary !== false && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-indigo-600 inline-block rounded-full"></span> About Me
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">{data.summary}</p>
                  </section>
                )}

                {data.experience.length > 0 && data.sections?.experience !== false && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-5 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-indigo-600 inline-block rounded-full"></span> Work History
                    </h2>
                    <div className="relative border-l-2 border-indigo-100 ml-3 pl-6 space-y-6">
                      {data.experience.map(exp => (
                        <div key={exp.id} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full group-hover:bg-indigo-600 transition-colors"></div>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-slate-800 text-base">{exp.role}</h3>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                              {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-500 mb-2">{exp.company}</div>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {data.projects.length > 0 && data.sections?.projects !== false && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-indigo-600 inline-block rounded-full"></span> Featured Projects
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {data.projects.map(proj => (
                        <div key={proj.id} className="bg-white border border-slate-200 p-4 rounded-xl hover:shadow-md transition-shadow">
                          <h3 className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                            {proj.title}
                            {proj.link && <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5"><LinkIcon size={10} /> Visit</a>}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed mt-2">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column (Side details) */}
              <div className="col-span-4 space-y-8">
                {data.skills.length > 0 && data.sections?.skills !== false && (
                  <section className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-indigo-600 inline-block rounded-full"></span> Key Competencies
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map(skill => (
                        <span key={skill.id} className="px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-100/50">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {data.education.length > 0 && data.sections?.education !== false && (
                  <section className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-indigo-600 inline-block rounded-full"></span> Education
                    </h2>
                    <div className="space-y-4">
                      {data.education.map(edu => (
                        <div key={edu.id} className="border-l-2 border-purple-200 pl-3">
                          <h4 className="font-bold text-slate-800 text-sm">{edu.institution}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{edu.degree}</p>
                          <span className="text-[10px] text-slate-400 block mt-1">{formatDate(edu.startDate)} – {edu.endDate ? formatDate(edu.endDate) : 'Present'}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        );

      case 'developer':
        return (
          <div className="p-8 font-mono text-slate-300 bg-slate-950 min-h-[297mm]">
            {/* Terminal Window Header */}
            <header className="bg-slate-900 rounded-t-lg border border-slate-800 px-4 py-2 flex items-center justify-between mb-6 shadow-md">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
              </div>
              <div className="text-xs text-slate-400 font-medium">bash - {(data.fullName || 'resume').toLowerCase().replace(/\s+/g, '_')}.sh</div>
              <div className="w-12"></div>
            </header>

            <div className="px-2 space-y-6">
              {/* Terminal Greeting & Bio */}
              <div>
                <div className="text-emerald-400 font-bold mb-1">guest@resume-arch:~$ <span className="text-white">whoami</span></div>
                <h1 className="text-3xl font-extrabold text-white uppercase mb-2 tracking-tight">{data.fullName || 'GUEST_USER'}</h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 mt-3 border border-slate-800 p-3 rounded-md bg-slate-900/50">
                  {data.email && <div><span className="text-cyan-400">email:</span> {data.email}</div>}
                  {data.phone && <div><span className="text-cyan-400">phone:</span> {data.phone}</div>}
                  {data.location && <div><span className="text-cyan-400">location:</span> {data.location}</div>}
                  {data.linkedin && <div><span className="text-cyan-400">linkedin:</span> {data.linkedin}</div>}
                  {data.website && <div><span className="text-cyan-400">website:</span> {data.website}</div>}
                </div>
              </div>

              {data.summary && data.sections?.summary !== false && (
                <div>
                  <div className="text-emerald-400 font-bold mb-1">guest@resume-arch:~$ <span className="text-white">cat profile.txt</span></div>
                  <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap border-l-2 border-emerald-500/50 pl-3">{data.summary}</p>
                </div>
              )}

              {data.experience.length > 0 && data.sections?.experience !== false && (
                <div>
                  <div className="text-emerald-400 font-bold mb-3">guest@resume-arch:~$ <span className="text-white">git log --oneline --experience</span></div>
                  <div className="space-y-4">
                    {data.experience.map((exp) => (
                      <div key={exp.id} className="text-xs bg-slate-900/40 border border-slate-800 p-3 rounded-md">
                        <div className="flex flex-wrap items-center justify-between text-yellow-400 font-bold mb-1.5">
                          <span>commit {Math.random().toString(16).substring(2, 9)} (HEAD {"->"} {exp.role.toLowerCase().replace(/\s+/g, '-')})</span>
                          <span className="text-slate-500 font-normal">{formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}</span>
                        </div>
                        <div className="text-white font-semibold mb-1">Author: {exp.company}</div>
                        <p className="text-slate-400 mt-2 whitespace-pre-wrap pl-2 border-l border-slate-800">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.projects.length > 0 && data.sections?.projects !== false && (
                <div>
                  <div className="text-emerald-400 font-bold mb-2">guest@resume-arch:~$ <span className="text-white">ls -la projects/</span></div>
                  <div className="grid grid-cols-1 gap-3">
                    {data.projects.map(proj => (
                      <div key={proj.id} className="text-xs border border-slate-800 bg-slate-900/20 p-3 rounded-md">
                        <div className="flex justify-between items-center text-cyan-400 mb-1">
                          <span className="font-bold">-rwxr-xr-x {proj.title.toLowerCase().replace(/\s+/g, '_')}</span>
                          {proj.link && <span className="text-[10px] text-slate-500 hover:text-cyan-300">({proj.link})</span>}
                        </div>
                        <p className="text-slate-400 leading-relaxed mt-1">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.skills.length > 0 && data.sections?.skills !== false && (
                  <div>
                    <div className="text-emerald-400 font-bold mb-2">guest@resume-arch:~$ <span className="text-white">cat skills.json</span></div>
                    <div className="bg-slate-900 border border-slate-800 rounded-md p-3 text-xs text-indigo-300 font-mono">
                      <span className="text-slate-500">{"{"}</span>
                      <div className="pl-4">
                        <span className="text-cyan-400">"competencies"</span>: [
                        <div className="pl-4 flex flex-wrap gap-x-2 gap-y-1">
                          {data.skills.map((skill, idx) => (
                            <span key={skill.id} className="text-yellow-300">
                              "{skill.name}"{idx < data.skills.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                        ]
                      </div>
                      <span className="text-slate-500">{"}"}</span>
                    </div>
                  </div>
                )}

                {data.education.length > 0 && data.sections?.education !== false && (
                  <div>
                    <div className="text-emerald-400 font-bold mb-2">guest@resume-arch:~$ <span className="text-white">cat education.log</span></div>
                    <div className="border border-slate-800 p-3 rounded-md bg-slate-900/20 space-y-3">
                      {data.education.map(edu => (
                        <div key={edu.id} className="text-xs">
                          <div className="text-white font-bold">{edu.institution}</div>
                          <div className="text-slate-400">{edu.degree}</div>
                          <div className="text-slate-500 text-[10px]">{formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'classic':
        return (
          <div className="p-8 font-serif text-slate-900">
            <header className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
              <h1 className="text-3xl font-bold uppercase tracking-widest mb-3">{data.fullName || 'YOUR NAME'}</h1>
              <div className="flex flex-wrap justify-center gap-4 text-slate-700 text-sm">
                <span>{data.location}</span>
                {data.location && data.email && <span>•</span>}
                <span>{data.email}</span>
                {data.email && data.phone && <span>•</span>}
                <span>{data.phone}</span>
                {(data.linkedin || data.website) && <span>•</span>}
                <span>{data.linkedin || data.website}</span>
              </div>
            </header>

            {data.summary && data.sections?.summary !== false && (
              <section className="mb-6">
                <h2 className="text-lg font-bold uppercase border-b border-slate-300 mb-3 pb-1">Professional Summary</h2>
                <p className="leading-relaxed text-sm">{data.summary}</p>
              </section>
            )}

            {data.experience.length > 0 && data.sections?.experience !== false && (
              <section className="mb-6">
                <h2 className="text-lg font-bold uppercase border-b border-slate-300 mb-3 pb-1">Experience</h2>
                <div className="space-y-4">
                  {data.experience.map(exp => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline font-bold">
                        <h3>{exp.role}, {exp.company}</h3>
                        <span className="text-sm italic font-normal">{formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.projects.length > 0 && data.sections?.projects !== false && (
               <section className="mb-6">
                <h2 className="text-lg font-bold uppercase border-b border-slate-300 mb-3 pb-1">Projects</h2>
                <div className="space-y-4">
                  {data.projects.map(proj => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline">
                         <h3 className="font-bold">{proj.title} {proj.link && <span className="font-normal text-xs text-blue-800 ml-1">({proj.link})</span>}</h3>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.education.length > 0 && data.sections?.education !== false && (
              <section className="mb-6">
                <h2 className="text-lg font-bold uppercase border-b border-slate-300 mb-3 pb-1">Education</h2>
                {data.education.map(edu => (
                  <div key={edu.id} className="mb-2">
                    <div className="flex justify-between font-bold">
                      <h3>{edu.institution}</h3>
                      <span className="text-sm font-normal italic">{formatDate(edu.startDate)} – {edu.endDate ? formatDate(edu.endDate) : 'Present'}</span>
                    </div>
                    <div className="text-sm">{edu.degree}</div>
                  </div>
                ))}
              </section>
            )}

             {data.skills.length > 0 && data.sections?.skills !== false && (
              <section>
                <h2 className="text-lg font-bold uppercase border-b border-slate-300 mb-3 pb-1">Skills</h2>
                <div className="text-sm leading-relaxed">
                  {data.skills.map(s => s.name).join(' • ')}
                </div>
              </section>
            )}
          </div>
        );

      case 'minimal':
        return (
          <div className="p-10 font-sans text-slate-800">
             <header className="text-center mb-10">
              <h1 className="text-4xl font-light tracking-tight mb-4">{data.fullName || 'Your Name'}</h1>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500 font-light">
                {data.email && <span>{data.email}</span>}
                {data.phone && <span>{data.phone}</span>}
                {data.location && <span>{data.location}</span>}
                {data.linkedin && <span>LinkedIn</span>}
                {data.website && <span>Portfolio</span>}
              </div>
            </header>

            <div className="max-w-3xl mx-auto space-y-8">
               {data.summary && data.sections?.summary !== false && (
                <section>
                  <p className="text-center text-slate-600 leading-relaxed italic">{data.summary}</p>
                </section>
              )}

              {data.experience.length > 0 && data.sections?.experience !== false && (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 text-center">Work Experience</h2>
                  <div className="space-y-8 border-l border-slate-200 ml-3 pl-6 relative">
                    {data.experience.map(exp => (
                      <div key={exp.id} className="relative">
                        <div className="absolute -left-[29px] top-1.5 w-3 h-3 bg-white border-2 border-slate-300 rounded-full"></div>
                        <h3 className="font-medium text-lg text-slate-900">{exp.role}</h3>
                        <div className="text-sm text-slate-500 mb-2">{exp.company} • {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}</div>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.projects.length > 0 && data.sections?.projects !== false && (
                 <section>
                   <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 text-center">Projects</h2>
                   <div className="grid grid-cols-1 gap-4">
                     {data.projects.map(proj => (
                       <div key={proj.id} className="bg-slate-50 p-4 rounded">
                          <div className="flex justify-between items-center mb-2">
                             <h3 className="font-medium text-slate-900">{proj.title}</h3>
                             {proj.link && <span className="text-xs text-blue-500">{proj.link}</span>}
                          </div>
                          <p className="text-sm text-slate-600">{proj.description}</p>
                       </div>
                     ))}
                   </div>
                 </section>
              )}

              <div className="grid grid-cols-2 gap-8">
                 {data.education.length > 0 && data.sections?.education !== false && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">Education</h2>
                    {data.education.map(edu => (
                      <div key={edu.id} className="text-center mb-3">
                        <div className="font-medium text-slate-900">{edu.institution}</div>
                        <div className="text-sm text-slate-500">{edu.degree}</div>
                        <div className="text-xs text-slate-400">{formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}</div>
                      </div>
                    ))}
                  </section>
                )}
                {data.skills.length > 0 && data.sections?.skills !== false && (
                   <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">Skills</h2>
                    <div className="flex flex-wrap justify-center gap-2">
                      {data.skills.map(skill => (
                        <span key={skill.id} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">{skill.name}</span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        );

      case 'sidebar':
        return (
           <div className="flex h-full font-sans">
            {/* Sidebar */}
            <div className="w-1/3 bg-slate-900 text-white p-6 pt-10 flex flex-col gap-8">
              <div className="text-center">
                 <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                    {data.fullName ? data.fullName.charAt(0) : 'Me'}
                 </div>
                 <h1 className="text-xl font-bold uppercase tracking-wide mb-4">{data.fullName}</h1>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <ContactItem icon={Mail} text={data.email} />
                <ContactItem icon={Phone} text={data.phone} />
                <ContactItem icon={MapPin} text={data.location} />
                <ContactItem icon={Linkedin} text={data.linkedin} />
                <ContactItem icon={Globe} text={data.website} />
              </div>

              {data.education.length > 0 && data.sections?.education !== false && (
                 <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-700 pb-1">Education</h3>
                  {data.education.map(edu => (
                    <div key={edu.id} className="mb-4">
                      <div className="font-bold text-white">{edu.institution}</div>
                      <div className="text-xs text-slate-400 mb-1">{edu.degree}</div>
                      <div className="text-xs text-slate-500">{formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}</div>
                    </div>
                  ))}
                 </div>
              )}

              {data.skills.length > 0 && data.sections?.skills !== false && (
                <div>
                   <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-700 pb-1">Skills</h3>
                   <div className="flex flex-wrap gap-2">
                     {data.skills.map(s => (
                       <span key={s.id} className="px-2 py-1 bg-slate-800 text-xs rounded text-slate-300">{s.name}</span>
                     ))}
                   </div>
                </div>
              )}
            </div>
            
            {/* Main Content */}
            <div className="w-2/3 p-8 bg-white text-slate-800">
               {data.summary && data.sections?.summary !== false && (
                <section className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-3">Profile</h2>
                  <p className="text-sm leading-relaxed text-slate-600">{data.summary}</p>
                </section>
              )}

              {data.experience.length > 0 && data.sections?.experience !== false && (
                <section className="mb-8">
                   <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <span className="w-2 h-8 bg-slate-900 inline-block rounded-sm"></span> Experience
                   </h2>
                   <div className="space-y-6">
                     {data.experience.map(exp => (
                       <div key={exp.id}>
                         <div className="flex justify-between items-baseline mb-1">
                           <h3 className="font-bold text-lg">{exp.role}</h3>
                           <span className="text-sm text-slate-500">{formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}</span>
                         </div>
                         <div className="text-slate-600 font-medium text-sm mb-2">{exp.company}</div>
                         <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                       </div>
                     ))}
                   </div>
                </section>
              )}

              {data.projects.length > 0 && data.sections?.projects !== false && (
                <section>
                   <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <span className="w-2 h-8 bg-slate-900 inline-block rounded-sm"></span> Projects
                   </h2>
                   <div className="space-y-4">
                      {data.projects.map(proj => (
                        <div key={proj.id} className="border-l-2 border-slate-200 pl-4">
                           <h3 className="font-bold text-md">{proj.title}</h3>
                           {proj.link && <div className="text-xs text-blue-600 mb-1">{proj.link}</div>}
                           <p className="text-sm text-slate-600">{proj.description}</p>
                        </div>
                      ))}
                   </div>
                </section>
              )}
            </div>
           </div>
        );

      case 'executive':
         return (
          <div className="p-10 font-sans text-slate-900">
            <header className="flex justify-between items-end border-b-4 border-slate-800 pb-6 mb-8">
              <div>
                <h1 className="text-5xl font-extrabold uppercase tracking-tighter mb-2">{data.fullName || 'YOUR NAME'}</h1>
                <div className="text-xl text-slate-600 font-light">{data.experience[0]?.role || 'Professional Title'}</div>
              </div>
              <div className="text-right text-sm space-y-1 text-slate-600">
                <div>{data.email}</div>
                <div>{data.phone}</div>
                <div>{data.location}</div>
                <div className="text-blue-600 font-medium">{data.linkedin}</div>
              </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
               <div className="col-span-8 space-y-8">
                  {data.summary && data.sections?.summary !== false && (
                    <section>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Executive Profile</h2>
                      <p className="text-md leading-relaxed font-medium text-slate-800">{data.summary}</p>
                    </section>
                  )}

                   {data.experience.length > 0 && data.sections?.experience !== false && (
                    <section>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Professional Experience</h2>
                      <div className="space-y-6">
                        {data.experience.map(exp => (
                          <div key={exp.id}>
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="font-bold text-lg">{exp.company}</h3>
                              <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}</span>
                            </div>
                            <div className="text-md font-semibold text-slate-700 mb-2">{exp.role}</div>
                            <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {data.projects.length > 0 && data.sections?.projects !== false && (
                     <section>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Key Initiatives</h2>
                      <div className="grid grid-cols-1 gap-4">
                        {data.projects.map(proj => (
                          <div key={proj.id} className="bg-slate-50 p-4 border-l-4 border-slate-800">
                             <h3 className="font-bold">{proj.title}</h3>
                             <p className="text-sm mt-1">{proj.description}</p>
                          </div>
                        ))}
                      </div>
                     </section>
                  )}
               </div>

               <div className="col-span-4 space-y-8">
                 {data.education.length > 0 && data.sections?.education !== false && (
                    <section>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Education</h2>
                      {data.education.map(edu => (
                        <div key={edu.id} className="mb-4">
                          <div className="font-bold text-slate-900">{edu.institution}</div>
                          <div className="text-sm text-slate-600">{edu.degree}</div>
                          <div className="text-xs text-slate-400 mt-1">{formatDate(edu.startDate)}</div>
                        </div>
                      ))}
                    </section>
                  )}
                  
                  {data.skills.length > 0 && data.sections?.skills !== false && (
                    <section>
                      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Core Competencies</h2>
                      <div className="flex flex-col gap-2">
                        {data.skills.map(s => (
                           <div key={s.id} className="flex justify-between items-center border-b border-slate-100 pb-1">
                             <span className="text-sm font-medium text-slate-700">{s.name}</span>
                             {s.level === 'Expert' && <div className="w-2 h-2 bg-slate-800 rounded-full"></div>}
                             {s.level === 'Intermediate' && <div className="w-2 h-2 bg-slate-400 rounded-full"></div>}
                           </div>
                        ))}
                      </div>
                    </section>
                  )}
               </div>
            </div>
          </div>
         );

      case 'modern':
      default:
        // Original layout refined
        return (
          <div className="p-8 text-slate-800 font-sans">
             <header className="border-b-2 border-primary pb-4 mb-6">
              <h1 className="text-4xl font-bold uppercase tracking-wider text-slate-900 mb-2">{data.fullName || 'Your Name'}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-3">
                <ContactItem icon={Mail} text={data.email} />
                <ContactItem icon={Phone} text={data.phone} />
                <ContactItem icon={MapPin} text={data.location} />
                <ContactItem icon={Linkedin} text={data.linkedin} />
                <ContactItem icon={Globe} text={data.website} />
              </div>
            </header>

            {data.summary && data.sections?.summary !== false && (
              <section className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3 border-b pb-1">Professional Profile</h2>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{data.summary}</p>
              </section>
            )}

            {data.experience.length > 0 && data.sections?.experience !== false && (
              <section className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 border-b pb-1">Experience</h2>
                <div className="space-y-5">
                  {data.experience.map(exp => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-slate-800">{exp.role}</h3>
                        <span className="text-sm text-slate-500 italic">
                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-600 mb-2">{exp.company}</div>
                      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.projects.length > 0 && data.sections?.projects !== false && (
               <section className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 border-b pb-1">Projects</h2>
                <div className="space-y-4">
                  {data.projects.map(proj => (
                    <div key={proj.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800">{proj.title}</h3>
                        {proj.link && <a href={proj.link} className="text-xs text-primary hover:underline flex items-center gap-0.5"><LinkIcon size={10} /> Link</a>}
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-2 gap-8">
              {data.education.length > 0 && data.sections?.education !== false && (
                <section className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 border-b pb-1">Education</h2>
                  <div className="space-y-4">
                    {data.education.map(edu => (
                      <div key={edu.id}>
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-slate-800">{edu.institution}</h3>
                        </div>
                        <div className="text-sm text-slate-700">{edu.degree}</div>
                         <span className="text-xs text-slate-500 italic">
                            {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                          </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              
               {data.skills.length > 0 && data.sections?.skills !== false && (
                <section className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 border-b pb-1">Skills</h2>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {data.skills.map(skill => (
                      <div key={skill.id} className="text-sm text-slate-700 relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-primary">
                        <span className="font-medium">{skill.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        );
    }
  };

  const isDarkTheme = data.templateId === 'developer';

  return (
    <div className="flex justify-center p-4 bg-slate-200 h-full overflow-y-auto no-print">
      <div 
        id="resume-preview"
        className={`shadow-lg print-area ${isDarkTheme ? 'bg-slate-950 text-slate-300' : 'bg-white text-slate-800'}`}
        style={{
          width: '210mm',
          minHeight: '297mm',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          boxSizing: 'border-box',
          overflow: 'hidden' // Ensure content doesn't spill out visually in preview
        }}
      >
        {renderTemplate()}
      </div>
    </div>
  );
};

export default ResumePreview;