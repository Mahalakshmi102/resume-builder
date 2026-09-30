// ============================================================
// ResumeArchitect Backend — Types
// Shared type definitions used across the backend.
// ============================================================

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  targetRole?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications?: Certification[];
  templateId: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrent: boolean;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
  evidenceStatus?: string;
}

export interface Project {
  id: string;
  title: string;
  link: string;
  description: string;
  technologies?: string[];
  evidenceUrl?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface EvidenceItem {
  id: string;
  skill: string;
  type: string;
  title: string;
  url?: string;
  description: string;
  scoreOrResult?: string;
  date?: string;
  status: string;
}

// ---- AI Analysis Result ----
export interface AnalysisResult {
  score: number;
  atsScore: number;
  roleAlignment: number;
  skillCoverage: number;
  evidenceCoverage: number;
  projectStrength: number;
  missingInformationScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  improvements: string[];
  detectedSkills: DetectedSkill[];
}

export interface DetectedSkill {
  name: string;
  status: 'Strong Evidence' | 'Supported' | 'Limited Evidence' | 'Missing';
  proofCount: number;
}

// ---- Job Match ----
export interface JobDescriptionMatch {
  targetRole: string;
  overallMatchScore: number;
  matchedSkillsCount: number;
  partialMatchCount: number;
  missingSkillsCount: number;
  matchedSkills: MatchedSkill[];
  skillGaps: {
    supported: string[];
    limited: string[];
    missing: string[];
  };
}

export interface MatchedSkill {
  skill: string;
  status: 'Supported' | 'Limited Evidence' | 'Missing';
  explanation: string;
  evidenceFound: string[];
}

// ---- GitHub Evidence ----
export interface GitHubVerificationResult {
  repoUrl: string;
  isValid: boolean;
  repoName?: string;
  ownerName?: string;
  description?: string;
  language?: string;
  languages?: Record<string, number>;
  stars?: number;
  forks?: number;
  lastUpdated?: string;
  topics?: string[];
  hasReadme?: boolean;
  commitCount?: number;
  evidenceStatus: 'Strong Evidence' | 'Supported' | 'Limited Evidence' | 'Not Found';
  message: string;
}

// ---- Resume Claim ----
export interface ResumeClaim {
  id: string;
  claim: string;
  evidenceFound: string[];
  evidenceMissing: string[];
  status: 'Supported' | 'Limited Evidence' | 'Evidence Not Found';
  suggestedWording: string;
}
