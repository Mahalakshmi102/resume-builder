import {
  enhanceTextAPI,
  analyzeResumeAPI,
  analyzeJobDescriptionAPI,
  generateRoleResumeAPI,
  getRecommendationsAPI,
  checkBackendHealth,
  verifyGitHubRepoAPI,
  getInterviewQuestionsAPI,
  evaluateInterviewAnswerAPI,
} from './apiClient';
import { analyzeResumeData } from './resumeAnalyzer';
import { analyzeJobDescription as localAnalyzeJD, generateRoleBasedResumeContent } from './jobMatcher';
import { verifyResumeClaims, getWhyThisSkill } from './evidenceEngine';
import { ResumeData, EvidenceItem, AnalysisResult, JobDescriptionMatch, ResumeClaim, InterviewQuestion, AnswerFeedback } from '../types';

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

// ============================================================
// AI Mock Interviewer Rehearsal
// ============================================================
export const fetchMockInterviewQuestions = async (
  resumeData: ResumeData,
  targetRole: string = '',
  interviewType: string = 'mixed',
  difficulty: string = 'mid'
): Promise<InterviewQuestion[]> => {
  const backendOk = await isBackendAvailable();
  if (backendOk) {
    try {
      const res = await getInterviewQuestionsAPI(resumeData, targetRole, interviewType, difficulty);
      if (res && Array.isArray(res.questions)) {
        return res.questions;
      }
    } catch (err) {
      console.warn('[aiService] Backend interview questions failed, using local fallback:', err);
    }
  }

  // Fallback client-side generator based on active resume
  return generateClientInterviewQuestions(resumeData, targetRole, difficulty);
};

export const submitPracticeAnswer = async (
  question: string,
  userAnswer: string,
  resumeContext: string = '',
  targetRole: string = ''
): Promise<AnswerFeedback> => {
  const backendOk = await isBackendAvailable();
  if (backendOk) {
    try {
      return await evaluateInterviewAnswerAPI(question, userAnswer, resumeContext, targetRole);
    } catch (err) {
      console.warn('[aiService] Backend answer evaluation failed, using fallback:', err);
    }
  }

  const wordCount = userAnswer.trim().split(/\s+/).length;
  const score = Math.min(95, Math.max(50, wordCount * 2));
  return {
    score,
    verdict: score >= 80 ? 'Hire' : 'Needs Practice',
    strengths: ['Directly responded to the question prompt with structured communication.'],
    improvements: ['Include more quantifiable metrics and describe alternative solutions you considered.'],
    modelAnswer: 'A high-impact response starts with the core problem, describes the engineering architecture, and highlights measurable results.',
  };
};

const generateClientInterviewQuestions = (
  resumeData: ResumeData,
  role: string,
  difficulty: string
): InterviewQuestion[] => {
  const diffLevel = difficulty === 'senior' ? 'Senior' : difficulty === 'entry' ? 'Entry' : 'Mid';
  const effectiveRole = role || resumeData.targetRole || 'Software Engineer';
  const skills = (resumeData.skills || []).map((s) => s.name);
  const projects = resumeData.projects || [];
  const list: InterviewQuestion[] = [];

  if (projects.length > 0) {
    const p = projects[0];
    list.push({
      id: 'q-cl-proj-1',
      category: 'Project Deep Dive',
      question: `In your project "${p.title}", what was your most critical architectural decision, and why did you choose that approach?`,
      context: `From your project "${p.title}": ${p.description.substring(0, 100)}...`,
      interviewerIntent: 'Evaluating technical depth, system design reasoning, and hands-on ownership.',
      suggestedTalkingPoints: [
        'Context of the project requirements',
        'Specific technologies chosen and trade-offs considered',
        'Performance, security, or maintainability outcome',
      ],
      sampleGoodAnswer: `In ${p.title}, decoupling state management from the rendering layer was critical. By introducing structured asynchronous data fetching, we minimized unnecessary renders and maintained high responsiveness even under heavy simulated load.`,
      difficulty: diffLevel as any,
    });
  }

  const topSkill = skills[0] || (effectiveRole.toLowerCase().includes('frontend') ? 'React' : 'TypeScript');
  list.push({
    id: 'q-cl-tech-1',
    category: 'Technical Verification',
    question: `You list ${topSkill} on your resume. How do you identify and resolve performance bottlenecks or memory leaks in production?`,
    context: `Based on your technical competency: ${topSkill}`,
    interviewerIntent: 'Verifying real production debugging and performance profiling experience.',
    suggestedTalkingPoints: [
      `Key profiling tools for ${topSkill}`,
      'Diagnosing memory retention and high latency',
      'Preventative patterns and automated monitoring',
    ],
    sampleGoodAnswer: `I profile memory and render cycles using dedicated devtools. In ${topSkill}, common issues stem from uncleaned event subscriptions, excessive re-renders, and bloated payloads. I systematically audit lifecycle cleanup and modularize bundle imports.`,
    difficulty: diffLevel as any,
  });

  list.push({
    id: 'q-cl-behav-1',
    category: 'Behavioral (STAR)',
    question: `Describe a situation where a project requirement changed midway through development. How did you adapt your timeline and communication?`,
    context: `Assessing collaboration and adaptability for ${effectiveRole}.`,
    interviewerIntent: 'Evaluating flexibility, proactive stakeholder communication, and delivery focus under pressure.',
    suggestedTalkingPoints: [
      'The initial scope vs the new requirement',
      'How you communicated impact to timeline or team',
      'The positive outcome delivered',
    ],
    sampleGoodAnswer: `When client specifications shifted mid-sprint, I conducted a rapid gap analysis, re-prioritized the backlog with the team, delivered the mission-critical path first, and scheduled non-blocking enhancements for the following sprint.`,
    difficulty: diffLevel as any,
  });

  list.push({
    id: 'q-cl-probe-1',
    category: 'Resume Probe',
    question: `Walk me through your development workflow from receiving a feature requirement to deploying it into production.`,
    context: `Evaluating overall engineering discipline and maturity.`,
    interviewerIntent: 'Assessing testing rigor, CI/CD awareness, code reviews, and production readiness.',
    suggestedTalkingPoints: [
      'Requirements breakdown and technical design',
      'TDD / Unit and integration testing',
      'Code review, CI validation, and staged deployment',
    ],
    sampleGoodAnswer: `I begin by breaking requirements into testable units, write clean code backed by automated unit tests, submit structured pull requests for peer review, and verify CI pipeline passes before deployment with rollback safeguards.`,
    difficulty: diffLevel as any,
  });

  return list;
};

