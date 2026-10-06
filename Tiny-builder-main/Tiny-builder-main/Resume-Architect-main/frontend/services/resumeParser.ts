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

  // Full Name — look in first 8 lines
  let fullName = '';
  for (const line of lines.slice(0, 8)) {
    const clean = line.replace(/[^a-zA-Z\s.]/g, '').trim();
    if (clean.length >= 3 && clean.length <= 45 && /^[A-Z]/.test(clean) &&
      !clean.toLowerCase().match(/resume|curriculum|page|profile|email|phone|contact|address|developer|engineer/) &&
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

  // Dynamic Section Header Detection
  const sectionHeaderPattern = /^(?:[A-Z0-9\s,&/\-]{3,40}:?$)/;
  const sectionMap: Record<string, string[]> = {};
  let currentHeader = 'HEADER';
  sectionMap[currentHeader] = [];

  for (const line of lines) {
    const isDate = /^\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current)/i.test(line) ||
      /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(line);
    const isHeadingCandidate = (
      sectionHeaderPattern.test(line) &&
      line.length >= 3 &&
      line.length <= 45 &&
      !isDate &&
      line !== fullName &&
      !line.includes('@') &&
      !line.includes('http') &&
      !line.startsWith('•') &&
      !line.startsWith('-')
    );

    if (isHeadingCandidate) {
      currentHeader = line.replace(/:$/, '').trim();
      if (!sectionMap[currentHeader]) {
        sectionMap[currentHeader] = [];
      }
    } else {
      sectionMap[currentHeader].push(line);
    }
  }

  const findSectionLines = (...keywords: string[]): { header: string; lines: string[] } => {
    for (const kw of keywords) {
      const foundKey = Object.keys(sectionMap).find((k) =>
        k.toUpperCase().includes(kw.toUpperCase())
      );
      if (foundKey && sectionMap[foundKey].length > 0) {
        return { header: foundKey, lines: sectionMap[foundKey] };
      }
    }
    return { header: '', lines: [] };
  };

  // Summary
  const summaryObj = findSectionLines('SUMMARY', 'PROFILE', 'OBJECTIVE', 'ABOUT');
  let summary = summaryObj.lines.join('\n').trim();
  if (!summary) {
    const m = text.match(/(?:SUMMARY|PROFILE|OBJECTIVE|ABOUT ME)[:\s]*([\s\S]+?)(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|PROJECTS|$))/i);
    if (m) summary = m[1].trim();
  }

  // Skills
  const skillsObj = findSectionLines('SKILLS', 'TECHNICAL SKILLS', 'COMPETENCIES', 'TECHNOLOGIES');
  const allSkillKeywords = [
    'Python','JavaScript','TypeScript','Java','C++','C#','C','Go','Rust','PHP','Swift','Kotlin','Ruby','Scala',
    'React','Vue','Angular','Next.js','HTML','CSS','SASS','Tailwind CSS','Bootstrap','Redux','Svelte','jQuery',
    'Node.js','Express','FastAPI','Django','Flask','Spring Boot','NestJS','REST APIs','GraphQL',
    'SQL','MySQL','PostgreSQL','MongoDB','Redis','SQLite','Supabase','Firebase','DynamoDB','Elasticsearch',
    'AWS','Azure','GCP','Docker','Kubernetes','CI/CD','Jenkins','GitHub Actions','Linux','Nginx',
    'Git','Figma','Jira','Postman','Webpack','Vite','Jest','Cypress','Selenium','Pandas','NumPy','TensorFlow','PyTorch',
  ];

  const detectedSkills: ResumeData['skills'] = [];
  let skillIdx = 1;
  const skillsTextCombined = (skillsObj.lines.length > 0 ? skillsObj.lines.join(' ') : text).toLowerCase();

  for (const kw of allSkillKeywords) {
    if (skillsTextCombined.includes(kw.toLowerCase())) {
      detectedSkills.push({
        id: `skill-${skillIdx++}`,
        name: kw,
        level: skillIdx <= 5 ? 'Expert' : skillIdx <= 12 ? 'Intermediate' : 'Beginner',
      });
    }
  }

  if (skillsObj.lines.length > 0) {
    const rawTokens = skillsObj.lines
      .join(',')
      .split(/[,|\n\t\/\-•·;]/)
      .map((s) => s.replace(/[^a-zA-Z0-9.#+\s]/g, '').trim())
      .filter((s) => s.length >= 2 && s.length <= 35);
    for (const tok of rawTokens) {
      const already = detectedSkills.some((ds) => ds.name.toLowerCase() === tok.toLowerCase());
      if (!already && /[a-zA-Z]/.test(tok) && !tok.toLowerCase().match(/skills|proficient|familiar|tools|technologies|knowledge/)) {
        detectedSkills.push({ id: `skill-${skillIdx++}`, name: tok, level: 'Intermediate' });
      }
    }
  }

  // Experience & Internships — preserve all
  const expObj = findSectionLines('EXPERIENCE', 'WORK', 'EMPLOYMENT', 'PROFESSIONAL', 'INTERNSHIP');
  const experience: ResumeData['experience'] = [];
  const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s,]*\d{4}|(?:Present|Current)|\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current)/i;

  if (expObj.lines.length > 0) {
    const joinedExp = expObj.lines.join('\n');
    let rawBlocks = joinedExp.split(/\n\s*\n+/).filter((b) => b.trim().length > 5);

    // If no paragraph breaks, split by date lines
    if (rawBlocks.length <= 1) {
      const cleanLines = expObj.lines.filter(Boolean);
      const splitBlocks: string[] = [];
      let currentLines: string[] = [];
      for (const line of cleanLines) {
        const hasDate = datePattern.test(line);
        const curHasDate = currentLines.some((l) => datePattern.test(l));
        if (hasDate && curHasDate && currentLines.length >= 2) {
          const prev = currentLines.pop()!;
          const prevPrev = currentLines.length > 0 && !datePattern.test(currentLines[currentLines.length - 1]) ? currentLines.pop()! : '';
          splitBlocks.push(currentLines.join('\n'));
          currentLines = [prevPrev, prev, line].filter(Boolean);
        } else {
          currentLines.push(line);
        }
      }
      if (currentLines.length > 0) splitBlocks.push(currentLines.join('\n'));
      if (splitBlocks.length > 1) rawBlocks = splitBlocks;
    }

    let expId = 1;
    for (const block of rawBlocks) {
      const blockLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (blockLines.length === 0) continue;
      const dateLine = blockLines.find((l) => datePattern.test(l)) || '';
      const dateMatch = dateLine.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s,]*\d{4}|\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w\s,]*\d{4}|\d{4}|Present|Current)/i);
      const startDate = dateMatch ? dateMatch[1] : '';
      const endDate = dateMatch ? dateMatch[2] : (dateLine ? dateLine : '');
      const isCurrent = /Present|Current/i.test(endDate);
      const nonDateLines = blockLines.filter((l) => !datePattern.test(l));
      const role = nonDateLines[0] || '';
      const company = nonDateLines[1] || '';
      const description = nonDateLines.slice(2).join('\n') || nonDateLines.join('\n');
      if (role || company || description) {
        experience.push({ id: `exp-${expId++}`, company, role, startDate, endDate, description, isCurrent });
      }
    }
  }

  // Education — preserve all
  const eduObj = findSectionLines('EDUCATION', 'ACADEMIC', 'QUALIFICATION');
  const education: ResumeData['education'] = [];
  if (eduObj.lines.length > 0) {
    const joinedEdu = eduObj.lines.join('\n');
    const blocks = joinedEdu.split(/\n\s*\n+/).filter((b) => b.trim().length > 4);
    let eduId = 1;
    for (const block of blocks) {
      const eduLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (eduLines.length === 0) continue;
      const dateMatch = block.match(/(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/i);
      const startDate = dateMatch ? dateMatch[1] : '';
      const endDate = dateMatch ? dateMatch[2] : '';
      const gpaMatch = block.match(/(?:GPA|CGPA|Percentage|Score)[:\s]+([\d.]+(?:\s*\/\s*[\d.]+)?%?)/i);
      const gpa = gpaMatch ? gpaMatch[1] : undefined;

      const isInst = (l: string) => /\b(University|College|Institute|School|Academy|Polytechnic|Campus)\b/i.test(l);
      const isDeg = (l: string) => /\b(B\.?S|M\.?S|B\.?A|M\.?A|B\.?Tech|M\.?Tech|B\.?E|M\.?E|MBA|B\.?Sc|M\.?Sc|B\.?Com|M\.?Com|Bachelor|Master|Ph\.?D|Doctor|Associate|Diploma|Degree)\b/i.test(l);

      const instLine = eduLines.find(isInst);
      const degLine = eduLines.find(isDeg);

      const institution = instLine || (degLine ? eduLines.find((l) => l !== degLine) : eduLines[0]) || '';
      const degree = degLine || (instLine ? eduLines.find((l) => l !== instLine) : eduLines[1]) || '';

      if (institution || degree) {
        education.push({ id: `edu-${eduId++}`, institution, degree, startDate, endDate, gpa });
      }
    }
  }

  // Projects — preserve all
  const projObj = findSectionLines('PROJECT', 'PROJECTS', 'KEY PROJECTS');
  const projects: ResumeData['projects'] = [];
  if (projObj.lines.length > 0) {
    const blocks = projObj.lines.join('\n').split(/\n{2,}/).filter((b) => b.trim().length > 5);
    let projId = 1;
    for (const block of blocks) {
      const projLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (projLines.length === 0) continue;
      const title = projLines[0] || '';
      const linkMatch = block.match(/https?:\/\/[^\s)>]+/);
      const link = linkMatch ? linkMatch[0] : '';
      const description = projLines.slice(1).join('\n') || title;
      const techInProject = detectedSkills.filter((s) => block.toLowerCase().includes(s.name.toLowerCase())).map((s) => s.name);
      if (title || description) {
        projects.push({ id: `proj-${projId++}`, title, link, description, technologies: techInProject });
      }
    }
  }

  // Certifications — preserve all
  const certObj = findSectionLines('CERTIFICATION', 'CERTIFICATE', 'LICENSES');
  const certifications: ResumeData['certifications'] = [];
  if (certObj.lines.length > 0) {
    let certId = 1;
    for (const line of certObj.lines) {
      const cleanLine = line.replace(/^[•\-\*▪▫]\s*/, '').trim();
      if (cleanLine.length > 3) {
        certifications.push({
          id: `cert-${certId++}`,
          name: cleanLine,
          issuer: '',
          issueDate: '',
        });
      }
    }
  }

  // Languages — preserve all
  const langObj = findSectionLines('LANGUAGE', 'LANGUAGES');
  const languages: ResumeData['languages'] = [];
  if (langObj.lines.length > 0) {
    let langId = 1;
    for (const line of langObj.lines) {
      const cleanLine = line.replace(/^[•\-\*▪▫]\s*/, '').trim();
      const parts = cleanLine.split(/[:\-\(]/);
      if (parts[0] && parts[0].trim().length > 1) {
        languages.push({
          id: `lang-${langId++}`,
          name: parts[0].trim(),
          proficiency: parts[1] ? parts[1].replace(/[\)]/g, '').trim() : undefined,
        });
      }
    }
  }

  // Achievements / Awards — preserve all
  const achObj = findSectionLines('ACHIEVEMENT', 'AWARDS', 'HONORS', 'RECOGNITION');
  const achievements: ResumeData['achievements'] = [];
  if (achObj.lines.length > 0) {
    let achId = 1;
    for (const line of achObj.lines) {
      const cleanLine = line.replace(/^[•\-\*▪▫]\s*/, '').trim();
      if (cleanLine.length > 3) {
        achievements.push({
          id: `ach-${achId++}`,
          title: cleanLine,
        });
      }
    }
  }

  // Interests / Hobbies
  const intObj = findSectionLines('INTEREST', 'HOBBIES', 'ACTIVITIES');
  const interests: string[] = [];
  if (intObj.lines.length > 0) {
    const rawIntTokens = intObj.lines
      .join(',')
      .split(/[,|\n\t\/\-•·;]/)
      .map((s) => s.replace(/^[•\-\*▪▫]\s*/, '').trim())
      .filter((s) => s.length >= 2 && s.length <= 40);
    interests.push(...rawIntTokens);
  }

  // Custom Sections — Gather ALL unmapped sections so zero data is lost!
  const mappedHeaders = new Set([
    'HEADER',
    fullName,
    fullName.toUpperCase(),
    summaryObj.header,
    skillsObj.header,
    expObj.header,
    eduObj.header,
    projObj.header,
    certObj.header,
    langObj.header,
    achObj.header,
    intObj.header,
  ]);

  const customSections: ResumeData['customSections'] = [];
  let custId = 1;
  for (const [header, sectionLines] of Object.entries(sectionMap)) {
    if (!mappedHeaders.has(header) && sectionLines.length > 0) {
      const content = sectionLines.join('\n').trim();
      if (content.length > 0) {
        customSections.push({
          id: `cust-${custId++}`,
          heading: header,
          items: sectionLines.map((l) => l.replace(/^[•\-\*▪▫]\s*/, '').trim()).filter(Boolean),
          content,
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
    languages,
    achievements,
    interests,
    customSections,
    rawText: text,
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

