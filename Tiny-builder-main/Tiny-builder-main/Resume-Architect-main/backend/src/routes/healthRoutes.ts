// ============================================================
// Health Check Route — /api/health
// Returns server status, environment info, API key status,
// and Supabase database connection health.
// ============================================================
import { Router, Request, Response } from 'express';
import { checkSupabaseHealth } from '../services/supabaseService';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const geminiConfigured = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const githubConfigured = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_personal_access_token_here');
  
  const supabaseHealth = await checkSupabaseHealth();

  return res.json({
    status: 'OK',
    service: 'ResumeArchitect Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    apiKeys: {
      gemini: geminiConfigured ? 'Configured ✓' : 'NOT SET — AI features will fail',
      github: githubConfigured ? 'Configured ✓' : 'NOT SET — Evidence verification uses low rate limit',
      supabase: supabaseHealth.connected
        ? `Connected ✓ (${supabaseHealth.url})`
        : (supabaseHealth.configured ? `Configured, connecting... (${supabaseHealth.error || 'Pending schema'})` : 'Not configured (using in-memory storage)'),
    },
    database: {
      provider: 'Supabase PostgreSQL',
      connected: supabaseHealth.connected,
      configured: supabaseHealth.configured,
      url: supabaseHealth.url || null,
      notes: supabaseHealth.hasSchemaNotice ? supabaseHealth.error : (supabaseHealth.connected ? 'Operational' : 'Falling back to in-memory store'),
      schemaEndpoint: 'GET /api/resume/schema/sql',
    },
    endpoints: {
      health: 'GET /api/health',
      ai: {
        enhance: 'POST /api/ai/enhance',
        analyze: 'POST /api/ai/analyze',
        analyzeJob: 'POST /api/ai/analyze-job',
        generateResume: 'POST /api/ai/generate-resume',
        recommendations: 'POST /api/ai/recommendations',
        analyzePDF: 'POST /api/ai/analyze-pdf (multipart)',
      },
      evidence: {
        verifyGitHub: 'POST /api/evidence/verify-github',
        githubProfile: 'GET /api/evidence/github-profile/:username',
        verifyUrl: 'POST /api/evidence/verify-url',
        saveEvidence: 'POST /api/evidence',
        listEvidence: 'GET /api/evidence',
      },
      resume: {
        save: 'POST /api/resume/save',
        get: 'GET /api/resume/:id',
        delete: 'DELETE /api/resume/:id',
        list: 'GET /api/resume',
        schemaSql: 'GET /api/resume/schema/sql',
      },
    },
  });
});

export default router;
