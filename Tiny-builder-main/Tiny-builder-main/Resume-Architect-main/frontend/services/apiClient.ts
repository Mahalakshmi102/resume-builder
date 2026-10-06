// ============================================================
// apiClient.ts — Frontend API Client
// Connects the React frontend to the Express backend.
// All backend calls flow through this single file.
// If backend is unreachable, falls back to client-side logic.
// ============================================================

const BACKEND_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BACKEND_URL) || 'http://localhost:5000';


// ============================================================
// Base fetch helper with error handling
// ============================================================
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${BACKEND_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorBody.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
};

// ============================================================
// Check if backend server is reachable
// ============================================================
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
};

// ============================================================
// AI — Enhance section text
// ============================================================
export const enhanceTextAPI = async (
  text: string,
  context: 'summary' | 'experience' | 'project'
): Promise<string> => {
  const result = await apiCall<{ enhanced?: string; enhancedText?: string }>('/api/ai/enhance', {
    method: 'POST',
    body: JSON.stringify({ text, context }),
  });
  return result.enhancedText || result.enhanced || '';
};

// ============================================================
// AI — Full resume analysis
// ============================================================
export const analyzeResumeAPI = async (
  resumeData: any,
  evidenceList: any[],
  targetRole: string
): Promise<any> => {
  return apiCall('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ resumeData, evidenceList, targetRole }),
  });
};

// ============================================================
// AI — Job description match analysis
// ============================================================
export const analyzeJobDescriptionAPI = async (
  resumeData: any,
  evidenceList: any[],
  jobDescription: string,
  targetRole: string
): Promise<any> => {
  return apiCall('/api/ai/analyze-job', {
    method: 'POST',
    body: JSON.stringify({ resumeData, evidenceList, jobDescription, targetRole }),
  });
};

// ============================================================
// AI — Generate tailored role-based resume
// ============================================================
export const generateRoleResumeAPI = async (
  resumeData: any,
  targetRole: string,
  jobDescription: string
): Promise<any> => {
  const result = await apiCall<{ resumeData?: any; [key: string]: any }>('/api/ai/generate-resume', {
    method: 'POST',
    body: JSON.stringify({ resumeData, targetRole, jobDescription }),
  });
  return result.resumeData || result;
};

// ============================================================
// AI — Get improvement recommendations
// ============================================================
export const getRecommendationsAPI = async (
  resumeData: any,
  analysisResult: any,
  targetRole: string
): Promise<string[]> => {
  const result = await apiCall<{ recommendations: string[] }>('/api/ai/recommendations', {
    method: 'POST',
    body: JSON.stringify({ resumeData, analysisResult, targetRole }),
  });
  return result.recommendations;
};

// ============================================================
// AI — Upload and analyze PDF resume
// ============================================================
export const analyzePDFResumeAPI = async (
  file: File,
  targetRole: string = 'Frontend Developer'
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetRole', targetRole);

  const response = await fetch(`${BACKEND_URL}/api/ai/analyze-pdf`, {
    method: 'POST',
    body: formData, // No Content-Type header — browser sets multipart boundary
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// ============================================================
// Evidence — Verify GitHub repository
// ============================================================
export const verifyGitHubRepoAPI = async (
  url: string,
  skillName?: string
): Promise<any> => {
  return apiCall('/api/evidence/verify-github', {
    method: 'POST',
    body: JSON.stringify({ url, skillName }),
  });
};

// ============================================================
// Evidence — Get GitHub user's public repositories
// ============================================================
export const getGitHubProfileAPI = async (username: string): Promise<any> => {
  return apiCall(`/api/evidence/github-profile/${encodeURIComponent(username)}`);
};

// ============================================================
// Evidence — Verify any URL is reachable
// ============================================================
export const verifyUrlAPI = async (url: string): Promise<any> => {
  return apiCall('/api/evidence/verify-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
};

// ============================================================
// Resume — Save session to backend
// ============================================================
export const saveResumeSessionAPI = async (
  resumeData: any,
  sessionId?: string
): Promise<{ sessionId: string; message: string }> => {
  return apiCall('/api/resume/save', {
    method: 'POST',
    body: JSON.stringify({ resumeData, sessionId }),
  });
};

// ============================================================
// Resume — Load session from backend
// ============================================================
export const loadResumeSessionAPI = async (sessionId: string): Promise<any> => {
  return apiCall(`/api/resume/${sessionId}`);
};

// ============================================================
// AI Rehearsal — Generate Mock Interview Questions
// ============================================================
export const fetchInterviewQuestionsAPI = async (
  resumeData: any,
  targetRole?: string,
  interviewStyle?: string,
  jobDescription?: string
): Promise<any> => {
  return apiCall('/api/ai/interview-questions', {
    method: 'POST',
    body: JSON.stringify({ resumeData, targetRole, interviewStyle, jobDescription }),
  });
};

// ============================================================
// AI Rehearsal — Evaluate Candidate's Answer
// ============================================================
export const evaluateInterviewAnswerAPI = async (
  question: string,
  interviewerIntent: string,
  candidateAnswer: string,
  resumeContext?: string,
  modelAnswerOutline?: string[],
  category?: string
): Promise<any> => {
  return apiCall('/api/ai/evaluate-answer', {
    method: 'POST',
    body: JSON.stringify({ question, interviewerIntent, candidateAnswer, resumeContext, modelAnswerOutline, category }),
  });
};

