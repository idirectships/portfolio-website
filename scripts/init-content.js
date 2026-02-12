#!/usr/bin/env node

/**
 * Content Management System Initialization Script
 * 
 * This script sets up the content management system with sample data
 * and demonstrates the automatic content pipeline functionality.
 */

const fs = require('fs').promises;
const path = require('path');

// Sample project data
const sampleProjects = [
  {
    id: 'ai-recruiter-assistant',
    name: 'AI Recruiter Assistant',
    description: 'Automated candidate screening and matching tool using AI to streamline the recruitment process.',
    techStack: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'OpenAI API', 'Docker'],
    liveUrl: 'https://ai-recruiter.example.com',
    githubUrl: 'https://github.com/drugarman/ai-recruiter',
    status: 'active',
    category: 'web-apps',
    features: [
      'Resume parsing and analysis',
      'Skill matching algorithms',
      'Interview scheduling automation',
      'Candidate ranking system',
      'Real-time notifications'
    ],
    challenges: [
      'Natural language processing accuracy',
      'Bias reduction in AI algorithms',
      'Scalability for high-volume processing',
      'Integration with existing ATS systems'
    ],
    outcomes: [
      '50% faster candidate screening',
      'Reduced unconscious bias in initial screening',
      'Better candidate experience with faster feedback',
      'Improved match quality between candidates and roles'
    ]
  },
  {
    id: 'portfolio-terminal',
    name: 'Portfolio Terminal',
    description: 'Interactive CLI-themed portfolio website showcasing technical skills through terminal simulation.',
    techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Vercel', 'React Testing Library'],
    liveUrl: 'https://drugarman.dev',
    githubUrl: 'https://github.com/drugarman/portfolio-terminal',
    status: 'active',
    category: 'web-apps',
    features: [
      'Authentic terminal simulation',
      'File system navigation',
      'Command history and tab completion',
      'Responsive mobile design',
      'SEO optimization'
    ],
    challenges: [
      'Terminal authenticity on web platform',
      'Mobile UX for terminal interface',
      'Performance optimization for animations',
      'Accessibility for screen readers'
    ],
    outcomes: [
      'Unique and memorable user experience',
      'Technical skill demonstration',
      'Professional brand differentiation',
      'Increased engagement and time on site'
    ]
  },
  {
    id: 'techcorp-landing',
    name: 'TechCorp Landing Page',
    description: 'Modern corporate website with conversion optimization and brand-focused design.',
    techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'Vercel', 'Google Analytics'],
    liveUrl: 'https://techcorp.example.com',
    status: 'completed',
    category: 'client-sites',
    features: [
      'Responsive design system',
      'SEO optimization',
      'Contact form integration',
      'Performance monitoring',
      'A/B testing setup'
    ],
    challenges: [
      'Brand alignment with existing materials',
      'Performance requirements under 2s load time',
      'Accessibility compliance (WCAG 2.1 AA)',
      'Integration with existing marketing tools'
    ],
    outcomes: [
      '40% increase in conversion rates',
      'Improved SEO ranking for target keywords',
      'Enhanced brand presence and credibility',
      'Reduced bounce rate by 25%'
    ]
  },
  {
    id: 'voice-to-code',
    name: 'Voice-to-Code',
    description: 'Experimental speech recognition tool for programming workflows and code generation.',
    techStack: ['Python', 'SpeechRecognition', 'OpenAI Whisper', 'VS Code API', 'FastAPI'],
    githubUrl: 'https://github.com/drugarman/voice-to-code',
    status: 'active',
    category: 'experiments',
    features: [
      'Voice command recognition',
      'Code generation from speech',
      'IDE integration',
      'Custom vocabulary training',
      'Multi-language support'
    ],
    challenges: [
      'Speech recognition accuracy for technical terms',
      'Context understanding for code generation',
      'Real-time processing requirements',
      'Integration with development environments'
    ],
    outcomes: [
      'Successful proof of concept',
      'Valuable learning experience with AI APIs',
      'Foundation for future accessibility tools',
      'Community interest and feedback'
    ]
  }
];

