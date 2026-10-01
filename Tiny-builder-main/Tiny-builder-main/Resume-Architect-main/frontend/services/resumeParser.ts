import { ResumeData } from '../types';

export const parseResumeTextClient = (
  text: string,
  targetRole: string = ''
): ResumeData => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Contact Info
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{3,5}(?:[\s.-]?\d{2,4})?/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?/i);
  const linkedin = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '';
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?/i);
  const website = githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '';

  // Full Name — look in first 5 lines for a clean name-like string
  let fullName = '';
  for (const line of lines.slice(0, 6)) {
    const clean = line.replace(/[^a-zA-Z\s.]/g, '').trim();
    if (clean.length >= 3 && clean.length <= 45 && /^[A-Z]/.test(clean) &&
      !clean.toLowerCase().match(/resume|curriculum|page|profile|email|phone|contact|developer|engineer|designer/) &&
      !clean.includes('@') && !/\d/.test(clean)) {
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
  const sectionHeaderRe = /^(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT|EDUCATION|ACADEMIC|SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|PROJECTS|PROJECT EXPERIENCE|ACHIEVEMENTS|CERTIFICATIONS?|SUMMARY|PROFILE|OBJECTIVE|ABOUT)/i;
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

  // Summary — ONLY extract if present in resume text
  let summary = getSection('SUMMARY', 'PROFILE', 'OBJECTIVE', 'ABOUT');
  if (!summary) {
    const m = text.match(/(?:SUMMARY|PROFILE|OBJECTIVE|ABOUT ME)[:\s]*([\s\S]+?)(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|PROJECTS|$))/i);
    if (m) summary = m[1].trim().substring(0, 500);
  }
  summary = summary ? summary.substring(0, 500) : '';

  // Skills — ONLY extract keywords actually present in the text
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
      .split(/[,|\n\t\/\-•·]/)
      .map((s) => s.replace(/[^a-zA-Z0-9.#+\s]/g, '').trim())
      .filter((s) => s.length >= 2 && s.length <= 30);
    for (const tok of tokens) {
      const already = detectedSkills.some((ds) => ds.name.toLowerCase() === tok.toLowerCase());
      if (!already && /[a-zA-Z]/.test(tok) && !tok.toLowerCase().match(/skills|proficient|familiar|tools|technologies/)) {
        detectedSkills.push({ id: `skill-${skillIdx++}`, name: tok, level: 'Intermediate' });
      }
    }
  }

  // DO NOT invent skills if none found. Keep detectedSkills as is (empty if none).

  // Experience — ONLY extract what is in the text
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
      const startDate = dateMatch ? dateMatch[1] : '';
      const endDate = dateMatch ? dateMatch[2] : '';
      const isCurrent = /Present|Current/i.test(endDate);
      const nonDateLines = blockLines.filter((l) => !datePattern.test(l));
      const role = nonDateLines[0] || '';
      const company = nonDateLines[1] || '';
      const description = nonDateLines.slice(2).join(' ').substring(0, 350) || '';
      if (role || company || description) {
        experience.push({ id: `exp-${expId++}`, company, role, startDate, endDate, description, isCurrent });
      }
    }
  }

  // DO NOT invent experience if none found.

  // Education — ONLY extract what is in the text
  const eduText = getSection('EDUCATION', 'ACADEMIC');
  const education: ResumeData['education'] = [];

  if (eduText) {
    const blocks = eduText.split(/\n{2,}/).filter((b) => b.trim().length > 5);
    let eduId = 1;
    for (const block of blocks.slice(0, 3)) {
      const eduLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (eduLines.length < 1) continue;
      const dateMatch = block.match(/(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/i);
      const startDate = dateMatch ? dateMatch[1] : '';
      const endDate = dateMatch ? dateMatch[2] : '';
      const degreeLine = eduLines.find((l) =>
        /\b(B\.?Tech|M\.?Tech|B\.?E|M\.?E|MBA|B\.?Sc|M\.?Sc|Bachelor|Master|Ph\.?D|Diploma|Engineering|Computer Science|Information Technology)\b/i.test(l)
      ) || '';
      const institution = eduLines.find((l) => l !== degreeLine && l.length > 4) || eduLines[0] || '';
      const degree = degreeLine || (eduLines.length > 1 ? eduLines[1] : '');
      if (institution || degree) {
        education.push({ id: `edu-${eduId++}`, institution, degree, startDate, endDate });
      }
    }
  }

  // DO NOT invent education if none found.

  // Projects — ONLY extract what is in the text
  const projText = getSection('PROJECTS', 'PROJECT');
  const projects: ResumeData['projects'] = [];

  if (projText) {
    const blocks = projText.split(/\n{2,}/).filter((b) => b.trim().length > 10);
    let projId = 1;
    for (const block of blocks.slice(0, 5)) {
      const projLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (projLines.length < 1) continue;
      const title = projLines[0] || '';
      const linkMatch = block.match(/https?:\/\/[^\s)>]+/);
      const link = linkMatch ? linkMatch[0] : '';
      const description = projLines.slice(1).join(' ').substring(0, 350) || '';
      const matchingTech = detectedSkills.filter((s) =>
        block.toLowerCase().includes(s.name.toLowerCase())
      ).map((s) => s.name);
      if (title || description) {
        projects.push({ id: `proj-${projId++}`, title, link, description, technologies: matchingTech });
      }
    }
  }

  // DO NOT invent projects if none found.

  // Certifications
  const certText = getSection('CERTIFICATION', 'CERTIFICATE', 'ACHIEVEMENTS');
  const certifications: ResumeData['certifications'] = [];
  if (certText) {
    const lines = certText.split('\n').map((l) => l.trim()).filter(Boolean);
    let certId = 1;
    for (const line of lines.slice(0, 4)) {
      if (line.length > 4 && !line.toLowerCase().match(/^certifications?$/)) {
        certifications.push({
          id: `cert-${certId++}`,
          name: line.replace(/^[•\-\*]\s*/, '').trim(),
          issuer: '',
          issueDate: '',
        });
      }
    }
  }

  return {
    fullName,
    email,
    phone,
    location,
    linkedin,
    website,
    summary,
    targetRole: targetRole || '',
    experience,
    education,
    skills: detectedSkills,
    projects,
    certifications,
    templateId: 'modern',
  };
};

export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
