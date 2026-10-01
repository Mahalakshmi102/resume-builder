import { AnalysisResult, ResumeData, EvidenceItem } from '../types';
import { calculateSkillEvidenceMapping } from './evidenceEngine';

export const isResumeEmpty = (resumeData?: ResumeData | null): boolean => {
  if (!resumeData) return true;
  const hasName = !!resumeData.fullName?.trim();
  const hasSummary = !!resumeData.summary?.trim();
  const hasSkills = (resumeData.skills || []).length > 0;
  const hasExp = (resumeData.experience || []).length > 0;
  const hasEdu = (resumeData.education || []).length > 0;
  const hasProj = (resumeData.projects || []).length > 0;
  const hasCert = (resumeData.certifications || []).length > 0;
  return !hasName && !hasSummary && !hasSkills && !hasExp && !hasEdu && !hasProj && !hasCert;
};

export const analyzeResumeData = (
  resumeData: ResumeData,
  evidenceList: EvidenceItem[] = [],
  targetRole: string = ''
): AnalysisResult => {
  // If resume is empty, return exact 0s and empty arrays
  if (isResumeEmpty(resumeData)) {
    return {
      score: 0,
      atsScore: 0,
      roleAlignment: 0,
      skillCoverage: 0,
      evidenceCoverage: 0,
      projectStrength: 0,
      missingInformationScore: 0,
      summary: '',
      strengths: [],
      weaknesses: [],
      missingKeywords: [],
      improvements: [],
      detectedSkills: [],
    };
  }

  const safeData = {
    ...resumeData,
    skills: resumeData?.skills || [],
    projects: resumeData?.projects || [],
    education: resumeData?.education || [],
    experience: resumeData?.experience || [],
    certifications: resumeData?.certifications || [],
    summary: resumeData?.summary || '',
  };

  const mappings = calculateSkillEvidenceMapping(
    safeData.skills,
    safeData.projects,
    safeData.certifications,
    evidenceList
  );

  const totalSkills = mappings.length;
  const strongCount = mappings.filter((m) => m.status === 'Strong Evidence').length;
  const supportedCount = mappings.filter((m) => m.status === 'Supported').length;
  const limitedCount = mappings.filter((m) => m.status === 'Limited Evidence').length;
  const missingCount = mappings.filter((m) => m.status === 'Missing').length;

  // ── Dynamic scores strictly based on actual resume content ──

  // ATS score (0 to 100): strictly calculated from present components
  let atsScore = 0;
  if (safeData.fullName?.trim()) atsScore += 10;
  if (safeData.email?.trim() || safeData.phone?.trim()) atsScore += 10;
  if (safeData.summary && safeData.summary.length > 80) atsScore += 20;
  else if (safeData.summary && safeData.summary.length > 20) atsScore += 10;
  if (safeData.experience.length >= 1) atsScore += Math.min(20, safeData.experience.length * 10);
  if (safeData.education.length >= 1) atsScore += Math.min(15, safeData.education.length * 8);
  if (safeData.skills.length >= 1) atsScore += Math.min(15, safeData.skills.length * 3);
  if (safeData.projects.length >= 1) atsScore += Math.min(10, safeData.projects.length * 5);
  atsScore = Math.min(100, Math.max(0, atsScore));

  // Role alignment (0 to 100)
  let roleAlignment = 0;
  const effectiveRole = targetRole || safeData.targetRole || '';
  if (effectiveRole && safeData.skills.length > 0) {
    const roleKeywords = effectiveRole.toLowerCase().split(/[\s,/]+/).filter(Boolean);
    const skillNames = safeData.skills.map((s) => s.name.toLowerCase());
    const roleMatches = roleKeywords.filter((kw) =>
      skillNames.some((sk) => sk.includes(kw))
    ).length;
    const matchRatio = roleKeywords.length > 0 ? roleMatches / roleKeywords.length : 0;
    roleAlignment = Math.round(matchRatio * 70) + (strongCount * 5) + (supportedCount * 2);
    roleAlignment = Math.min(100, Math.max(0, roleAlignment));
  } else if (safeData.skills.length > 0) {
    roleAlignment = Math.min(100, 30 + safeData.skills.length * 5);
  }

  // Skill coverage: ratio of evidence-backed skills (0 if no skills)
  const skillCoverage = totalSkills > 0
    ? Math.min(100, Math.round(((strongCount + supportedCount) / totalSkills) * 100))
    : 0;

  // Evidence coverage: strong evidence ratio
  const evidenceCoverage = totalSkills > 0
    ? Math.min(100, Math.round((strongCount / totalSkills) * 100))
    : 0;

  // Project strength (0 to 100)
  let projectStrength = 0;
  if (safeData.projects.length > 0) {
    projectStrength += Math.min(40, safeData.projects.length * 15);
    projectStrength += Math.min(30, safeData.projects.filter((p) => p.link?.trim()).length * 15);
    projectStrength += Math.min(30, safeData.projects.filter((p) => (p.technologies || []).length > 0).length * 10);
    projectStrength = Math.min(100, Math.max(0, projectStrength));
  }

  // Missing info score = % of skills missing evidence
  const missingInformationScore = totalSkills > 0
    ? Math.round((missingCount / totalSkills) * 100)
    : 0;

  const scoreComponents = [atsScore, roleAlignment, skillCoverage, evidenceCoverage, projectStrength];
  const activeCount = scoreComponents.filter((s) => s > 0).length;
  const overallScore = activeCount > 0
    ? Math.round(scoreComponents.reduce((a, b) => a + b, 0) / scoreComponents.length)
    : 0;

  // ── Detected skills list ──────────────────────────────────
  const detectedSkills = mappings.map((m) => ({
    name: m.skill,
    status: m.status,
    proofCount: m.evidenceList.length,
  }));

  // ── Strengths (derived purely from actual resume data) ─────
  const strengths: string[] = [];
  if (strongCount > 0) {
    strengths.push(`${strongCount} skill${strongCount > 1 ? 's' : ''} backed by direct project / certification evidence`);
  }
  if (safeData.experience.length >= 2) {
    strengths.push(`${safeData.experience.length} career experience positions documented`);
  } else if (safeData.experience.length === 1) {
    strengths.push(`Work experience documented at ${safeData.experience[0].company || 'organization'}`);
  }
  if (safeData.projects.length >= 2) {
    strengths.push(`${safeData.projects.length} technical projects detailed`);
  }
  if (safeData.certifications.length > 0) {
    strengths.push(`${safeData.certifications.length} verified certification${safeData.certifications.length > 1 ? 's' : ''}`);
  }

  // ── Weaknesses ────────────────────────────────────────────
  const weaknesses: string[] = [];
  if (!safeData.summary || safeData.summary.length < 40) {
    weaknesses.push('Professional summary is brief or missing');
  }
  if (limitedCount > 0) {
    weaknesses.push(`${limitedCount} listed skill${limitedCount > 1 ? 's lack' : ' lacks'} supporting project or assessment proof`);
  }
  if (safeData.projects.some((p) => !p.link)) {
    weaknesses.push('One or more projects do not have live URLs or GitHub links attached');
  }
  if (safeData.experience.length === 0) {
    weaknesses.push('No formal work experience listed yet');
  }

  // ── Missing Keywords ──────────────────────────────────────
  const missingKeywords: string[] = [];
  if (effectiveRole) {
    const roleKws = effectiveRole.toLowerCase().split(/[\s,/]+/).filter(Boolean);
    const existing = safeData.skills.map((s) => s.name.toLowerCase());
    for (const kw of roleKws) {
      if (!existing.some((s) => s.includes(kw))) {
        missingKeywords.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    }
  }

  // ── Improvements ──────────────────────────────────────────
  const improvements: string[] = [];
  if (limitedCount > 0) {
    improvements.push(`Link repository URLs or certifications to your ${limitedCount} unverified skills.`);
  }
  if (safeData.projects.length < 2) {
    improvements.push('Add at least 2 technical projects with descriptions and links to showcase capability.');
  }
  if (!safeData.summary) {
    improvements.push('Add an impactful professional summary highlighting your core strengths.');
  }

  // ── Summary ───────────────────────────────────────────────
  const summary = `Resume contains ${totalSkills} skill${totalSkills !== 1 ? 's' : ''}, ${safeData.projects.length} project${safeData.projects.length !== 1 ? 's' : ''}, and ${safeData.experience.length} experience item${safeData.experience.length !== 1 ? 's' : ''}. Overall ATS compatibility is ${atsScore}%.`;

  return {
    score: overallScore,
    atsScore,
    roleAlignment,
    skillCoverage,
    evidenceCoverage,
    projectStrength,
    missingInformationScore,
    summary,
    strengths,
    weaknesses,
    missingKeywords,
    improvements,
    detectedSkills,
  };
};
