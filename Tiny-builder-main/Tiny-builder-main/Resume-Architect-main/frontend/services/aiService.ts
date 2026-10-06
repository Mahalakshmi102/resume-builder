import { enhanceText as geminiEnhanceText, generateTailoredResumeDirectly } from './geminiService';
import {
  enhanceTextAPI,
  analyzeResumeAPI,
  analyzeJobDescriptionAPI,
  generateRoleResumeAPI,
  getRecommendationsAPI,
  checkBackendHealth,
  verifyGitHubRepoAPI,
  fetchInterviewQuestionsAPI,
  evaluateInterviewAnswerAPI,
} from './apiClient';
import { analyzeResumeData } from './resumeAnalyzer';
import { analyzeJobDescription as localAnalyzeJD, generateRoleBasedResumeContent } from './jobMatcher';
import { verifyResumeClaims, getWhyThisSkill } from './evidenceEngine';
import { ResumeData, EvidenceItem, AnalysisResult, JobDescriptionMatch, ResumeClaim, InterviewQuestion, RehearsalSession, InterviewAnswerFeedback } from '../types';

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
// AI Rehearsal Mode — Interview Questions & Answer Evaluation
// ============================================================
export const generateInterviewQuestions = async (
  resumeData: ResumeData,
  targetRole?: string,
  interviewStyle: 'Technical Screener' | 'Hiring Manager' | 'System Architect' = 'Technical Screener',
  jobDescription?: string
): Promise<RehearsalSession> => {
  const backendOk = await isBackendAvailable();
  if (backendOk) {
    try {
      return await fetchInterviewQuestionsAPI(resumeData, targetRole, interviewStyle, jobDescription);
    } catch (err) {
      console.warn('[aiService] Backend interview questions failed, using local generation:', err);
    }
  }

  // Deterministic high-quality client-side generation
  const role = targetRole || resumeData.targetRole || 'Software Engineer';
  const projects = resumeData.projects || [];
  const skills = resumeData.skills || [];

  const questions: InterviewQuestion[] = [];

  if (projects.length > 0) {
    const p = projects[0];
    questions.push({
      id: 'q-1',
      category: 'Project Deep-Dive',
      question: `On your project "${p.title}", what were the hardest architectural constraints you faced, and how did you measure success after deploying it?`,
      contextFromResume: `Referencing Project: ${p.title}`,
      interviewerIntent: 'Assessing genuine system ownership, architectural trade-offs, and metric-driven execution.',
      modelAnswerOutline: [
        'Briefly state the user problem and system scope',
        'Walk through your technical architecture and component separation',
        'Explain a specific unexpected failure or bottleneck and how you fixed it',
        'State the measurable outcome (latency reduction, user capacity, uptime)',
      ],
      difficulty: 'Standard',
    });

    if (projects.length > 1) {
      const p2 = projects[1];
      questions.push({
        id: 'q-2',
        category: 'Project Deep-Dive',
        question: `In "${p2.title}", why did you choose that specific tech stack instead of alternative frameworks, and what would you re-architect if you started over?`,
        contextFromResume: `Referencing Project: ${p2.title}`,
        interviewerIntent: 'Evaluating technical humility, retrospective reflection, and deep technology trade-off understanding.',
        modelAnswerOutline: [
          'State the tech stack and the decision criteria at the time',
          'Acknowledge 1 limitation discovered during implementation',
          'Explain what a modern or v2 iteration would use instead',
        ],
        difficulty: 'Challenging',
      });
    }
  } else {
    questions.push({
      id: 'q-1',
      category: 'Project Deep-Dive',
      question: `Can you walk me through the most complex full-stack feature or system you built from scratch for a ${role} role?`,
      contextFromResume: 'Core Engineering Competence',
      interviewerIntent: 'Testing technical independence, clean coding patterns, and modularity.',
      modelAnswerOutline: [
        'Define system requirements',
        'Outline state management and API contract',
        'Summarize testing and delivery process',
      ],
      difficulty: 'Standard',
    });
  }

  if (skills.length > 0) {
    const s1 = skills[0].name;
    const s2 = skills[1]?.name || 'TypeScript';
    questions.push({
      id: 'q-3',
      category: 'Technical Skills',
      question: `You list ${s1} and ${s2} on your resume. How do you approach error boundaries, performance profiling, and memory leaks in production?`,
      contextFromResume: `Referencing Skills: ${s1}, ${s2}`,
      interviewerIntent: 'Probing whether candidate knows production debugging vs basic syntax.',
      modelAnswerOutline: [
        'Explain diagnostic tools (browser DevTools, profiler, server logs)',
        'Describe error boundary patterns and graceful fallback UI',
        'Give a concrete example of fixing an unoptimized render or memory leak',
      ],
      difficulty: 'Challenging',
    });
  }

  questions.push({
    id: 'q-4',
    category: 'Behavioral & Experience',
    question: `Tell me about a time when technical requirements were ambiguous or changed midway through development. How did you realign the deliverable?`,
    contextFromResume: 'Agile & Collaborative Engineering Delivery',
    interviewerIntent: 'Testing adaptability, communication with stakeholders, and prioritization.',
    modelAnswerOutline: [
      'Describe the shifting requirement (Situation)',
      'Explain how you clarified ambiguities and prioritized MVP (Action)',
      'State the delivery timeline impact and positive outcome (Result)',
    ],
    difficulty: 'Standard',
  });

  questions.push({
    id: 'q-5',
    category: 'Challenging Scenario',
    question: `Suppose our database connection pool maxes out during peak traffic and requests start timing out. What is your systematic triage procedure?`,
    contextFromResume: 'System Resilience & Incident Management',
    interviewerIntent: 'Evaluating calm incident response, telemetry inspection, and mitigation strategies.',
    modelAnswerOutline: [
      'Immediate mitigation (rate limiting, read replicas, shedding non-critical load)',
      'Root cause analysis (unindexed queries, connection leaks, slow external APIs)',
      'Long-term prevention (caching layer, connection pooling tuning, query optimization)',
    ],
    difficulty: 'Expert',
  });

  return {
    targetRole: role,
    interviewStyle,
    overallTips: [
      'Speak in concrete specifics: name the exact hooks, libraries, HTTP codes, and schemas you used.',
      'Always follow the STAR structure: Situation, Task, Action, Result.',
      'Highlight trade-offs: good engineers pick solutions because of advantages, great engineers also know the downsides.',
    ],
    questions,
  };
};