// Content structure templates
const contentTemplates = {
  bio: `# Andrew "Dru" Garman

## AI Implementation Specialist & Ex-FAANG Recruiter

Transitioning from talent acquisition at top tech companies to hands-on AI engineering. 
Passionate about building intelligent systems that solve real-world problems while 
maintaining the human element in technology.

### Background

With years of experience as a Senior Technical Recruiter at FAANG companies, I developed 
a deep understanding of the tech talent landscape and the challenges both companies and 
candidates face. This unique perspective drives my current focus on AI implementation 
and development.

### Current Focus

- AI system design and implementation
- Machine learning model development  
- Technical recruiting automation
- Building AI-powered tools for talent acquisition
- Bridging the gap between human insight and AI capabilities

### Philosophy

Technology should amplify human potential, not replace it. My work focuses on creating 
AI systems that enhance human decision-making and create better experiences for everyone 
involved in the process.

*Last updated: ${new Date().toLocaleDateString()}*`,

  languages: {
    programming: [
      {
        name: 'Python',
        level: 'proficient',
        context: 'AI/ML development, automation, data analysis'
      },
      {
        name: 'TypeScript',
        level: 'proficient', 
        context: 'Web development, tooling, type-safe applications'
      },
      {
        name: 'JavaScript',
        level: 'expert',
        context: 'Full-stack development, React applications'
      },
      {
        name: 'SQL',
        level: 'proficient',
        context: 'Data analysis, database design, query optimization'
      }
    ],
    ai_ml: [
      {
        name: 'TensorFlow',
        level: 'beginner',
        context: 'Model training and deployment'
      },
      {
        name: 'PyTorch', 
        level: 'beginner',
        context: 'Research and experimentation'
      },
      {
        name: 'Scikit-learn',
        level: 'proficient',
        context: 'Classical ML algorithms and data preprocessing'
      },
      {
        name: 'Pandas',
        level: 'proficient',
        context: 'Data manipulation and analysis'
      },
      {
        name: 'OpenAI API',
        level: 'proficient',
        context: 'LLM integration and prompt engineering'
      }
    ],
    web_development: [
      {
        name: 'React',
        level: 'expert',
        context: 'Component-based UI development'
      },
      {
        name: 'Next.js',
        level: 'proficient',
        context: 'Full-stack React applications'
      },
      {
        name: 'Tailwind CSS',
        level: 'proficient',
        context: 'Utility-first styling and responsive design'
      },
      {
        name: 'Node.js',
        level: 'proficient',
        context: 'Backend development and API creation'
      }
    ]
  },

  projectIndex: `# Project Portfolio

Welcome to my project showcase. Each project represents a different aspect of my journey 
from technical recruiting to AI implementation and development.

## Web Applications

### Production Applications
- **AI Recruiter Assistant** - Automated candidate screening tool
- **Portfolio Terminal** - This interactive CLI-themed website

### Client Work  
- **TechCorp Landing Page** - Modern corporate website with conversion optimization

## Experiments

### AI & Machine Learning
- **Voice-to-Code** - Speech recognition for programming workflows
- **Resume Parser AI** - Intelligent resume analysis tool

## Navigation

Use the terminal commands to explore each project:
- \`cd web-apps/\` - Production web applications
- \`cd client-sites/\` - Client project work
- \`cd experiments/\` - Research and experimental projects

Each project directory contains:
- \`README.md\` - Detailed project information
- \`tech-stack.json\` - Technologies and tools used
- \`launch.link\` or \`github.link\` - Live demo or source code
- \`demo.md\` - Interactive demonstrations (where applicable)

*Portfolio last updated: ${new Date().toLocaleDateString()}*`
};

async function createDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(`✗ Failed to create directory ${dirPath}:`, error.message);
    }
  }
}

async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✓ Created file: ${filePath}`);
  } catch (error) {
    console.error(`✗ Failed to create file ${filePath}:`, error.message);
  }
}

async function initializeContentStructure() {
  console.log('🚀 Initializing content management system...\n');

  const contentDir = path.join(process.cwd(), 'public', 'content');

  // Create main content directories
  const directories = [
    'artist',
    'artist/influences',
    'studio',
    'studio/toolbox',
    'studio/certifications',
    'studio/workspace-setup',
    'projects',
    'projects/web-apps',
    'projects/client-sites', 
    'projects/experiments',
    'gallery',
    'gallery/screenshots',
    'gallery/design-mockups',
    'gallery/process-videos',
    'gallery/ui-components',
    'commissions',
    'behind-the-scenes',
    'behind-the-scenes/dev-diary',
    'behind-the-scenes/lessons-learned',
    'behind-the-scenes/tools-review'
  ];

  console.log('📁 Creating directory structure...');
  for (const dir of directories) {
    await createDirectory(path.join(contentDir, dir));
  }

  console.log('\n📄 Creating content files...');

  // Create core content files
  await writeFile(
    path.join(contentDir, 'artist', 'bio.md'),
    contentTemplates.bio
  );

  await writeFile(
    path.join(contentDir, 'studio', 'toolbox', 'languages.json'),
    JSON.stringify(contentTemplates.languages, null, 2)
  );

  await writeFile(
    path.join(contentDir, 'projects', 'project-index.md'),
    contentTemplates.projectIndex
  );

  // Create welcome script
  const welcomeScript = `#!/bin/bash
