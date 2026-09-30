// ============================================================
// resumeParser.ts — Client-side Resume Extraction & Parsing
// Used as a fallback when the backend is unavailable.
// Supports: plain text, JSON resume format, and basic PDF text.
// ============================================================
import { ResumeData } from '../types';

// ──────────────────────────────────────────────────────────────
// Main Client-Side Parser
// ──────────────────────────────────────────────────────────────
export const parseResumeTextClient = (
  text: string,
  targetRole: string = 'Software Engineer'
): ResumeData => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Contact info
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{3,5}(?:[\s.-]?\d{2,4})?/
  );
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?/i);
  const linkedin = linkedinMatch
    ? linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`
    : '';

  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?/i);
  const website = githubMatch
    ? githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`
    : '';

  // Full Name
  let fullName = 'Resume Candidate';
  for (const line of lines.slice(0, 6)) {
    const clean = line.replace(/[^a-zA-Z\s.]/g, '').trim();
    if (
      clean.length >= 3 && clean.length <= 45 &&
      /^[A-Z]/.test(clean) &&
      !clean.toLowerCase().match(/resume|curriculum|page|profile/) &&
      !clean.includes('@') && !/\d/.test(clean)
    ) {
      fullName = line.replace(/[^\w\s.]/g, '').trim();
      break;
    }
  }

  // Location
  let location = '';
  const locPatterns = [
    /(?:Location|City|Address)[:\s]+([^\n|,]+(?:,\s*[^\n|,]+)?)/i,
    /([A-Za-z\s]+,\s*(?:India|USA|UK|Canada|Australia|Germany|Singapore|Remote))/i,
  ];
  for (const pat of locPatterns) {
    const m = text.match(pat);
    if (m && m[1] && m[1].trim().length < 50) { location = m[1].trim(); break; }
  }

  // Section Splitter
  const sectionHeaderRe =
    /^(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT|EDUCATION|ACADEMIC|SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|PROJECTS|PROJECT EXPERIENCE|ACHIEVEMENTS|CERTIFICATIONS?|SUMMARY|PROFILE|OBJECTIVE|ABOUT)/i;

  const sectionMap: Record<string, string> = {};
  let currentSection = 'HEADER';
  sectionMap[currentSection] = '';

  for (const line of lines) {
    const cleaned = line.replace(/[^A-Za-z\s]/g, '').trim();
    const isHeader = cleaned.length >= 3 && cleaned.length <= 40 && sectionHeaderRe.test(line);
    if (isHeader) {
      const key = line.toUpperCase().replace(/[^A-Z\s]/g, '').trim().split(/\s+/).slice(0, 2).join('_');
      currentSection = key;
      sectionMap[currentSection] = '';
    } else {
      sectionMap[currentSection] = (sectionMap[currentSection] || '') + '\n' + line;
    }
  }

  const getSection = (...names: string[]) => {
    for (const name of names) {
      const key = Object.keys(sectionMap).find((k) => k.startsWith(name.toUpperCase()));
      if (key && sectionMap[key]?.trim()) return sectionMap[key].trim();
    }
    return '';
  };

  // Summary
  let summary = getSection('SUMMARY', 'PROFILE', 'OBJECTIVE', 'ABOUT');
  if (!summary) {
    const m = text.match(/(?:SUMMARY|PROFILE|OBJECTIVE|ABOUT ME)[:\s]*([\s\S]+?)(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|PROJECTS|$))/i);
    if (m) summary = m[1].trim().substring(0, 500);
  }
  if (!summary) summary = `Motivated ${targetRole} with hands-on experience in software development and modern technologies.`;
  else summary = summary.substring(0, 500);

  // Skills
  const skillsText = getSection('SKILLS', 'TECHNICAL', 'CORE') || text;
  const allSkillKeywords = [
    'Python','JavaScript','TypeScript','Java','C++','C#','Go','Rust','PHP','Swift','Kotlin','Ruby',
    'React','Vue','Angular','Next.js','HTML','CSS','SASS','Tailwind CSS','Bootstrap','Redux','Svelte','jQuery',
    'Node.js','Express','FastAPI','Django','Flask','Spring Boot','NestJS','REST APIs','GraphQL',
    'SQL','MySQL','PostgreSQL','MongoDB','Redis','SQLite','Supabase','Firebase','DynamoDB','Elasticsearch',
    'AWS','Azure','GCP','Docker','Kubernetes','CI/CD','Jenkins','GitHub Actions','Linux','Nginx',
    'Git','Figma','Jira','Postman','Webpack','Vite','Jest','Cypress','Selenium','Pandas','NumPy','TensorFlow','PyTorch',
  ];

  const textLower = skillsText.toLowerCase();
  const detectedSkills: ResumeData['skills'] = [];
  let skillIdx = 1;

  for (const kw of allSkillKeywords) {
    if (textLower.includes(kw.toLowerCase())) {
      detectedSkills.push({
        id: `skill-${skillIdx++}`,
        name: kw,
        level: skillIdx <= 4 ? 'Expert' : skillIdx <= 9 ? 'Intermediate' : 'Beginner',
      });
    }
  }

  // Also extract comma/pipe/bullet separated skills from skills section
  const skillsSection = getSection('SKILLS', 'TECHNICAL', 'CORE');
  if (skillsSection) {
    const tokens = skillsSection
      .split(/[,|\n\t\/\-]/)
      .map((s) => s.replace(/[^a-zA-Z0-9.#+\s]/g, '').trim())
      .filter((s) => s.length >= 2 && s.length <= 30);
    for (const tok of tokens) {
      const already = detectedSkills.some((ds) => ds.name.toLowerCase() === tok.toLowerCase());
      if (!already && /[a-zA-Z]/.test(tok)) {
        detectedSkills.push({ id: `skill-${skillIdx++}`, name: tok, level: 'Intermediate' });
      }
    }
  }

  if (detectedSkills.length === 0) {
    detectedSkills.push(
      { id: 'skill-1', name: 'JavaScript', level: 'Expert' },
      { id: 'skill-2', name: 'React', level: 'Intermediate' },
      { id: 'skill-3', name: 'Git', level: 'Intermediate' }
    );
  }

  // Experience
  const expText = getSection('EXPERIENCE', 'WORK', 'EMPLOYMENT', 'PROFESSIONAL');
  const experience: ResumeData['experience'] = [];
  const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s,]*\d{4}|(?:Present|Current)|\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current)/i;

  if (expText) {
    const blocks = expText.split(/\n{2,}/).filter((b) => b.trim().length > 10);
    let expId = 1;
    for (const block of blocks.slice(0, 6)) {
      const blockLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (blockLines.length < 1) continue;
      const dateLine = blockLines.find((l) => datePattern.test(l)) || '';
      const dateMatch = dateLine.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s,]*\d{4}|\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s,]*\d{4}|\d{4}|Present|Current)/i);
      const startDate = dateMatch ? dateMatch[1] : '2022';
      const endDate = dateMatch ? dateMatch[2] : 'Present';
      const isCurrent = /Present|Current/i.test(endDate);
      const nonDateLines = blockLines.filter((l) => !datePattern.test(l));
      const role = nonDateLines[0] || targetRole;
      const company = nonDateLines[1] || 'Company';
      const description = nonDateLines.slice(2).join(' ').substring(0, 350) ||
        `Contributed to ${role} responsibilities, delivering impactful results.`;
      experience.push({ id: `exp-${expId++}`, company, role, startDate, endDate, description, isCurrent });
    }
  }

  if (experience.length === 0) {
    experience.push({
      id: 'exp-1', company: 'Company Name', role: targetRole,
      startDate: '2022', endDate: 'Present',
      description: 'Led development of key features and delivered impactful results.',
      isCurrent: true,
    });
  }

  // Education
  const eduText = getSection('EDUCATION', 'ACADEMIC');
  const education: ResumeData['education'] = [];

  if (eduText) {
    const blocks = eduText.split(/\n{2,}/).filter((b) => b.trim().length > 5);
    let eduId = 1;
    for (const block of blocks.slice(0, 3)) {
      const eduLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (eduLines.length < 1) continue;
      const dateMatch = block.match(/(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/i);
      const startDate = dateMatch ? dateMatch[1] : '2019';
      const endDate = dateMatch ? dateMatch[2] : '2023';
      const degreeLine = eduLines.find((l) =>
        /\b(B\.?Tech|M\.?Tech|B\.?E|M\.?E|MBA|B\.?Sc|M\.?Sc|Bachelor|Master|Ph\.?D|Diploma|Engineering|Computer Science|Information Technology)\b/i.test(l)
      ) || eduLines[0];
      const institution = eduLines.find((l) => l !== degreeLine && l.length > 4) || eduLines[0];
      const degree = degreeLine || `Degree in ${targetRole}`;
      education.push({ id: `edu-${eduId++}`, institution, degree, startDate, endDate });
    }
  }

  if (education.length === 0) {
    education.push({
      id: 'edu-1', institution: 'University / College',
      degree: 'Bachelor of Technology in Computer Science',
      startDate: '2019', endDate: '2023',
    });
  }

  // Projects
  const projText = getSection('PROJECTS', 'PROJECT');
  const projects: ResumeData['projects'] = [];

  if (projText) {
    const blocks = projText.split(/\n{2,}/).filter((b) => b.trim().length > 10);
    let projId = 1;
    for (const block of blocks.slice(0, 4)) {
      const projLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (projLines.length < 1) continue;
      const title = projLines[0] || `Project ${projId}`;
      const linkMatch = block.match(/https?:\/\/[^\s)>]+/);
      const link = linkMatch ? linkMatch[0] : website || 'https://github.com';
      const description = projLines.slice(1).join(' ').substring(0, 350) || 'A technical project showcasing skills.';
      const technologies = detectedSkills.slice(0, 4).map((s) => s.name);
      projects.push({ id: `proj-${projId++}`, title, link, description, technologies });
    }
  }

  if (projects.length === 0) {
    projects.push({
      id: 'proj-1', title: 'Full-Stack Web Application',
      link: website || 'https://github.com',
      description: 'Engineered a performant web application integrating REST APIs and real-time state management.',
      technologies: detectedSkills.slice(0, 4).map((s) => s.name),
    });
  }

  return {
    fullName,
    email: email || 'candidate@example.com',
    phone: phone || '+91 99999 99999',
    location: location || 'India',
    linkedin,
    website,
    summary,
    targetRole,
    experience,
    education,
    skills: detectedSkills,
    projects,
    templateId: 'modern',
  };
};

// ──────────────────────────────────────────────────────────────
// File Reader — reads any File as text (for txt/json/docx fallback)
// ──────────────────────────────────────────────────────────────
export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = (e) => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
};
