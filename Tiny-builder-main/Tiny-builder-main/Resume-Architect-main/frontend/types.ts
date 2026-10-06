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
  evidenceStatus?: 'Strong Evidence' | 'Supported' | 'Limited Evidence' | 'Missing';
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
  templateId: 'modern' | 'classic' | 'minimal' | 'sidebar' | 'executive' | 'creative' | 'developer';
  sections?: Record<string, boolean>;
}

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
  detectedSkills: {
    name: string;
    status: 'Strong Evidence' | 'Supported' | 'Limited Evidence' | 'Missing';
    proofCount: number;
  }[];
}

export type EvidenceType =
  | 'GitHub Project'
  | 'Project'
  | 'Certification'
  | 'Assessment'
  | 'Internship'
  | 'Course'
  | 'Competition'
  | 'Achievement';

export interface EvidenceItem {
  id: string;
  skill: string;
  type: EvidenceType;
  title: string;
  url?: string;
  description: string;
  scoreOrResult?: string;
  date?: string;
  status: 'Prototype Evidence Check' | 'Evidence Status' | 'Verified' | 'Strong Evidence' | 'Supported' | 'Limited Evidence' | 'Not Found';

}

export interface SkillEvidenceMapping {
  skill: string;
  status: 'Strong Evidence' | 'Supported' | 'Limited Evidence' | 'Missing';
  evidenceList: EvidenceItem[];
  resumeMention: boolean;
  whySupported: string;
}

export interface ResumeClaim {
  id: string;
  claim: string;
  evidenceFound: string[];
  evidenceMissing: string[];
  status: 'Supported' | 'Limited Evidence' | 'Evidence Not Found';
  suggestedWording: string;
}

export interface JobDescriptionMatch {
  targetRole: string;
  overallMatchScore: number;
  matchedSkillsCount: number;
  partialMatchCount: number;
  missingSkillsCount: number;
  matchedSkills: {
    skill: string;
    status: 'Supported' | 'Limited Evidence' | 'Missing';
    explanation: string;
    evidenceFound: string[];
  }[];
  skillGaps: {
    supported: string[];
    limited: string[];
    missing: string[];
  };
}

export interface ImprovementRecommendation {
  id: string;
  category: 'Evidence' | 'Skill' | 'Project' | 'Formatting' | 'Impact';
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  actionableStep: string;
}

export interface CareerMetrics {
  totalProjects: number;
  totalCertifications: number;
  totalAssessments: number;
  evidenceBackedSkills: number;
  skillsNeedingEvidence: number;
  roleMatchesCount: number;
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