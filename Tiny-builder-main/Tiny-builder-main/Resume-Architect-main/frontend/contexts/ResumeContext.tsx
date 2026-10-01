// ============================================================
// ResumeContext.tsx — Shared resume state
// Single source of truth for the entire application.
//
// Rules:
//  - No Supabase auth or external DB required.
//  - Persists directly and reliably to localStorage.
//  - New user starts with clean empty state (masterResume = null).
//  - No demo data auto-loaded.
//  - All tabs (Builder, AI Analyzer, Job Matcher, Evidence, Reports)
//    read from this single shared context.
// ============================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { ResumeData, EvidenceItem } from '../types';

// ─── Storage Keys ────────────────────────────────────────────
const STORAGE_MASTER_RESUME = 'resumearchitect_master_resume';
const STORAGE_EVIDENCE_LIST = 'resumearchitect_evidence_list';
const STORAGE_TAILORED_RESUME = 'resumearchitect_tailored_resume';
const STORAGE_VERSIONS = 'resumearchitect_versions';

// ─── Types ───────────────────────────────────────────────────
export interface ResumeVersion {
  id: string;
  label: string;
  isMaster: boolean;
  resumeData: ResumeData;
  createdAt: string;
  updatedAt: string;
}

interface ResumeContextType {
  masterResume: ResumeData | null;
  tailoredResume: ResumeData | null;
  activeResume: ResumeData | null;
  evidenceList: EvidenceItem[];
  versions: ResumeVersion[];
  isSaving: boolean;
  isLoading: boolean;
  lastSavedAt: string | null;
  saveError: string | null;
  hasLoadedOnce: boolean;

  setMasterResume: (data: ResumeData) => void;
  setTailoredResume: (data: ResumeData | null) => void;
  selectVersion: (versionId: string) => void;
  addEvidence: (item: EvidenceItem) => void;
  removeEvidence: (id: string) => void;
  saveNow: () => Promise<void>;
  discardTailored: () => void;
  applyTailoredAsMaster: () => void;
  clearResume: () => void;
}

// ─── Context Default ─────────────────────────────────────────
const ResumeContext = createContext<ResumeContextType>({
  masterResume: null,
  tailoredResume: null,
  activeResume: null,
  evidenceList: [],
  versions: [],
  isSaving: false,
  isLoading: false,
  lastSavedAt: null,
  saveError: null,
  hasLoadedOnce: true,
  setMasterResume: () => {},
  setTailoredResume: () => {},
  selectVersion: () => {},
  addEvidence: () => {},
  removeEvidence: () => {},
  saveNow: async () => {},
  discardTailored: () => {},
  applyTailoredAsMaster: () => {},
  clearResume: () => {},
});

