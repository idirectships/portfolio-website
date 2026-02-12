// Portfolio content — single source of truth for all sections

export interface Project {
  name: string;
  tagline: string;
  description: string;
  tech: string[];
  status: 'open' | 'locked';
  github?: string;
  live?: string;
}

export interface Role {
  title: string;
  company: string;
  period: string;
  description: string;
  highlights: string[];
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export const hero = {
  name: 'Andrew "Dru" Garman',
  tagline: 'AI Implementation Specialist | Ex-FAANG Recruiter | Builder',
  oneLiner:
    'I recruited AI engineers for Google, Amazon, and Meta. Now I build the systems.',
  cta: {
    primary: { label: 'View Projects', href: '#projects' },
    secondary: { label: 'Get in Touch', href: '#contact' },
  },
} as const;

export const about = {
  summary:
    'Former FAANG technical recruiter turned AI engineer. I spent years placing top-tier engineers at Google, Amazon, and Meta — learning what separates great builders from the rest. Now I build end-to-end AI systems myself, combining deep technical recruiting insight with hands-on engineering.',
  highlights: [
    { stat: '30+', label: 'Person teams led' },
    { stat: 'FAANG', label: 'Recruited for Google, Amazon, Meta' },
    { stat: '6', label: 'Products in active development' },
    { stat: '2', label: 'AWS + Salesforce certified' },
  ],
} as const;

export const projects: Project[] = [
  {
    name: 'Straincellar',
    tagline: 'AI-powered cannabis strain encyclopedia',
    description:
      'Full-stack platform with ML-powered image recognition, OCR label extraction, and vector similarity search across 6,800+ strains.',
    tech: ['Next.js 14', 'FastAPI', 'Qdrant', 'PyTorch', 'Tesseract.js'],
    status: 'open',
    github: 'https://github.com/idirectships/straincellar',
  },
  {
    name: 'Kitchen Protocol',
    tagline: 'AI feedback system for human-AI collaboration',
    description:
      'A structured feedback protocol that enables real-time course correction between humans and AI agents. Think RLHF without the R, L, or H.',
    tech: ['Python', 'SQLite', 'Pattern Recognition'],
    status: 'open',
    github: 'https://github.com/idirectships/kitchen-protocol',
  },
  {
    name: 'Keysmith',
    tagline: 'Credential & identity security layer',
    description:
      'Secure credential management and identity verification infrastructure built in Rust.',
    tech: ['Rust', 'Cryptography', 'Security'],
    status: 'locked',
  },
  {
    name: 'Tesseract',
    tagline: 'AI memory infrastructure',
    description:
      'Persistent memory and knowledge management layer for AI agents — context that survives across sessions.',
    tech: ['Python', 'Vector DB', 'Knowledge Graphs'],
    status: 'locked',
  },
  {
    name: 'Vitruvian',
    tagline: 'Life balance optimization app',
    description:
      '12-zone life balance tracking and optimization platform for deliberate personal growth.',
    tech: ['Vite', 'Flask', 'React', 'PostgreSQL'],
    status: 'locked',
    live: 'https://vitruvianprotocol.net',
  },
  {
    name: 'Poolz',
    tagline: 'B2B pool maintenance SaaS',
    description:
      'Full-stack business management platform for pool service companies — scheduling, routing, invoicing.',
    tech: ['Next.js', 'Stripe', 'PostgreSQL', 'Maps API'],
    status: 'locked',
  },
];

export const skillGroups: SkillGroup[] = [
  {
    label: 'Languages',
    items: ['Python', 'TypeScript', 'Rust', 'SQL', 'Bash'],
  },
  {
    label: 'Backend',
    items: ['FastAPI', 'Flask', 'SQLAlchemy', 'Node.js'],
  },
  {
    label: 'Frontend',
    items: ['Next.js 14', 'React', 'Vite', 'Tailwind CSS', 'React Native'],
  },
  {
    label: 'AI / ML',
    items: ['PyTorch', 'Qdrant', 'sentence-transformers', 'Ollama', 'Tesseract.js'],
  },
  {
    label: 'Infrastructure',
    items: ['Docker', 'Railway', 'AWS', 'Vercel', 'PostgreSQL', 'Clerk', 'Stripe'],
  },
];

export const certifications = [
  'AWS Cloud Practitioner',
  'AWS Migration Acceleration Program',
  'Salesforce Certified Administrator',
];

export const experience: Role[] = [
  {
    title: 'AI Implementation Specialist',
    company: 'Independent',
    period: '2025 — Present',
    description:
      'Building AI-powered products end-to-end. Six products in active development spanning ML, NLP, computer vision, and full-stack engineering.',
    highlights: [
      'Architected Straincellar with ML image recognition and vector search',
      'Created Kitchen Protocol for structured human-AI feedback',
      'Building personal AI operating system with local-first architecture',
    ],
  },
  {
    title: 'Technical Recruiter — FAANG Clients',
    company: 'TEKsystems',
    period: 'Aug 2023 — Apr 2024',
    description:
      'Sourced and placed senior technical talent for Google, Amazon, and Meta. Gained deep understanding of what top engineering teams look for.',
    highlights: [
      'Placed engineers at Google, Amazon, and Meta',
      'Specialized in AI/ML and cloud infrastructure roles',
      'Built pipeline of 200+ qualified candidates',
    ],
  },
  {
    title: 'Project Manager',
    company: 'Rackspace Technology',
    period: 'Feb 2022 — Apr 2023',
    description:
      'Managed cloud migration projects and technical team operations at enterprise scale.',
    highlights: [
      'Led cross-functional teams on AWS migration projects',
      'Managed $2M+ project portfolios',
      'Achieved AWS MAP certification',
    ],
  },
  {
    title: 'Director of Operations',
    company: 'AZInfusions',
    period: 'Oct 2020 — Jun 2022',
    description:
      'Scaled operations from startup to multi-location business. Built and managed teams of 30+ across production, logistics, and sales.',
    highlights: [
      'Grew team from 5 to 30+ employees',
      'Built operational systems from scratch',
      'Managed multi-location expansion',
    ],
  },
];

export const contact = {
  email: 'drewgarman@gmail.com',
  github: 'https://github.com/idirectships',
  linkedin: 'https://linkedin.com/in/drewgarman',
  location: 'Phoenix, AZ',
} as const;

export const education = {
  degree: 'B.S. Applied Business Analytics',
  school: 'Arizona State University',
} as const;
