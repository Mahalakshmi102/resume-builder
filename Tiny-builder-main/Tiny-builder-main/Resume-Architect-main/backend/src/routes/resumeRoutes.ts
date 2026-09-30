// ============================================================
// Resume Routes — /api/resume
// Handles resume CRUD operations using Supabase with
// automatic in-memory fallback.
//   POST /api/resume/save        — Save a resume session
//   GET  /api/resume/:id         — Get resume by session ID
//   DELETE /api/resume/:id      — Delete resume session
//   GET  /api/resume             — List all resumes
// ============================================================
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ResumeData } from '../types';
import {
  saveResume,
  getResume,
  listResumes,
  deleteResume,
  SUPABASE_SQL_SCHEMA,
} from '../services/supabaseService';

const router = Router();

// ============================================================
// POST /api/resume/save
// Body: { resumeData: ResumeData, sessionId?: string }
// Returns: { sessionId, message, source, updatedAt }
// ============================================================
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { resumeData, sessionId } = req.body;

    if (!resumeData || !resumeData.fullName) {
      return res.status(400).json({ error: 'resumeData with fullName is required' });
    }

    const id = sessionId && sessionId.trim() ? sessionId.trim() : uuidv4();
    const result = await saveResume(id, resumeData);

    console.log(`[Resume] Saved session ${id} for "${resumeData.fullName}" (via ${result.source})`);
    return res.status(201).json({
      sessionId: id,
      message: `Resume saved successfully (${result.source})`,
      source: result.source,
      updatedAt: result.updatedAt,
    });
  } catch (error: any) {
    console.error('[POST /api/resume/save] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/resume/:id
// Returns: { sessionId, resumeData, source, createdAt, updatedAt }
// ============================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await getResume(id);

    if (!session) {
      return res.status(404).json({ error: `Resume session "${id}" not found` });
    }

    return res.json({
      sessionId: session.sessionId,
      resumeData: session.resumeData,
      source: session.source,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error: any) {
    console.error(`[GET /api/resume/${req.params.id}] Error:`, error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DELETE /api/resume/:id
// Removes a session
// ============================================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteResume(id);
    if (!success) {
      return res.status(404).json({ error: `Session "${id}" not found` });
    }
    return res.json({ message: `Session "${id}" deleted successfully` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/resume
// List all active sessions
// ============================================================
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sessions = await listResumes();
    return res.json({ sessions, count: sessions.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/resume/schema/sql
// Get the SQL schema required for Supabase
// ============================================================
router.get('/schema/sql', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  return res.send(SUPABASE_SQL_SCHEMA);
});

export default router;
