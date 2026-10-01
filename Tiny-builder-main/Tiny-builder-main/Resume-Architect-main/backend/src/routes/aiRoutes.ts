// ============================================================
// AI Routes — /api/ai
// Handles all Gemini AI operations:
//   POST /api/ai/enhance         — Enhance resume section text
//   POST /api/ai/analyze         — Full resume analysis (ATS+Evidence)
//   POST /api/ai/analyze-job     — Job description vs resume match
//   POST /api/ai/generate-resume — Role-based tailored resume
//   POST /api/ai/recommendations — Get improvement recommendations
//   POST /api/ai/analyze-pdf     — Upload, extract & parse PDF into ResumeData
//   POST /api/ai/parse-text      — Parse raw resume text into ResumeData
// ============================================================
import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  enhanceText,
  analyzeResume,
  analyzeJobDescription,
  generateRoleBasedResume,
  generateImprovementRecommendations,
  parseResumeFromText,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
} from '../services/geminiService';
import { extractTextFromPDF, extractTextFromFile, getPDFMetadata } from '../services/pdfService';
import { ResumeData, EvidenceItem } from '../types';

const router = Router();

// Multer config — memory storage, max 5MB, PDF/DOCX only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    // Also allow by extension for browsers that misreport MIME
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (allowed.includes(file.mimetype) || ext === 'pdf' || ext === 'docx' || ext === 'doc') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and DOC files are supported'));
    }
  },
});

