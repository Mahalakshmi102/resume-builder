import { JobDescriptionMatch, ResumeData, EvidenceItem } from '../types';
import { calculateSkillEvidenceMapping } from './evidenceEngine';

const KNOWN_KEYWORDS = [
  'React', 'React.js', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'HTML/CSS',
  'Node.js', 'Express', 'Python', 'SQL', 'PostgreSQL', 'Supabase', 'REST API', 'REST APIs',
  'Git', 'GitHub', 'Tailwind CSS', 'Redux', 'Jest', 'Cypress', 'Automated Testing',
  'Docker', 'AWS', 'GraphQL', 'Next.js', 'Vite'
];

export const analyzeJobDescription = (
  jobDescriptionText: string,
  targetRoleName: string,
  resumeData: ResumeData,
  evidenceList: EvidenceItem[] = []
): JobDescriptionMatch => {
  const jdLower = jobDescriptionText.toLowerCase();

  // Find required keywords in JD
  const requiredSkills = KNOWN_KEYWORDS.filter((kw) =>
    jdLower.includes(kw.toLowerCase())
  );

  // If JD is short or generic, provide default role-relevant skills
  const targetSkills = requiredSkills.length > 0
    ? Array.from(new Set(requiredSkills))
    : ['React.js', 'JavaScript', 'HTML & CSS', 'REST API', 'Git', 'TypeScript', 'Automated Testing'];

  // Map user evidence
  const userMappings = calculateSkillEvidenceMapping(
    resumeData.skills,
    resumeData.projects,
    resumeData.certifications,
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
      matchedSkills.push({
        skill: reqSkill,
        status: 'Supported',
        explanation: `${reqSkill} is backed by project proof in your profile (${userMatch.evidenceList[0]?.title || 'ExamVerse'}).`,
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
        explanation: `${reqSkill} was requested in the job description but not detected in your current profile.`,
        evidenceFound: [],
      });
    }
  });

  const total = targetSkills.length || 1;
  const matchScore = Math.round(
    ((supportedGaps.length * 1.0 + limitedGaps.length * 0.5) / total) * 100
  );

  return {
    targetRole: targetRoleName || 'Frontend Developer',
    overallMatchScore: Math.max(50, Math.min(98, matchScore)),
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
  jobDescriptionText: string
): ResumeData => {
  // Deep clone
  const updated: ResumeData = JSON.parse(JSON.stringify(resumeData));

  updated.targetRole = targetRole;

  // Tailor Professional Summary
  updated.summary = `Driven ${targetRole} with hands-on expertise in React.js, JavaScript, modern frontend architecture, and REST API integrations. Proven track record of building production-ready web applications (such as ExamVerse and ResumeArchitect) with focus on clean UI, performance, and evidence-backed skill delivery.`;

  // Tailor Projects
  updated.projects = updated.projects.map((proj) => {
    if (proj.title.toLowerCase().includes('examverse')) {
      return {
        ...proj,
        description: `Developed a React-based competitive quiz platform with Supabase integration, real-time multiplayer functionality, automated score tracking, and clean UI components tailored for high user engagement.`,
      };
    }
    if (proj.title.toLowerCase().includes('resumearchitect')) {
      return {
        ...proj,
        description: `Architected a high-performance AI resume builder & career intelligence platform with 7 dynamic resume templates, instant ATS compatibility analysis, and evidence-backed skill verification.`,
      };
    }
    return proj;
  });

  // Ensure key required skills are highlighted
  const hasTs = updated.skills.some((s) => s.name.toLowerCase().includes('typescript'));
  if (!hasTs) {
    updated.skills.push({
      id: `sk-ts-${Date.now()}`,
      name: 'TypeScript',
      level: 'Beginner',
      evidenceStatus: 'Limited Evidence',
    });
  }

  return updated;
};
