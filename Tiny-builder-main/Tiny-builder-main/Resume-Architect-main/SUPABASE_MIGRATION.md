# Supabase SQL Migration

Run this SQL in your **Supabase Dashboard → SQL Editor** to support all new features.

## Step 1 — If tables don't exist yet (fresh install)

```sql
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

-- Evidence table
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

-- Performance indexes
CREATE INDEX IF NOT EXISTS resumes_user_id_idx ON resumes(user_id);
CREATE INDEX IF NOT EXISTS evidence_user_id_idx ON evidence(user_id);
```

## Step 2 — If tables already exist (upgrade migration)

```sql
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT TRUE;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS resumes_user_id_idx ON resumes(user_id);
CREATE INDEX IF NOT EXISTS evidence_user_id_idx ON evidence(user_id);
```

## Step 3 — Enable Row Level Security (recommended)

```sql
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their resumes" ON resumes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their evidence" ON evidence FOR ALL USING (auth.uid() = user_id);
```

> **Note**: After enabling RLS, only authenticated users can read/write their own rows.
> Guest mode uses in-memory state and does not write to Supabase.
