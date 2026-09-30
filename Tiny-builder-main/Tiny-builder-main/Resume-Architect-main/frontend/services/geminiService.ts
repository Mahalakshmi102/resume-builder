import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const enhanceText = async (text: string, context: 'summary' | 'experience' | 'project'): Promise<string> => {
  if (!text.trim()) return "";
  
  let prompt = "";
  if (context === 'summary') {
    prompt = `Rewrite the following resume professional summary to be more impactful, professional, and concise. Keep it under 4 sentences: "${text}"`;
  } else if (context === 'experience') {
    prompt = `Rewrite the following resume job description bullet points to use strong action verbs and quantify achievements where possible: "${text}"`;
  } else {
    prompt = `Rewrite the following project description to highlight technical skills, impact, and complexity: "${text}"`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini Enhancement Error:", error);
    return text; // Fallback to original
  }
};

export const analyzeResume = async (resumeText: string, jobDescription: string): Promise<AnalysisResult> => {
  try {
    const prompt = `
      You are an expert HR Recruiter and ATS (Applicant Tracking System) specialist.
      Analyze the following RESUME content against the provided JOB DESCRIPTION.
      
      JOB DESCRIPTION:
      ${jobDescription}

      RESUME CONTENT:
      ${resumeText}

      Provide a detailed analysis in JSON format including:
      - score (0-100 integer)
      - summary (short paragraph critique)
      - strengths (array of strings: what matches well)
      - weaknesses (array of strings: what is weak)
      - missingKeywords (array of strings: critical keywords from the JD that are missing in the resume)
      - improvements (array of specific actionable advice)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["score", "summary", "strengths", "weaknesses", "missingKeywords", "improvements"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze resume.");
  }
};

export const generateTailoredResumeDirectly = async (
  resumeData: any,
  targetRole: string,
  jobDescription: string
): Promise<any> => {
  try {
    const prompt = `
      You are an expert resume writer. Improve the following resume for the target role: "${targetRole}".
      Rewrite the professional summary and project descriptions to highlight relevant skills based on this Job Description:
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      CURRENT RESUME DATA:
      ${JSON.stringify({ summary: resumeData.summary, projects: resumeData.projects }, null, 2)}
      
      Return JSON:
      {
        "summary": "Updated summary here",
        "projects": [
          { "id": "original_id", "title": "...", "link": "...", "description": "Updated description" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      ...resumeData,
      targetRole,
      summary: parsed.summary || resumeData.summary,
      projects: parsed.projects && parsed.projects.length > 0 ? parsed.projects : resumeData.projects,
    };
  } catch (error) {
    console.error("Direct Gemini Generate Error:", error);
    throw error;
  }
};