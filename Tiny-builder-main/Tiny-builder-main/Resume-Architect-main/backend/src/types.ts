// ============================================================
// ResumeArchitect Backend — Types
// Shared type definitions used across the backend.
// ============================================================

export interface LanguageItem {
  id: string;
  name: string;
  proficiency?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
}

export interface CustomSection {
  id: string;
  heading: string;
  items: string[];
  content?: string;
}

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
  languages?: LanguageItem[];
  achievements?: AchievementItem[];
  interests?: string[];
  customSections?: CustomSection[];
  rawText?: string;
  templateId: string;
  sections?: Record<string, boolean>;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrent: boolean;
  location?: string;
  highlights?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa?: string;
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

// ---- AI Rehearsal / Mock Interview ----
export interface InterviewAnswerFeedback {
  score: number;
  verdict: 'Strong Delivery' | 'Good Foundation' | 'Needs Practice';
  suitability: 'Direct & Accurate Match' | 'Partially Suitable' | 'Off-Topic / Mismatch';
  suitabilityAnalysis: string;
  strengths: string[];
  missingPoints: string[];
  recommendedResponse: string;
}

export interface InterviewQuestion {
  id: string;
  category: 'Project Deep-Dive' | 'Technical Skills' | 'Behavioral & Experience' | 'Challenging Scenario';
  question: string;
  contextFromResume: string;
  interviewerIntent: string;
  modelAnswerOutline: string[];
  difficulty: 'Standard' | 'Challenging' | 'Expert';
  userAnswer?: string;
  aiFeedback?: InterviewAnswerFeedback;
}

export interface RehearsalSession {
  targetRole: string;
  interviewStyle: 'Technical Screener' | 'Hiring Manager' | 'System Architect';
  questions: InterviewQuestion[];
  overallTips: string[];
}


