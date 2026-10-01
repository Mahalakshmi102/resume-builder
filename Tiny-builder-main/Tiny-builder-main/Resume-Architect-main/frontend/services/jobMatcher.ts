import { JobDescriptionMatch, ResumeData, EvidenceItem } from '../types';
import { calculateSkillEvidenceMapping } from './evidenceEngine';
import { isResumeEmpty } from './resumeAnalyzer';

const KNOWN_KEYWORDS = [
  'React', 'React.js', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'HTML/CSS',
  'Node.js', 'Express', 'Python', 'SQL', 'PostgreSQL', 'REST API', 'REST APIs',
  'Git', 'GitHub', 'Tailwind CSS', 'Redux', 'Jest', 'Cypress', 'Automated Testing',
  'Docker', 'AWS', 'GraphQL', 'Next.js', 'Vite', 'Java', 'C++', 'C#', 'Go',
  'MongoDB', 'CI/CD', 'Linux', 'Microservices', 'FastAPI', 'Django'
];

export const analyzeJobDescription = (
  jobDescriptionText: string,
  targetRoleName: string,
  resumeData: ResumeData,
  evidenceList: EvidenceItem[] = []
): JobDescriptionMatch => {
  // If resume is empty or JD is empty, return exact 0s and empty arrays
  if (isResumeEmpty(resumeData) || !jobDescriptionText || !jobDescriptionText.trim()) {
    return {
      targetRole: targetRoleName || resumeData?.targetRole || '',
      overallMatchScore: 0,
      matchedSkillsCount: 0,
      partialMatchCount: 0,
      missingSkillsCount: 0,
      matchedSkills: [],
      skillGaps: {
        supported: [],
        limited: [],
        missing: [],
      },
    };
  }

  const jdLower = jobDescriptionText.toLowerCase();

  // Find required keywords in JD
  const requiredSkills = KNOWN_KEYWORDS.filter((kw) =>
    jdLower.includes(kw.toLowerCase())
  );

  const targetSkills = requiredSkills.length > 0
    ? Array.from(new Set(requiredSkills))
    : [];

  // If no known keywords detected in JD, extract capitalized words or return empty
  if (targetSkills.length === 0) {
    const words = jobDescriptionText.split(/\s+/).filter((w) => w.length > 3);
    const uniqueWords = Array.from(new Set(words)).slice(0, 5);
    targetSkills.push(...uniqueWords);
  }

  // Map user evidence
  const userMappings = calculateSkillEvidenceMapping(
    resumeData.skills || [],
    resumeData.projects || [],
    resumeData.certifications || [],
    evidenceList
  );

  const matchedSkills: JobDescriptionMatch['matchedSkills'] = [];
  const supportedGaps: string[] = [];
  const limitedGaps: string[] = [];
  const missingGaps: string[] = [];

  targetSkills.forEach((reqSkill) => {
    const normReq = reqSkill.toLowerCase();
    const userMatch = userMappings.find((m) => {
      const s = m.skill.toLowerCase();
      return s.includes(normReq) || normReq.includes(s) || (normReq === 'html/css' && (s.includes('html') || s.includes('css')));
    });

    if (userMatch && (userMatch.status === 'Strong Evidence' || userMatch.status === 'Supported')) {
      supportedGaps.push(reqSkill);
      const proofTitle = userMatch.evidenceList[0]?.title;
      matchedSkills.push({
        skill: reqSkill,
        status: 'Supported',
        explanation: proofTitle
          ? `${reqSkill} is backed by project proof (${proofTitle}).`
          : `${reqSkill} is backed by evidence in your resume.`,
        evidenceFound: userMatch.evidenceList.map((e) => e.title),
      });
    } else if (userMatch && userMatch.status === 'Limited Evidence') {
      limitedGaps.push(reqSkill);
      matchedSkills.push({
        skill: reqSkill,
        status: 'Limited Evidence',
        explanation: `${reqSkill} is listed in your resume skills, but lacks attached project evidence.`,
        evidenceFound: ['Resume Skill Section'],
      });
    } else {
      missingGaps.push(reqSkill);
      matchedSkills.push({
        skill: reqSkill,
        status: 'Missing',
        explanation: `${reqSkill} was requested in the job description but not detected in your uploaded resume.`,
        evidenceFound: [],
      });
    }
  });

  const total = targetSkills.length;
  const matchScore = total > 0
    ? Math.round(((supportedGaps.length * 1.0 + limitedGaps.length * 0.5) / total) * 100)
    : 0;

  return {
    targetRole: targetRoleName || resumeData.targetRole || '',
    overallMatchScore: Math.min(100, Math.max(0, matchScore)),
    matchedSkillsCount: supportedGaps.length,
    partialMatchCount: limitedGaps.length,
    missingSkillsCount: missingGaps.length,
    matchedSkills,
    skillGaps: {
      supported: supportedGaps,
      limited: limitedGaps,
      missing: missingGaps,
    },
  };
};

export const generateRoleBasedResumeContent = (
  resumeData: ResumeData,
  targetRole: string,
  _jobDescriptionText: string
): ResumeData => {
  // Deep clone
  const updated: ResumeData = JSON.parse(JSON.stringify(resumeData));

  if (targetRole) {
    updated.targetRole = targetRole;
  }

  // Tailor Professional Summary strictly using existing skills & projects
  if (updated.summary || (updated.skills && updated.skills.length > 0)) {
    const topSkills = (updated.skills || []).slice(0, 3).map((s) => s.name).filter(Boolean).join(', ');
    const projectNames = (updated.projects || []).slice(0, 2).map((p) => p.title).filter(Boolean).join(' and ');
    const projRef = projectNames ? ` including ${projectNames}` : '';
    if (topSkills) {
      updated.summary = `${targetRole ? `${targetRole} with` : 'Professional with'} expertise in ${topSkills}. Proven track record of delivering technical projects${projRef} with focus on quality and verified skill delivery.`;
    }
  }

  // Preserve existing projects without inventing new ones or fabricating claims
  return updated;
};