export const BLANK_RESUME: ResumeData = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  summary: '',
  targetRole: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  templateId: 'modern',
};

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [masterResume, setMasterResumeState] = useState<ResumeData>(BLANK_RESUME);
  const [tailoredResume, setTailoredResumeState] = useState<ResumeData | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(true);

  // ── Start clean and empty on initial project launch ──────────
  useEffect(() => {
    try {
      // Clear legacy storage that had test resume data
      localStorage.removeItem(STORAGE_MASTER_RESUME);
      localStorage.removeItem(STORAGE_TAILORED_RESUME);
      localStorage.removeItem(STORAGE_EVIDENCE_LIST);
      localStorage.removeItem(STORAGE_VERSIONS);

      // Check if there is an active session resume
      const sessionMaster = sessionStorage.getItem(STORAGE_MASTER_RESUME);
      if (sessionMaster) {
        const parsed = JSON.parse(sessionMaster);
        if (parsed && typeof parsed === 'object') {
          setMasterResumeState(parsed);
        }
      } else {
        setMasterResumeState(BLANK_RESUME);
      }
    } catch (e) {
      console.warn('[ResumeContext] Storage check error:', e);
      setMasterResumeState(BLANK_RESUME);
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, []);

  // ── Debounced auto-save timer ───────────────────────────────
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistMaster = useCallback((data: ResumeData) => {
    setIsSaving(true);
    setSaveError(null);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_MASTER_RESUME, JSON.stringify(data));
        const now = new Date().toISOString();
        setLastSavedAt(now);
      } catch (err: any) {
        console.error('[ResumeContext] Local storage save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 400);
  }, []);

  // ── Actions ─────────────────────────────────────────────────

  const setMasterResume = useCallback(
    (data: ResumeData) => {
      setMasterResumeState(data);
      persistMaster(data);
    },
    [persistMaster]
  );

  const setTailoredResume = useCallback((data: ResumeData | null) => {
    setTailoredResumeState(data);
    if (data) {
      try {
        localStorage.setItem(STORAGE_TAILORED_RESUME, JSON.stringify(data));
      } catch (e) { /* ignore */ }
    } else {
      localStorage.removeItem(STORAGE_TAILORED_RESUME);
    }
  }, []);

  const saveNow = useCallback(async () => {
    if (!masterResume) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      localStorage.setItem(STORAGE_MASTER_RESUME, JSON.stringify(masterResume));
      const now = new Date().toISOString();
      setLastSavedAt(now);
    } catch (err: any) {
      setSaveError('Could not save resume locally.');
    } finally {
      setIsSaving(false);
    }
  }, [masterResume]);

  const addEvidence = useCallback((item: EvidenceItem) => {
    setEvidenceList((prev) => {
      const updated = [item, ...prev.filter((e) => e.id !== item.id)];
      try {
        localStorage.setItem(STORAGE_EVIDENCE_LIST, JSON.stringify(updated));
      } catch (e) { /* ignore */ }
      return updated;
    });
  }, []);

  const removeEvidence = useCallback((id: string) => {
    setEvidenceList((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(STORAGE_EVIDENCE_LIST, JSON.stringify(updated));
      } catch (e) { /* ignore */ }
      return updated;
    });
  }, []);

  const selectVersion = useCallback(
    (versionId: string) => {
      const v = versions.find((ver) => ver.id === versionId);
      if (!v) return;
      if (v.isMaster) {
        setMasterResumeState(v.resumeData);
        setTailoredResumeState(null);
        persistMaster(v.resumeData);
      } else {
        setTailoredResumeState(v.resumeData);
      }
    },
    [versions, persistMaster]
  );

  const discardTailored = useCallback(() => {
    setTailoredResumeState(null);
    localStorage.removeItem(STORAGE_TAILORED_RESUME);
  }, []);

  const applyTailoredAsMaster = useCallback(() => {
    if (!tailoredResume) return;
    setMasterResumeState(tailoredResume);
    setTailoredResumeState(null);
    localStorage.removeItem(STORAGE_TAILORED_RESUME);
    persistMaster(tailoredResume);
  }, [tailoredResume, persistMaster]);

  const clearResume = useCallback(() => {
    setMasterResumeState(BLANK_RESUME);
    setTailoredResumeState(null);
    setEvidenceList([]);
    setVersions([]);
    setLastSavedAt(null);
    setSaveError(null);
    sessionStorage.removeItem(STORAGE_MASTER_RESUME);
    localStorage.removeItem(STORAGE_MASTER_RESUME);
    localStorage.removeItem(STORAGE_EVIDENCE_LIST);
    localStorage.removeItem(STORAGE_TAILORED_RESUME);
    localStorage.removeItem(STORAGE_VERSIONS);
  }, []);

  // ── Derived ─────────────────────────────────────────────────
  const activeResume = tailoredResume || masterResume;

  return (
    <ResumeContext.Provider
      value={{
        masterResume,
        tailoredResume,
        activeResume,
        evidenceList,
        versions,
        isSaving,
        isLoading,
        lastSavedAt,
        saveError,
        hasLoadedOnce,
        setMasterResume,
        setTailoredResume,
        selectVersion,
        addEvidence,
        removeEvidence,
        saveNow,
        discardTailored,
        applyTailoredAsMaster,
        clearResume,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => useContext(ResumeContext);
