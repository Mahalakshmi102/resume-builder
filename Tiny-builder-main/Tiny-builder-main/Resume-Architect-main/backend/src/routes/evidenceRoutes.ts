// ============================================================
// Evidence Routes — /api/evidence
// Handles evidence verification and management:
//   POST /api/evidence/verify-github    — Verify a GitHub repo URL
//   POST /api/evidence/verify-url       — Check if a URL is reachable
//   GET  /api/evidence/github-profile   — Get GitHub user public repos
//   POST /api/evidence                  — Save an evidence item to Supabase/Memory
//   GET  /api/evidence                  — List saved evidence items
// ============================================================
import { Router, Request, Response } from 'express';
import { verifyGitHubRepo, getUserPublicRepos } from '../services/githubService';
import { saveEvidenceItem, listEvidenceItems } from '../services/supabaseService';
import { EvidenceItem } from '../types';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ============================================================
// POST /api/evidence/verify-github
// Body: { url: string, skillName?: string }
// Returns: GitHubVerificationResult
// ============================================================
router.post('/verify-github', async (req: Request, res: Response) => {
  try {
    const { url, skillName } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    if (!url.includes('github.com')) {
      return res.status(400).json({ error: 'URL must be a valid GitHub repository URL (https://github.com/owner/repo)' });
    }

    const result = await verifyGitHubRepo(url.trim(), skillName);
    return res.json(result);
  } catch (error: any) {
    console.error('[POST /evidence/verify-github]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/evidence/github-profile/:username
// Returns: { repos: PublicRepo[] }
// ============================================================
router.get('/github-profile/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 1) {
      return res.status(400).json({ error: 'GitHub username is required' });
    }

    const repos = await getUserPublicRepos(username);
    return res.json({ username, repos, count: repos.length });
  } catch (error: any) {
    console.error('[GET /evidence/github-profile]', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/evidence/verify-url
// Body: { url: string }
// Returns: { isReachable, statusCode, message }
// ============================================================
router.post('/verify-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    let isReachable = false;
    let statusCode = 0;
    let message = '';

    try {
      const response = await axios.head(url, { timeout: 6000, maxRedirects: 3 });
      isReachable = response.status < 400;
      statusCode = response.status;
      message = isReachable ? 'URL is reachable and valid.' : `URL returned status ${response.status}.`;
    } catch (err: any) {
      isReachable = false;
      statusCode = err?.response?.status || 0;
      message = err?.code === 'ENOTFOUND' ? 'Domain not found.' : `URL check failed: ${err.message}`;
    }

    return res.json({ url, isReachable, statusCode, message });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/evidence
// Save an evidence item to Supabase / Memory
// ============================================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.skill || !body.title) {
      return res.status(400).json({ error: 'skill and title are required' });
    }

    const item: EvidenceItem = {
      id: body.id || uuidv4(),
      skill: body.skill,
      type: body.type || 'Project Link',
      title: body.title,
      url: body.url || '',
      description: body.description || '',
      scoreOrResult: body.scoreOrResult || '',
      status: body.status || 'Verified',
      date: body.date || new Date().toISOString(),
    };

    const saved = await saveEvidenceItem(item);
    return res.status(201).json(saved);
  } catch (error: any) {
    console.error('[POST /api/evidence] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/evidence
// List all evidence items
// ============================================================
router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await listEvidenceItems();
    return res.json({ evidence: items, count: items.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
