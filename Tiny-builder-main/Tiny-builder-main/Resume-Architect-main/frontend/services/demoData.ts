import { ResumeData, EvidenceItem } from '../types';

export const demoResumeData: ResumeData = {
  fullName: 'Joshva Rahul',
  email: 'joshvarahul12@gmail.com',
  phone: '+91 70000 00000',
  location: 'Coimbatore, Tamil Nadu',
  linkedin: 'linkedin.com/in/joshva-rahul-s',
  website: 'github.com/joshvarahul',
  summary: 'Passionate IT student with skills in web development, building modern and user-friendly applications. Eager to learn, contribute and grow in a professional environment.',
  targetRole: 'Frontend Developer',
  experience: [
    {
      id: 'exp-1',
      company: 'Tech Solutions Inc.',
      role: 'Web Development Intern',
      startDate: '2024-06',
      endDate: '2024-08',
      description: 'Built responsive UI components using React.js and JavaScript. Collaborated with senior developers to integrate REST API endpoints and optimize page rendering times.',
      isCurrent: false,
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'Nehru Institute of Technology, Coimbatore',
      degree: 'B.Tech Information Technology',
      startDate: '2023-08',
      endDate: '2027-05',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'React.js', level: 'Expert', evidenceStatus: 'Strong Evidence' },
    { id: 'sk-2', name: 'JavaScript', level: 'Expert', evidenceStatus: 'Strong Evidence' },
    { id: 'sk-3', name: 'HTML & CSS', level: 'Expert', evidenceStatus: 'Strong Evidence' },
    { id: 'sk-4', name: 'Python', level: 'Intermediate', evidenceStatus: 'Supported' },
    { id: 'sk-5', name: 'Node.js', level: 'Intermediate', evidenceStatus: 'Supported' },
    { id: 'sk-6', name: 'Supabase', level: 'Intermediate', evidenceStatus: 'Supported' },
    { id: 'sk-7', name: 'SQL', level: 'Beginner', evidenceStatus: 'Limited Evidence' },
    { id: 'sk-8', name: 'TypeScript', level: 'Beginner', evidenceStatus: 'Missing' },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'ExamVerse',
      link: 'https://github.com/joshvarahul/ExamVerse',
      description: 'AI-powered quiz platform built using React & Supabase. Features real-time multiplayer quizzes, custom room creation, dynamic leaderboard, and instant answer evaluations.',
      technologies: ['React', 'JavaScript', 'Supabase'],
      evidenceUrl: 'https://github.com/joshvarahul/ExamVerse',
    },
    {
      id: 'proj-2',
      title: 'ResumeArchitect',
      link: 'https://github.com/joshvarahul/ResumeArchitect',
      description: 'AI-powered resume builder & career intelligence platform with 7 resume templates, live interactive preview, and ATS compatibility verification.',
      technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
      evidenceUrl: 'https://github.com/joshvarahul/ResumeArchitect',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'Frontend Developer (React) Certification',
      issuer: 'HackerRank / Meta',
      issueDate: '2024-05',
      credentialUrl: 'https://hackerrank.com/certificates/frontend-react',
    },
    {
      id: 'cert-2',
      name: 'Python Programming Masterclass',
      issuer: 'Udemy',
      issueDate: '2024-02',
      credentialUrl: 'https://udemy.com/certificate/python-masterclass',
    },
  ],
  templateId: 'modern',
  sections: {
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
  },
};

export const demoEvidenceList: EvidenceItem[] = [
  {
    id: 'ev-1',
    skill: 'React.js',
    type: 'GitHub Project',
    title: 'ExamVerse - AI Quiz Platform',
    url: 'https://github.com/joshvarahul/ExamVerse',
    description: 'Production React codebase with custom state management and component library.',
    scoreOrResult: 'Verified Repository',
    date: '2024-07-15',
    status: 'Prototype Evidence Check',
  },
  {
    id: 'ev-2',
    skill: 'React.js',
    type: 'Project',
    title: 'ResumeArchitect Platform',
    url: 'https://github.com/joshvarahul/ResumeArchitect',
    description: 'Developed modern React application with live preview and PDF export.',
    scoreOrResult: 'Live Demo Available',
    date: '2024-09-10',
    status: 'Prototype Evidence Check',
  },
  {
    id: 'ev-3',
    skill: 'JavaScript',
    type: 'Assessment',
    title: 'JavaScript (Intermediate) Certificate',
    url: 'https://hackerrank.com/certificates/js-intermediate',
    description: 'Scored top 5% in algorithm design and async JavaScript testing.',
    scoreOrResult: '98/100',
    date: '2024-04-20',
    status: 'Prototype Evidence Check',
  },
  {
    id: 'ev-4',
    skill: 'Python',
    type: 'Course',
    title: 'Machine Learning Fundamentals with Python',
    url: 'https://coursera.org/verify/python-ml',
    description: 'Completed hands-on machine learning projects predicting house prices and image classification.',
    scoreOrResult: 'Grade A+',
    date: '2024-03-01',
    status: 'Prototype Evidence Check',
  },
  {
    id: 'ev-5',
    skill: 'SQL',
    type: 'Project',
    title: 'Database Schema for ExamVerse',
    description: 'Designed Postgres/Supabase tables, primary keys, and RPC functions.',
    scoreOrResult: 'Resume Mention',
    date: '2024-06-12',
    status: 'Evidence Status',
  },
  {
    id: 'ev-6',
    skill: 'Node.js',
    type: 'Internship',
    title: 'Tech Solutions Internship REST API Module',
    description: 'Created backend express routes for user session verification.',
    scoreOrResult: 'Internship Verified',
    date: '2024-07-30',
    status: 'Prototype Evidence Check',
  },
];

export const sampleJobDescriptions = [
  {
    id: 'jd-frontend',
    title: 'Frontend Developer',
    text: `We are looking for a passionate Frontend Developer to build high-performance web applications.

Responsibilities:
- Build responsive, accessible UI components using React.js, JavaScript, and HTML/CSS.
- Integrate REST APIs and manage asynchronous application state.
- Write clean TypeScript code and perform automated testing with Jest or Cypress.
- Work with Git for version control and collaborate with UI/UX designers.

Requirements:
- Strong experience with React.js, JavaScript, HTML5, CSS3, and Git.
- Familiarity with TypeScript and RESTful APIs.
- Experience with modern frontend tools (Vite, Tailwind CSS).
- Bonus: Knowledge of state management and testing frameworks.`,
  },
  {
    id: 'jd-fullstack',
    title: 'Full Stack Developer',
    text: `Seeking a Full Stack Engineer to build scalable web applications from front to back.

Requirements:
- Strong frontend foundations in React, JavaScript, and HTML/CSS.
- Backend proficiency in Node.js, Express, and SQL database management.
- Experience building RESTful APIs and integrating authentication services.
- Knowledge of cloud databases like PostgreSQL / Supabase.
- Good understanding of version control (Git) and deployment workflows.`,
  },
  {
    id: 'jd-python',
    title: 'Python Developer / Data Analyst',
    text: `Looking for a Python Developer to develop data pipelines and analytics dashboards.

Requirements:
- Advanced Python knowledge and experience with SQL databases.
- Familiarity with data analysis libraries (Pandas, NumPy, Scikit-learn).
- Understanding of web frameworks (Flask, FastAPI, Django).
- Ability to document code and present data insights clearly.`,
  },
];
