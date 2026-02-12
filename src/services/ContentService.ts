import {
  PortfolioContent,
  ProjectData,
  FileSystemNode,
  ContentCache,
  SkillData,
} from '../types/portfolio';

export class ContentService {
  private cache: ContentCache = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeFileSystem();
  }

  private initializeFileSystem(): void {
    // Initialize the virtual file system structure
    // This will be populated with actual content from the public/content directory
  }

  /**
   * Load content from a file path with caching
   */
  async loadContent(path: string): Promise<string | null> {
    // Check cache first
    const cached = this.cache[path];
    if (cached && Date.now() - cached.lastFetched.getTime() < cached.ttl) {
      return cached.content;
    }

    try {
      // In a real implementation, this would fetch from the file system or API
      // For now, we'll simulate content loading
      const content = await this.fetchContentFromPath(path);

      // Cache the result
      this.cache[path] = {
        content,
        lastFetched: new Date(),
        ttl: this.CACHE_TTL,
      };

      return content;
    } catch (error) {
      console.error(`Failed to load content from ${path}:`, error);
      return null;
    }
  }

  /**
   * Simulate fetching content from file system
   */
  private async fetchContentFromPath(path: string): Promise<string> {
    // This would typically use fs.readFile or fetch in a real implementation
    // For now, return mock content based on path

    if (path.includes('bio.md')) {
      return `# Andrew "Dru" Garman

## AI Implementation Specialist & Ex-FAANG Recruiter

Transitioning from talent acquisition at top tech companies to hands-on AI engineering. 
Passionate about building intelligent systems that solve real-world problems.

### Background
- Former Senior Technical Recruiter at FAANG companies
- Deep understanding of tech talent landscape
- Now focusing on AI/ML implementation and development

### Current Focus
- AI system design and implementation
- Machine learning model development
- Technical recruiting automation
- Building AI-powered tools for talent acquisition`;
    }

    if (path.includes('languages.json')) {
      return JSON.stringify(
        {
          programming: [
            {
              name: 'Python',
              level: 'proficient',
              context: 'AI/ML development, automation',
            },
            {
              name: 'TypeScript',
              level: 'proficient',
              context: 'Web development, tooling',
            },
            {
              name: 'JavaScript',
              level: 'expert',
              context: 'Full-stack development',
            },
            {
              name: 'SQL',
              level: 'proficient',
              context: 'Data analysis, database design',
            },
          ],
          ai_ml: [
            {
              name: 'TensorFlow',
              level: 'beginner',
              context: 'Model training and deployment',
            },
            {
              name: 'PyTorch',
              level: 'beginner',
              context: 'Research and experimentation',
            },
            {
              name: 'Scikit-learn',
              level: 'proficient',
              context: 'Classical ML algorithms',
            },
            {
              name: 'Pandas',
              level: 'proficient',
              context: 'Data manipulation and analysis',
            },
          ],
        },
        null,
        2
      );
    }

    if (path.includes('project-index.md')) {
      return `# Project Portfolio

## Web Applications
- **AI Recruiter Assistant** - Automated candidate screening tool
- **Portfolio Terminal** - This interactive CLI-themed website
- **Talent Pipeline Tracker** - Recruitment workflow management

## Client Sites
- **TechCorp Landing Page** - Modern corporate website
- **StartupXYZ Platform** - SaaS application interface

## Experiments
- **Voice-to-Code** - Speech recognition for programming
- **Resume Parser AI** - Intelligent resume analysis tool`;
    }

    // Handle project-specific files
    if (path.includes('ai-recruiter-assistant/launch.link')) {
      return 'https://ai-recruiter.example.com';
    }

    if (path.includes('portfolio-terminal/launch.link')) {
      return 'https://drugarman.dev';
    }

    if (path.includes('techcorp-landing/launch.link')) {
      return 'https://techcorp.example.com';
    }

    if (path.includes('voice-to-code/github.link')) {
      return 'https://github.com/drugarman/voice-to-code';
    }

    // For README.md files, try to load from actual files
    if (path.includes('README.md')) {
      // In a real implementation, this would fetch from the public directory
      // For now, return a placeholder that indicates the file exists
      const projectName = path.split('/').slice(-2, -1)[0];
      return `# ${projectName}\n\nProject documentation would be loaded from the actual file system.\n\nTo see the full content, the system would need to fetch from:\n/content${path.replace('~', '')}`;
    }

    // For tech-stack.json files
    if (path.includes('tech-stack.json')) {
      const projectName = path.split('/').slice(-2, -1)[0];
      return JSON.stringify(
        {
          note: `Tech stack for ${projectName}`,
          status: 'Would be loaded from actual file system',
          path: `/content${path.replace('~', '')}`,
        },
        null,
        2
      );
    }

    // Default content for unknown paths
    return `Content for ${path}\n\nThis would be loaded from the actual file system in a production implementation.`;
  }

  /**
   * Get the complete portfolio content structure
   */
  async getPortfolioContent(): Promise<PortfolioContent> {
    const [bio, languages] = await Promise.all([
      this.loadContent('/content/artist/bio.md'),
      this.loadContent('/content/studio/toolbox/languages.json'),
    ]);

    // Parse languages JSON
    let skillData: SkillData[] = [];
    if (languages) {
      try {
        const parsed = JSON.parse(languages);
        skillData = Object.entries(parsed).map(([category, skills]) => ({
          category,
          skills: skills as Array<{
            name: string;
            level: 'beginner' | 'proficient' | 'expert';
            context: string;
          }>,
        }));
      } catch (error) {
        console.error('Failed to parse languages.json:', error);
      }
    }

    return {
      artist: {
        bio: bio || '',
        philosophy: 'Building bridges between human talent and AI capabilities',
        journey: 'From recruiting top tech talent to building AI systems',
        influences: ['Simon Sinek', 'Andrew Ng', 'Satya Nadella'],
      },
      studio: {
        toolbox: {
          languages: skillData,
          frameworks: [],
          tools: [],
        },
        certifications: [
          'AWS Cloud Practitioner',
          'Google Analytics Certified',
        ],
        workspaceSetup: 'MacBook Pro, VS Code, Terminal-first workflow',
      },
      projects: {
        webApps: await this.getProjectsByCategory('web-apps'),
        clientSites: await this.getProjectsByCategory('client-sites'),
        experiments: await this.getProjectsByCategory('experiments'),
      },
      gallery: {
        screenshots: [],
        designMockups: [],
        processVideos: [],
        uiComponents: [],
      },
      commissions: {
        available: true,
        services: [
          'AI Implementation',
          'Technical Recruiting',
          'Web Development',
        ],
        process: 'Discovery → Planning → Implementation → Delivery',
        contact: 'Available for consulting and project work',
      },
    };
  }

  /**
   * Get projects by category
   */
  private async getProjectsByCategory(
    category: string
  ): Promise<ProjectData[]> {
    // Mock project data - in a real implementation, this would load from files
    const mockProjects: { [key: string]: ProjectData[] } = {
      'web-apps': [
        {
          id: 'ai-recruiter-assistant',
          name: 'AI Recruiter Assistant',
          description: 'Automated candidate screening and matching tool',
          techStack: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'OpenAI API'],
          liveUrl: 'https://ai-recruiter.example.com',
          githubUrl: 'https://github.com/drugarman/ai-recruiter',
          status: 'active',
          category: 'web-apps',
          features: [
            'Resume parsing',
            'Skill matching',
            'Interview scheduling',
          ],
          challenges: [
            'Natural language processing',
            'Bias reduction',
            'Scalability',
          ],
          outcomes: [
            '50% faster screening',
            'Reduced bias',
            'Better candidate experience',
          ],
        },
        {
          id: 'portfolio-terminal',
          name: 'Portfolio Terminal',
          description: 'Interactive CLI-themed portfolio website',
          techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
          liveUrl: 'https://drugarman.dev',
          githubUrl: 'https://github.com/drugarman/portfolio-terminal',
          status: 'active',
          category: 'web-apps',
          features: [
            'Terminal simulation',
            'File system navigation',
            'Responsive design',
          ],
          challenges: [
            'Terminal authenticity',
            'Mobile UX',
            'Performance optimization',
          ],
          outcomes: [
            'Unique user experience',
            'Technical demonstration',
            'Professional branding',
          ],
        },
      ],
      'client-sites': [
        {
          id: 'techcorp-landing',
          name: 'TechCorp Landing Page',
          description: 'Modern corporate website with conversion optimization',
          techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
          liveUrl: 'https://techcorp.example.com',
          status: 'completed',
          category: 'client-sites',
          features: ['Responsive design', 'SEO optimization', 'Contact forms'],
          challenges: [
            'Brand alignment',
            'Performance requirements',
            'Accessibility',
          ],
          outcomes: [
            '40% increase in conversions',
            'Improved SEO ranking',
            'Enhanced brand presence',
          ],
        },
      ],
      experiments: [
        {
          id: 'voice-to-code',
          name: 'Voice-to-Code',
          description: 'Speech recognition for programming workflows',
          techStack: [
            'Python',
            'SpeechRecognition',
            'OpenAI Whisper',
            'VS Code API',
          ],
          githubUrl: 'https://github.com/drugarman/voice-to-code',
          status: 'active',
          category: 'experiments',
          features: ['Voice commands', 'Code generation', 'IDE integration'],
          challenges: [
            'Accuracy',
            'Context understanding',
            'Real-time processing',
          ],
          outcomes: [
            'Proof of concept',
            'Learning experience',
            'Future potential',
          ],
        },
      ],
    };

    return mockProjects[category] || [];
  }

  /**
   * Build file system structure for navigation
   */
  async buildFileSystem(): Promise<FileSystemNode> {
    const root: FileSystemNode = {
      name: '~',
      type: 'directory',
      path: '~',
      children: [
        {
          name: 'artist',
          type: 'directory',
          path: '~/artist',
          children: [
            { name: 'bio.md', type: 'file', path: '~/artist/bio.md' },
            {
              name: 'philosophy.txt',
              type: 'file',
              path: '~/artist/philosophy.txt',
            },
            {
              name: 'journey.timeline',
              type: 'file',
              path: '~/artist/journey.timeline',
            },
            {
              name: 'influences',
              type: 'directory',
              path: '~/artist/influences',
              children: [],
            },
          ],
        },
        {
          name: 'studio',
          type: 'directory',
          path: '~/studio',
          children: [
            {
              name: 'toolbox',
              type: 'directory',
              path: '~/studio/toolbox',
              children: [
                {
                  name: 'languages.json',
                  type: 'file',
                  path: '~/studio/toolbox/languages.json',
                },
                {
                  name: 'frameworks.yaml',
                  type: 'file',
                  path: '~/studio/toolbox/frameworks.yaml',
                },
                {
                  name: 'tools.md',
                  type: 'file',
                  path: '~/studio/toolbox/tools.md',
                },
              ],
            },
            {
              name: 'certifications',
              type: 'directory',
              path: '~/studio/certifications',
              children: [],
            },
            {
              name: 'workspace-setup.md',
              type: 'file',
              path: '~/studio/workspace-setup.md',
            },
          ],
        },
        {
          name: 'projects',
          type: 'directory',
          path: '~/projects',
          children: [
            {
              name: 'project-index.md',
              type: 'file',
              path: '~/projects/project-index.md',
            },
            {
              name: 'web-apps',
              type: 'directory',
              path: '~/projects/web-apps',
              children: [
                {
                  name: 'ai-recruiter-assistant',
                  type: 'directory',
                  path: '~/projects/web-apps/ai-recruiter-assistant',
                  children: [
                    {
                      name: 'README.md',
                      type: 'file',
                      path: '~/projects/web-apps/ai-recruiter-assistant/README.md',
                    },
                    {
                      name: 'tech-stack.json',
                      type: 'file',
                      path: '~/projects/web-apps/ai-recruiter-assistant/tech-stack.json',
                    },
                    {
                      name: 'launch.link',
                      type: 'file',
                      path: '~/projects/web-apps/ai-recruiter-assistant/launch.link',
                    },
                    {
                      name: 'demo.md',
                      type: 'file',
                      path: '~/projects/web-apps/ai-recruiter-assistant/demo.md',
                    },
                  ],
                },
                {
                  name: 'portfolio-terminal',
                  type: 'directory',
                  path: '~/projects/web-apps/portfolio-terminal',
                  children: [
                    {
                      name: 'README.md',
                      type: 'file',
                      path: '~/projects/web-apps/portfolio-terminal/README.md',
                    },
                    {
                      name: 'tech-stack.json',
                      type: 'file',
                      path: '~/projects/web-apps/portfolio-terminal/tech-stack.json',
                    },
                    {
                      name: 'launch.link',
                      type: 'file',
                      path: '~/projects/web-apps/portfolio-terminal/launch.link',
                    },
                  ],
                },
              ],
            },
            {
              name: 'client-sites',
              type: 'directory',
              path: '~/projects/client-sites',
              children: [
                {
                  name: 'techcorp-landing',
                  type: 'directory',
                  path: '~/projects/client-sites/techcorp-landing',
                  children: [
                    {
                      name: 'README.md',
                      type: 'file',
                      path: '~/projects/client-sites/techcorp-landing/README.md',
                    },
                    {
                      name: 'tech-stack.json',
                      type: 'file',
                      path: '~/projects/client-sites/techcorp-landing/tech-stack.json',
                    },
                    {
                      name: 'launch.link',
                      type: 'file',
                      path: '~/projects/client-sites/techcorp-landing/launch.link',
                    },
                  ],
                },
              ],
            },
            {
              name: 'experiments',
              type: 'directory',
              path: '~/projects/experiments',
              children: [
                {
                  name: 'voice-to-code',
                  type: 'directory',
                  path: '~/projects/experiments/voice-to-code',
                  children: [
                    {
                      name: 'README.md',
                      type: 'file',
                      path: '~/projects/experiments/voice-to-code/README.md',
                    },
                    {
                      name: 'tech-stack.json',
                      type: 'file',
                      path: '~/projects/experiments/voice-to-code/tech-stack.json',
                    },
                    {
                      name: 'github.link',
                      type: 'file',
                      path: '~/projects/experiments/voice-to-code/github.link',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'gallery',
          type: 'directory',
          path: '~/gallery',
          children: [
            {
              name: 'screenshots',
              type: 'directory',
              path: '~/gallery/screenshots',
              children: [],
            },
            {
              name: 'design-mockups',
              type: 'directory',
              path: '~/gallery/design-mockups',
              children: [],
            },
            {
              name: 'process-videos',
              type: 'directory',
              path: '~/gallery/process-videos',
              children: [],
            },
            {
              name: 'ui-components',
              type: 'directory',
              path: '~/gallery/ui-components',
              children: [],
            },
          ],
        },
        {
          name: 'commissions',
          type: 'directory',
          path: '~/commissions',
          children: [
            {
              name: 'services.md',
              type: 'file',
              path: '~/commissions/services.md',
            },
            {
              name: 'process.md',
              type: 'file',
              path: '~/commissions/process.md',
            },
            {
              name: 'contact.md',
              type: 'file',
              path: '~/commissions/contact.md',
            },
          ],
        },
        {
          name: 'behind-the-scenes',
          type: 'directory',
          path: '~/behind-the-scenes',
          children: [
            {
              name: 'dev-diary',
              type: 'directory',
              path: '~/behind-the-scenes/dev-diary',
              children: [],
            },
            {
              name: 'lessons-learned',
              type: 'directory',
              path: '~/behind-the-scenes/lessons-learned',
              children: [],
            },
            {
              name: 'tools-review',
              type: 'directory',
              path: '~/behind-the-scenes/tools-review',
              children: [],
            },
          ],
        },
        { name: 'welcome.sh', type: 'file', path: '~/welcome.sh' },
        { name: 'README.md', type: 'file', path: '~/README.md' },
      ],
    };

    return root;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: Object.keys(this.cache).length,
      entries: Object.keys(this.cache),
    };
  }
}

// Export singleton instance
export const contentService = new ContentService();
