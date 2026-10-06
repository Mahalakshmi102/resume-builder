// ============================================================
// ResumeArchitect Backend Server — server.ts
// Express.js API Server
// 
// PORT: 5000 (configure in .env)
// FRONTEND: http://localhost:3000 (Vite dev server)
//
// API KEYS REQUIRED (see .env.example):
//   - GEMINI_API_KEY (Google AI Studio)
//   - GITHUB_TOKEN   (GitHub Personal Access Token)
// ============================================================
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first (.env)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import routes
import healthRoutes from './routes/healthRoutes';
import aiRoutes from './routes/aiRoutes';
import evidenceRoutes from './routes/evidenceRoutes';
import resumeRoutes from './routes/resumeRoutes';

const app: Application = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — Allow frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ============================================================
// Rate Limiting
// ============================================================
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: { error: 'Too many requests. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for AI endpoints (expensive Gemini calls)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { error: 'AI rate limit reached. Max 15 requests/minute.' },
});

app.use('/api', globalLimiter);
app.use('/api/ai', aiLimiter);

// ============================================================
// API Routes
// ============================================================
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/resume', resumeRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'ResumeArchitect Backend API is running',
    documentation: 'GET /api/health for full API reference',
    version: '1.0.0',
  });
});

// ============================================================
// 404 Handler
// ============================================================
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    hint: 'Visit GET /api/health for the full endpoint map',
  });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err.message);

  if (err.message?.includes('CORS blocked')) {
    return res.status(403).json({ error: err.message });
  }

  if (err.message?.includes('GEMINI_API_KEY is not set')) {
    return res.status(503).json({
      error: 'Gemini API Key not configured',
      hint: 'Set GEMINI_API_KEY in your backend/.env file. Get a free key at https://aistudio.google.com/app/apikey',
    });
  }

  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  const geminiOk = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const githubOk = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_personal_access_token_here');

  console.log('\n════════════════════════════════════════════');
  console.log('  ResumeArchitect Backend API');
  console.log('════════════════════════════════════════════');
  console.log(`  Status    : Running`);
  console.log(`  Port      : ${PORT}`);
  console.log(`  Mode      : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Base URL  : http://localhost:${PORT}`);
  console.log(`  Health    : http://localhost:${PORT}/api/health`);
  console.log('────────────────────────────────────────────');
  console.log(`  Gemini AI : ${geminiOk ? '✓ Configured' : '✗ NOT SET — Add GEMINI_API_KEY to .env'}`);
  console.log(`  GitHub    : ${githubOk ? '✓ Configured' : '⚠ Optional — Add GITHUB_TOKEN to .env'}`);
  console.log('════════════════════════════════════════════\n');
});

export default app;
