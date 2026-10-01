import { enhanceText as geminiEnhanceText, generateTailoredResumeDirectly } from './geminiService';
import {
  enhanceTextAPI,
  analyzeResumeAPI,
  analyzeJobDescriptionAPI,
  generateRoleResumeAPI,
  getRecommendationsAPI,
  checkBackendHealth,
  verifyGitHubRepoAPI,
} from './apiClient';
import { analyzeResumeData } from './resumeAnalyzer';
import { analyzeJobDescription as localAnalyzeJD, generateRoleBasedResumeContent } from './jobMatcher';
import { verifyResumeClaims, getWhyThisSkill } from './evidenceEngine';
import { ResumeData, EvidenceItem, AnalysisResult, JobDescriptionMatch, ResumeClaim } from '../types';

/**
 * AI Service Abstraction Layer
 * 
 * This layer automatically:
 *   1. Tries the real backend API (Express + Gemini) first
 *   2. Falls back to deterministic client-side logic if backend is unavailable
 * 
 * To switch to full backend mode: ensure backend/.env is configured and
 * the Express server is running on PORT 5000.
 */

let _backendAvailable: boolean | null = null;

const isBackendAvailable = async (): Promise<boolean> => {
  if (_backendAvailable !== null) return _backendAvailable;
  _backendAvailable = await checkBackendHealth();
  // Reset cache after 30 seconds so we re-check periodically
  setTimeout(() => { _backendAvailable = null; }, 30000);
  return _backendAvailable;
};

// ============================================================
// Enhance Section Text (Summary / Experience / Project)
// ============================================================
export const enhanceSectionText = async (
  text: string,
  context: 'summary' | 'experience' | 'project'
): Promise<string> => {
  // Try backend first
  const backendOk = await isBackendAvailable();
  if (backendOk) {
    try {
      const enhanced = await enhanceTextAPI(text, context);
      if (enhanced && enhanced !== text) return enhanced;
    } catch (err) {
      console.warn('[aiService] Backend enhance failed, using local Gemini:', err);
    }
  }

  // Try direct Gemini (frontend key)
  try {
    const res = await geminiEnhanceText(text, context);
    if (res && res !== text) return res;
  } catch (err) {
    console.warn('[aiService] Direct Gemini failed, using local fallback:', err);
  }

  // Final local fallback: return original text without inventing unverified claims
  return text;
};

// ============================================================
// Full Resume Analysis (ATS + Evidence + Role Alignment)
// ============================================================
export const runFullResumeAnalysis = async (
  resumeData: ResumeData,
  evidenceList: EvidenceItem[],
  targetRole: string = 'Frontend Developer'
): Promise<AnalysisResult> => {
  const backendOk = await isBackendAvailable();
  if (backendOk) {
    try {
      return await analyzeResumeAPI(resumeData, evidenceList, targetRole);
    } catch (err) {
      console.warn('[aiService] Backend analysis failed, using local analyzer:', err);
    }
  }
  // Local fallback (synchronous deterministic)
  return analyzeResumeData(resumeData, evidenceList, targetRole);
};

// Synchronous version for immediate render (used on initial page load)
export const runFullResumeAnalysisSync = (
  resumeData: ResumeData,
  evidenceList: EvidenceItem[],
  targetRole: string = 'Frontend Developer'
): AnalysisResult => {
  return analyzeResumeData(resumeData, evidenceList, targetRole);
};

// ============================================================
// Job Description Analysis
// ============================================================
export const runJobMatchAnalysis = async (
  jobDescriptionText: string,
  targetRole: string,
  resumeData: ResumeData,
  evidenceList: EvidenceItem[]
): Promise<JobDescriptionMatch> => {
  const backendOk = await isBackendAvailable();
  if (backendOk) {
    try {
      return await analyzeJobDescriptionAPI(resumeData, evidenceList, jobDescriptionText, targetRole);
    } catch (err) {
      console.warn('[aiService] Backend job analysis failed, using local:', err);
    }
  }
  return localAnalyzeJD(jobDescriptionText, targetRole, resumeData, evidenceList);
};

// Sync version for initial render
export const runJobMatchAnalysisSync = (
  jobDescriptionText: string,
  targetRole: string,
  resumeData: ResumeData,
  evidenceList: EvidenceItem[]
): JobDescriptionMatch => {
  return localAnalyzeJD(jobDescriptionText, targetRole, resumeData, evidenceList);
};

// ============================================================
// Generate Tailored Role-Based Resume
// ============================================================
export const generateTailoredRoleResume = async (
  resumeData: ResumeData,
  targetRole: string,
  jobDescriptionText: string
): Promise<ResumeData> => {
  const backendOk = await isBackendAvailable();
  if (backendOk) {
    try {
      return await generateRoleResumeAPI(resumeData, targetRole, jobDescriptionText);
    } catch (err) {
      console.warn('[aiService] Backend generation failed, trying direct frontend Gemini:', err);
    }
  }
  
  // Try direct frontend Gemini API
  try {
    return await generateTailoredResumeDirectly(resumeData, targetRole, jobDescriptionText);
  } catch (err) {
    console.warn('[aiService] Direct frontend Gemini failed, using hardcoded fallback:', err);
    return generateRoleBasedResumeContent(resumeData, targetRole, jobDescriptionText);
  }
};

// ============================================================
// Resume Claims Verification
// ============================================================
export const getClaimsVerification = (
  resumeData: ResumeData,
  evidenceList: EvidenceItem[]
): ResumeClaim[] => {
  return verifyResumeClaims(resumeData, evidenceList);
};

// ============================================================
// Skill Explainability ("Why This Skill?")
// ============================================================
export const getSkillExplainability = (
  skillName: string,
  resumeData: ResumeData,
  evidenceList: EvidenceItem[],
  targetRole: string
) => {
  return getWhyThisSkill(skillName, resumeData, evidenceList, targetRole);
};

// ============================================================
// GitHub Evidence Verification (via backend)
// ============================================================
export const verifyGitHubEvidence = async (url: string, skillName?: string) => {
  const backendOk = await isBackendAvailable();
  if (!backendOk) {
    return {
      isValid: true,
      evidenceStatus: 'Prototype Evidence Check',
      message: 'Backend not running — using frontend-only verification. Start the backend for real GitHub verification.',
    };
  }
  try {
    return await verifyGitHubRepoAPI(url, skillName);
  } catch (err: any) {
    return {
      isValid: false,
      evidenceStatus: 'Limited Evidence',
      message: err.message || 'GitHub verification failed',
    };
  }
};
