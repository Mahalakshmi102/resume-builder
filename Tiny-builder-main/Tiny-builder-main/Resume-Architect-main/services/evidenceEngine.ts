import { EvidenceItem, SkillEvidenceMapping, ResumeClaim, CareerMetrics, ResumeData } from '../types';

export const calculateSkillEvidenceMapping = (
  skills: { name: string }[],
  projects: { title: string; description: string; link?: string; technologies?: string[] }[],
  certifications: { name: string; issuer: string }[] = [],
  evidenceList: EvidenceItem[] = []
): SkillEvidenceMapping[] => {
  return skills.map((skillObj) => {
    const skillName = skillObj.name;
    const lowerSkill = skillName.toLowerCase();

    // Find direct evidence matching this skill
    const directEvidence = evidenceList.filter(
      (ev) => ev.skill.toLowerCase() === lowerSkill
    );

    // Find project mentions
    const projectMentions = projects.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(lowerSkill);
      const descMatch = p.description.toLowerCase().includes(lowerSkill);
      const techMatch = p.technologies?.some((t) => t.toLowerCase() === lowerSkill);
      return titleMatch || descMatch || techMatch;
    });

    // Find cert mentions
    const certMentions = certifications.filter((c) =>
      c.name.toLowerCase().includes(lowerSkill)
    );

    // Combine evidence items
    const combinedEvidence: EvidenceItem[] = [...directEvidence];

    projectMentions.forEach((p, idx) => {
      if (!combinedEvidence.some((e) => e.title === p.title)) {
        combinedEvidence.push({
          id: `proj-ev-${idx}-${p.title}`,
          skill: skillName,
          type: p.link?.includes('github.com') ? 'GitHub Project' : 'Project',
          title: p.title,
          url: p.link,
          description: p.description,
          status: 'Prototype Evidence Check',
        });
      }
    });

    certMentions.forEach((c, idx) => {
      if (!combinedEvidence.some((e) => e.title === c.name)) {
        combinedEvidence.push({
          id: `cert-ev-${idx}-${c.name}`,
          skill: skillName,
          type: 'Certification',
          title: c.name,
          description: `Issued by ${c.issuer}`,
          status: 'Prototype Evidence Check',
        });
      }
    });

    // Determine Status
    let status: 'Strong Evidence' | 'Supported' | 'Limited Evidence' | 'Missing' = 'Missing';

    if (combinedEvidence.length >= 2 || (combinedEvidence.length >= 1 && combinedEvidence.some((e) => e.type === 'GitHub Project' || e.type === 'Assessment'))) {
      status = 'Strong Evidence';
    } else if (combinedEvidence.length >= 1) {
      status = 'Supported';
    } else {
      // Check if mentioned in resume
      status = 'Limited Evidence';
    }

    let whySupported = '';
    if (status === 'Strong Evidence') {
      whySupported = `${skillName} is backed by multiple verified project repositories and practical evidence.`;
    } else if (status === 'Supported') {
      whySupported = `${skillName} appears in your projects or course certifications.`;
    } else if (status === 'Limited Evidence') {
      whySupported = `${skillName} is listed in your resume skills section, but lacks attached project or assessment evidence.`;
    } else {
      whySupported = `No supporting evidence or project references found for ${skillName}.`;
    }

    return {
      skill: skillName,
      status,
      evidenceList: combinedEvidence,
      resumeMention: true,
      whySupported,
    };
  });
};

export const verifyResumeClaims = (resumeData: ResumeData, evidenceList: EvidenceItem[]): ResumeClaim[] => {
  const claims: ResumeClaim[] = [];

  // Check Summary claim
  if (resumeData.summary) {
    if (resumeData.summary.toLowerCase().includes('expert') || resumeData.summary.toLowerCase().includes('master')) {
      const matchedSkill = resumeData.skills.find((s) => s.level === 'Expert');
      claims.push({
        id: 'claim-1',
        claim: `Claim: Expert proficiency in ${matchedSkill?.name || 'technical domain'}`,
        evidenceFound: matchedSkill?.evidenceStatus === 'Strong Evidence' ? [`Verified ${matchedSkill.name} projects`] : [],
        evidenceMissing: ['No formal standardized assessment score', 'No peer code review badge'],
        status: matchedSkill?.evidenceStatus === 'Strong Evidence' ? 'Supported' : 'Limited Evidence',
        suggestedWording: `Experienced with ${matchedSkill?.name || 'modern web technologies'} with project demonstration.`,
      });
    }
  }

  // Check Project claims
  resumeData.projects.forEach((proj, idx) => {
    const hasGithub = proj.link && proj.link.includes('github.com');
    claims.push({
      id: `claim-proj-${idx}`,
      claim: `Project Claim: "${proj.title}" implementation`,
      evidenceFound: hasGithub ? ['Public GitHub Repository URL'] : ['Project Description in Resume'],
      evidenceMissing: hasGithub ? [] : ['GitHub Repository Link', 'Live Deployment Link'],
      status: hasGithub ? 'Supported' : 'Limited Evidence',
      suggestedWording: hasGithub
        ? `Built ${proj.title} with public repository verification.`
        : `Developed ${proj.title} (Attach GitHub URL for strong proof).`,
    });
  });

  return claims;
};

export const getCareerMetrics = (resumeData: ResumeData, evidenceList: EvidenceItem[]): CareerMetrics => {
  const mappings = calculateSkillEvidenceMapping(
    resumeData.skills,
    resumeData.projects,
    resumeData.certifications,
    evidenceList
  );

  const strongCount = mappings.filter((m) => m.status === 'Strong Evidence' || m.status === 'Supported').length;
  const needCount = mappings.filter((m) => m.status === 'Limited Evidence' || m.status === 'Missing').length;

  return {
    totalProjects: resumeData.projects.length,
    totalCertifications: (resumeData.certifications || []).length,
    totalAssessments: evidenceList.filter((e) => e.type === 'Assessment').length || 2,
    evidenceBackedSkills: strongCount,
    skillsNeedingEvidence: needCount,
    roleMatchesCount: 4,
  };
};

export const getWhyThisSkill = (
  skillName: string,
  resumeData: ResumeData,
  evidenceList: EvidenceItem[],
  targetRole: string = 'Frontend Developer'
) => {
  const mappings = calculateSkillEvidenceMapping(
    resumeData.skills,
    resumeData.projects,
    resumeData.certifications,
    evidenceList
  );

  const mapping = mappings.find((m) => m.skill.toLowerCase() === skillName.toLowerCase());

  const evidenceFound: string[] = [];
  if (mapping?.evidenceList.some((e) => e.type === 'GitHub Project' || e.type === 'Project')) {
    evidenceFound.push('Project Evidence (ExamVerse / ResumeArchitect)');
  }
  if (mapping?.evidenceList.some((e) => e.type === 'GitHub Project')) {
    evidenceFound.push('Public GitHub Repository');
  }
  if (mapping?.resumeMention) {
    evidenceFound.push('Resume Skills Section Mention');
  }
  if (targetRole.toLowerCase().includes('frontend') && ['react.js', 'react', 'javascript', 'html & css', 'html', 'css'].includes(skillName.toLowerCase())) {
    evidenceFound.push('Target Job Description Core Requirement');
  }

  return {
    skill: skillName,
    evidenceFound: evidenceFound.length > 0 ? evidenceFound : ['Resume Listed Skill'],
    reason: mapping?.whySupported || `${skillName} aligns with your technical profile.`,
    status: mapping?.status === 'Strong Evidence' || mapping?.status === 'Supported' ? 'Evidence Supported' : 'Limited Evidence',
  };
};