// ============================================================
// POST /api/ai/enhance
// Body: { text: string, context: 'summary' | 'experience' | 'project' }
// Returns: { enhancedText: string }
// ============================================================
router.post('/enhance', async (req: Request, res: Response) => {
  try {
    const { text, context } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required and must be a string' });
    }

    if (!['summary', 'experience', 'project'].includes(context)) {
      return res.status(400).json({ error: 'context must be summary, experience, or project' });
    }

    const enhancedText = await enhanceText(text, context);
    return res.json({ enhancedText, enhanced: enhancedText });
  } catch (error: any) {
    console.error('[POST /ai/enhance]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/ai/analyze
// Body: { resumeData: ResumeData, evidenceList: EvidenceItem[], targetRole: string }
// Returns: AnalysisResult
// ============================================================
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { resumeData, evidenceList = [], targetRole = 'Frontend Developer' } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'resumeData is required' });
    }

    const result = await analyzeResume(
      resumeData as ResumeData,
      (evidenceList || []) as EvidenceItem[],
      targetRole
    );

    return res.json(result);
  } catch (error: any) {
    console.error('[POST /ai/analyze]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/ai/analyze-job
// Body: { resumeData, evidenceList, jobDescription, targetRole }
// Returns: JobDescriptionMatch
// ============================================================
router.post('/analyze-job', async (req: Request, res: Response) => {
  try {
    const { resumeData, evidenceList = [], jobDescription, targetRole = 'Frontend Developer' } = req.body;

    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'resumeData and jobDescription are required' });
    }

    const result = await analyzeJobDescription(
      resumeData as ResumeData,
      (evidenceList || []) as EvidenceItem[],
      jobDescription,
      targetRole
    );

    return res.json(result);
  } catch (error: any) {
    console.error('[POST /ai/analyze-job]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/ai/generate-resume
// Body: { resumeData, targetRole, jobDescription }
// Returns: ResumeData (role-tailored)
// ============================================================
router.post('/generate-resume', async (req: Request, res: Response) => {
  try {
    const { resumeData, targetRole, jobDescription } = req.body;

    if (!resumeData || !targetRole || !jobDescription) {
      return res.status(400).json({ error: 'resumeData, targetRole, and jobDescription are required' });
    }

    const tailoredResume = await generateRoleBasedResume(
      resumeData as ResumeData,
      targetRole,
      jobDescription
    );

    return res.json({ resumeData: tailoredResume, ...tailoredResume });
  } catch (error: any) {
    console.error('[POST /ai/generate-resume]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/ai/recommendations
// Body: { resumeData, analysisResult, targetRole }
// Returns: { recommendations: string[] }
// ============================================================
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { resumeData, analysisResult, targetRole } = req.body;

    if (!resumeData || !analysisResult) {
      return res.status(400).json({ error: 'resumeData and analysisResult are required' });
    }

    const recommendations = await generateImprovementRecommendations(
      resumeData,
      analysisResult,
      targetRole || 'Frontend Developer'
    );

    return res.json({ recommendations });
  } catch (error: any) {
    console.error('[POST /ai/recommendations]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/ai/parse-text
// Body: { text: string, targetRole?: string }
// Returns: { parsedResume: ResumeData }
// ============================================================
router.post('/parse-text', async (req: Request, res: Response) => {
  try {
    const { text, targetRole = 'Software Engineer' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    const parsedResume = await parseResumeFromText(text, targetRole);
    return res.json({ parsedResume });
  } catch (error: any) {
    console.error('[POST /ai/parse-text]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/ai/analyze-pdf
// Form Data: file (PDF/DOCX), targetRole (optional)
// Returns: AnalysisResult + extractedText + parsedResume + metadata
// ============================================================
router.post('/analyze-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send a PDF as multipart form field named "file".' });
    }

    const targetRole = (req.body.targetRole as string) || 'Frontend Developer';

    // Extract text from PDF or DOCX
    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    } catch (extractErr: any) {
      return res.status(422).json({
        error: `File extraction failed: ${extractErr.message}`,
        hint: 'Ensure you are uploading a text-based PDF or a valid DOCX file. Scanned/image PDFs are not supported.',
      });
    }

    // Parse extracted text into structured ResumeData
    const parsedResume = await parseResumeFromText(extractedText, targetRole);

    // Analyze the parsed resume
    const result = await analyzeResume(parsedResume, [], targetRole);

    // Get file metadata (only available for PDFs)
    let metadata = { numpages: 1, wordCount: extractedText.split(/\s+/).filter(Boolean).length, charCount: extractedText.length };
    if (req.file.mimetype === 'application/pdf') {
      try { metadata = await getPDFMetadata(req.file.buffer); } catch { /* use default */ }
    }

    return res.json({
      analysis: result,
      extractedText: extractedText.substring(0, 2000), // Return preview snippet
      parsedResume, // Full structured ResumeData ready for Resume Builder!
      metadata,
      targetRole,
    });
  } catch (error: any) {
    console.error('[POST /ai/analyze-pdf]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/ai/interview-questions
// Body: { resumeData: ResumeData, targetRole?: string, interviewType?: string, difficulty?: string }
// Returns: { questions: InterviewQuestion[] }
// ============================================================
router.post('/interview-questions', async (req: Request, res: Response) => {
  try {
    const { resumeData, targetRole, interviewType, difficulty } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'resumeData is required' });
    }

    const questions = await generateInterviewQuestions(
      resumeData as ResumeData,
      targetRole || resumeData.targetRole || '',
      interviewType || 'mixed',
      difficulty || 'mid'
    );

    return res.json({ questions });
  } catch (error: any) {
    console.error('[POST /ai/interview-questions]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/ai/interview-feedback
// Body: { question: string, userAnswer: string, resumeContext?: string, targetRole?: string }
// Returns: AnswerFeedback
// ============================================================
router.post('/interview-feedback', async (req: Request, res: Response) => {
  try {
    const { question, userAnswer, resumeContext, targetRole } = req.body;
    if (!question || !userAnswer) {
      return res.status(400).json({ error: 'question and userAnswer are required' });
    }

    const feedback = await evaluateInterviewAnswer(
      question,
      userAnswer,
      resumeContext || '',
      targetRole || ''
    );

    return res.json(feedback);
  } catch (error: any) {
    console.error('[POST /ai/interview-feedback]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