# Welcome to Dru Garman's Portfolio Terminal
# 
# Available commands:
#   ls          - List directory contents
#   cd <dir>    - Change directory  
#   cat <file>  - Display file contents
#   pwd         - Show current directory
#   clear       - Clear terminal
#   help        - Show this help message
#
# Quick navigation:
#   cd artist/     - Personal background and bio
#   cd studio/     - Skills and tools
#   cd projects/   - Project portfolio
#   cd gallery/    - Visual showcase
#   cd commissions/ - Available services
#
echo "Welcome to the portfolio terminal!"
echo "Type 'help' for available commands or 'ls' to explore."
echo ""
echo "🎯 Quick start: cd projects/ && ls"
echo ""`;

  await writeFile(
    path.join(contentDir, 'welcome.sh'),
    welcomeScript
  );

  console.log('\n🚀 Creating project content...');

  // Create project directories and files
  for (const project of sampleProjects) {
    const projectDir = path.join(contentDir, 'projects', project.category, project.id);
    await createDirectory(projectDir);

    // Generate README.md
    const readme = generateProjectReadme(project);
    await writeFile(path.join(projectDir, 'README.md'), readme);

    // Generate tech-stack.json
    const techStack = {
      primary: project.techStack.slice(0, 3),
      secondary: project.techStack.slice(3),
      deployment: inferDeploymentStack(project),
      lastUpdated: new Date().toISOString()
    };
    await writeFile(
      path.join(projectDir, 'tech-stack.json'),
      JSON.stringify(techStack, null, 2)
    );

    // Create link files
    if (project.liveUrl) {
      await writeFile(path.join(projectDir, 'launch.link'), project.liveUrl);
    }
    if (project.githubUrl) {
      await writeFile(path.join(projectDir, 'github.link'), project.githubUrl);
    }

    // Generate demo.md if features exist
    if (project.features && project.features.length > 0) {
      const demo = generateProjectDemo(project);
      await writeFile(path.join(projectDir, 'demo.md'), demo);
    }
  }

  console.log('\n✅ Content management system initialized successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • ${directories.length} directories created`);
  console.log(`   • ${sampleProjects.length} projects configured`);
  console.log(`   • Content pipeline ready for automatic updates`);
  console.log('\n🎉 Ready to start the development server!');
}

function generateProjectReadme(project) {
  const sections = [
    `# ${project.name}`,
    '',
    project.description,
    '',
    '## Features',
    ...project.features.map(feature => `- ${feature}`),
    '',
    '## Tech Stack',
    ...project.techStack.map(tech => `- ${tech}`),
  ];

  if (project.challenges && project.challenges.length > 0) {
    sections.push(
      '',
      '## Challenges Solved',
      ...project.challenges.map(challenge => `- ${challenge}`)
    );
  }

  if (project.outcomes && project.outcomes.length > 0) {
    sections.push(
      '',
      '## Outcomes',
      ...project.outcomes.map(outcome => `- ${outcome}`)
    );
  }

  if (project.liveUrl) {
    sections.push('', `🚀 [View Live Demo](${project.liveUrl})`);
  }

  if (project.githubUrl) {
    sections.push('', `📂 [View Source Code](${project.githubUrl})`);
  }

  sections.push(
    '',
    `*Status: ${project.status}*`,
    `*Category: ${project.category}*`,
    `*Last updated: ${new Date().toLocaleDateString()}*`
  );

  return sections.join('\n');
}

function generateProjectDemo(project) {
  return [
    `# ${project.name} - Demo`,
    '',
    '## Key Features Demo',
    '',
    ...project.features.map((feature, index) => 
      `### ${index + 1}. ${feature}\n\n*Interactive demo for ${feature} would be available here.*\n`
    ),
    '',
    '## Try It Yourself',
    '',
    project.liveUrl 
      ? `Visit the live demo at [${project.liveUrl}](${project.liveUrl})`
      : 'Demo environment setup instructions would be provided here.',
    '',
    `*Demo last updated: ${new Date().toLocaleDateString()}*`
  ].join('\n');
}

function inferDeploymentStack(project) {
  const stack = [];
  
  if (project.techStack.includes('Next.js') || project.techStack.includes('React')) {
    stack.push('Vercel');
  }
  if (project.techStack.includes('Python') || project.techStack.includes('FastAPI')) {
    stack.push('Railway', 'Docker');
  }
  if (project.techStack.includes('PostgreSQL')) {
    stack.push('Supabase');
  }
  
  return stack.length > 0 ? stack : ['Static Hosting'];
}

// Run the initialization
if (require.main === module) {
  initializeContentStructure().catch(console.error);
}

module.exports = { initializeContentStructure };