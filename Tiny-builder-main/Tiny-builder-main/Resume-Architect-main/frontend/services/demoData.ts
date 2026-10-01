import { ResumeData, EvidenceItem } from '../types';

// Demo data removed per requirements.
// The application starts clean with empty state.
export const demoResumeData: ResumeData = {
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

export const demoEvidenceList: EvidenceItem[] = [];

export const sampleJobDescriptions: { id: string; title: string; text: string }[] = [];
