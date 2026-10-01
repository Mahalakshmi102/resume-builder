// ============================================================
// supabaseService.ts
// Supabase Database & Persistence Service for ResumeArchitect
// Provides seamless database storage with in-memory fallback.
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ResumeData, EvidenceItem } from '../types';

let supabaseClient: SupabaseClient | null = null;

// Initialize Supabase client safely
export const getSupabaseClient = (): SupabaseClient | null => {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (url && anonKey && url.startsWith('http') && anonKey.length > 20) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('[Supabase] Initialized client connected to:', url);
    } catch (err: any) {
      console.warn('[Supabase] Failed to initialize client:', err.message);
      supabaseClient = null;
    }
  }

  return supabaseClient;
};

// In-memory fallback stores
const memoryResumeStore: Map<string, { data: ResumeData; createdAt: string; updatedAt: string }> = new Map();
const memoryEvidenceStore: Map<string, EvidenceItem> = new Map();

// Helper to provide SQL schema snippet if tables don't exist yet
export const SUPABASE_SQL_SCHEMA = `
-- Run this in your Supabase SQL Editor to create or migrate tables:

-- Resumes table (supports master + tailored versions per user)
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  target_role TEXT,
  is_master BOOLEAN DEFAULT TRUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If upgrading from old schema (id TEXT), run these migrations:
-- ALTER TABLE resumes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE resumes ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT TRUE;
-- CREATE INDEX IF NOT EXISTS resumes_user_id_idx ON resumes(user_id);

-- Evidence table (per-user evidence items)
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  score_or_result TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If upgrading from old schema:
-- ALTER TABLE evidence ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS evidence_user_id_idx ON evidence(user_id);

-- Enable Row Level Security (recommended)
-- ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users own their resumes" ON resumes USING (auth.uid() = user_id);
-- CREATE POLICY "Users own their evidence" ON evidence USING (auth.uid() = user_id);
`.trim();

// ============================================================
// 1. Resume Operations
// ============================================================
export const saveResume = async (
  sessionId: string,
  resumeData: ResumeData
): Promise<{ sessionId: string; source: 'supabase' | 'in-memory'; updatedAt: string }> => {
  const now = new Date().toISOString();
  const client = getSupabaseClient();

  if (client) {
    try {
      const { error } = await client
        .from('resumes')
        .upsert({
          id: sessionId,
          full_name: resumeData.fullName,
          target_role: resumeData.targetRole || '',
          data: resumeData,
          updated_at: now,
        }, { onConflict: 'id' });

      if (!error) {
        // Also keep memory mirror updated
        memoryResumeStore.set(sessionId, {
          data: resumeData,
          createdAt: memoryResumeStore.get(sessionId)?.createdAt || now,
          updatedAt: now,
        });
        return { sessionId, source: 'supabase', updatedAt: now };
      }

      console.warn('[Supabase] resumes table upsert notice:', error.message);
    } catch (err: any) {
      console.warn('[Supabase] Save error, falling back to memory:', err.message);
    }
  }

  // In-memory fallback
  memoryResumeStore.set(sessionId, {
    data: resumeData,
    createdAt: memoryResumeStore.get(sessionId)?.createdAt || now,
    updatedAt: now,
  });

  return { sessionId, source: 'in-memory', updatedAt: now };
};

export const getResume = async (
  sessionId: string
): Promise<{ sessionId: string; resumeData: ResumeData; source: 'supabase' | 'in-memory'; createdAt: string; updatedAt: string } | null> => {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('resumes')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!error && data) {
        return {
          sessionId: data.id,
          resumeData: data.data as ResumeData,
          source: 'supabase',
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
        };
      }
    } catch (err: any) {
      console.warn('[Supabase] Fetch error, checking in-memory:', err.message);
    }
  }

  const session = memoryResumeStore.get(sessionId);
  if (!session) return null;

  return {
    sessionId,
    resumeData: session.data,
    source: 'in-memory',
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
};

export const listResumes = async (): Promise<Array<{ sessionId: string; fullName: string; targetRole?: string; source: string; updatedAt: string }>> => {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('resumes')
        .select('id, full_name, target_role, updated_at')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        return data.map((r: any) => ({
          sessionId: r.id,
          fullName: r.full_name,
          targetRole: r.target_role,
          source: 'supabase',
          updatedAt: r.updated_at,
        }));
      }
    } catch (err: any) {
      console.warn('[Supabase] List resumes error, falling back to in-memory:', err.message);
    }
  }

  return Array.from(memoryResumeStore.entries()).map(([id, s]) => ({
    sessionId: id,
    fullName: s.data.fullName,
    targetRole: s.data.targetRole,
    source: 'in-memory',
    updatedAt: s.updatedAt,
  }));
};

export const deleteResume = async (sessionId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  let deletedFromSupabase = false;

  if (client) {
    try {
      const { error } = await client
        .from('resumes')
        .delete()
        .eq('id', sessionId);
      deletedFromSupabase = !error;
    } catch {
      // Ignored
    }
  }

  const deletedFromMemory = memoryResumeStore.delete(sessionId);
  return deletedFromSupabase || deletedFromMemory;
};

// ============================================================
// 2. Evidence Operations
// ============================================================
export const saveEvidenceItem = async (
  item: EvidenceItem
): Promise<{ item: EvidenceItem; source: 'supabase' | 'in-memory' }> => {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { error } = await client
        .from('evidence')
        .upsert({
          id: item.id,
          skill: item.skill,
          type: item.type,
          title: item.title,
          url: item.url || null,
          description: item.description,
          score_or_result: item.scoreOrResult || null,
          status: item.status,
        }, { onConflict: 'id' });

      if (!error) {
        memoryEvidenceStore.set(item.id, item);
        return { item, source: 'supabase' };
      }
    } catch (err: any) {
      console.warn('[Supabase] Evidence save notice:', err.message);
    }
  }

  memoryEvidenceStore.set(item.id, item);
  return { item, source: 'in-memory' };
};

export const listEvidenceItems = async (): Promise<EvidenceItem[]> => {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('evidence')
        .select('*');

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          skill: d.skill,
          type: d.type,
          title: d.title,
          url: d.url,
          description: d.description,
          scoreOrResult: d.score_or_result,
          status: d.status,
          date: d.created_at,
        }));
      }
    } catch (err: any) {
      console.warn('[Supabase] List evidence error:', err.message);
    }
  }

  return Array.from(memoryEvidenceStore.values());
};

// ============================================================
// 3. Supabase Health Check
// ============================================================
export const checkSupabaseHealth = async (): Promise<{
  configured: boolean;
  connected: boolean;
  url?: string;
  hasSchemaNotice?: boolean;
  error?: string;
}> => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { configured: false, connected: false };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { configured: true, connected: false, url, error: 'Could not create client' };
  }

  try {
    // Lightweight call to check connection
    const { error } = await client.from('resumes').select('id').limit(1);
    if (!error) {
      return { configured: true, connected: true, url };
    }

    // If relation does not exist (tables not yet migrated in Supabase), connection itself works!
    if (error.code === '42P01' || error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
      return {
        configured: true,
        connected: true,
        url,
        hasSchemaNotice: true,
        error: 'Supabase authenticated & connected! Run SQL schema in Supabase dashboard to enable permanent persistence.',
      };
    }

    return { configured: true, connected: false, url, error: error.message };
  } catch (err: any) {
    return { configured: true, connected: false, url, error: err.message };
  }
};