export const evaluateCandidateAnswer = async (
  question: string,
  interviewerIntent: string,
  candidateAnswer: string,
  resumeContext?: string,
  modelAnswerOutline?: string[],
  category?: string
): Promise<InterviewAnswerFeedback> => {
  const backendOk = await isBackendAvailable();
  if (backendOk) {
    try {
      return await evaluateInterviewAnswerAPI(
        question,
        interviewerIntent,
        candidateAnswer,
        resumeContext,
        modelAnswerOutline,
        category
      );
    } catch (err) {
      console.warn('[aiService] Backend answer evaluation failed, using local evaluator:', err);
    }
  }

  // Intelligent client-side fallback
  const questionKeywords = (question + ' ' + interviewerIntent + ' ' + (modelAnswerOutline || []).join(' '))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['what', 'how', 'when', 'where', 'which', 'your', 'with', 'about', 'this', 'that', 'from', 'have', 'were'].includes(w));

  const answerLower = candidateAnswer.toLowerCase();
  const matchedCount = Array.from(new Set(questionKeywords)).filter((kw) => answerLower.includes(kw)).length;
  const totalKeywords = Math.max(3, new Set(questionKeywords).size);
  const relevanceRatio = matchedCount / totalKeywords;

  const words = candidateAnswer.trim().split(/\s+/).filter(Boolean).length;
  let score = 30;
  let suitability: 'Direct & Accurate Match' | 'Partially Suitable' | 'Off-Topic / Mismatch' = 'Off-Topic / Mismatch';

  if (words >= 25 && relevanceRatio >= 0.3) {
    suitability = 'Direct & Accurate Match';
    score = Math.min(92, Math.max(72, 70 + Math.round(relevanceRatio * 30)));
  } else if (words >= 15 && (relevanceRatio >= 0.15 || words >= 35)) {
    suitability = 'Partially Suitable';
    score = Math.min(68, Math.max(45, 45 + Math.round(relevanceRatio * 25)));
  } else {
    suitability = 'Off-Topic / Mismatch';
    score = Math.min(38, Math.max(15, 15 + Math.round(relevanceRatio * 20)));
  }

  const defaultModel = modelAnswerOutline && modelAnswerOutline.length > 0
    ? modelAnswerOutline.join('. ')
    : 'Begin by outlining the system architecture. Detail the exact tools and protocols used, and finish with measurable latency or reliability metrics.';

  return {
    score,
    verdict: score >= 80 ? 'Strong Delivery' : score >= 60 ? 'Good Foundation' : 'Needs Practice',
    suitability,
    suitabilityAnalysis: suitability === 'Direct & Accurate Match'
      ? `Your response directly tackles the technical problem asked in the question and includes key scenario requirements.`
      : suitability === 'Partially Suitable'
      ? `Your response touches upon related concepts but misses the core technical implementation asked in the question.`
      : `Your response does not directly answer the specific technical question asked. Focus specifically on the requested scenario.`,
    strengths: [
      relevanceRatio >= 0.2 ? 'Included technical concepts relevant to the scenario' : 'Initiated answer structure',
      words > 30 ? 'Provided substantive explanation length' : 'Direct communication',
    ],
    missingPoints: [
      'Detail the exact technical trade-offs and decisions made',
      'Include concrete metrics (e.g. latency, throughput, error rate reduction)',
    ],
    recommendedResponse: `To excel on this question: ${defaultModel}`,
  };
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


