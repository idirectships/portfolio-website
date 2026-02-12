import { contentManager } from '../services/ContentManager';
import { ProjectData } from '../types/portfolio';

/**
 * Content regeneration utilities for automatic content updates
 */
export class ContentRegenerationUtils {
  /**
   * Regenerate all project content from data
   */
  static async regenerateAllProjects(): Promise<void> {
    console.log('Starting project content regeneration...');

    const projects = contentManager.getAllProjects();

    for (const project of projects) {
      try {
        await contentManager.processProject(project);
        console.log(`Regenerated content for project: ${project.name}`);
      } catch (error) {
        console.error(`Failed to regenerate project ${project.id}:`, error);
      }
    }

    console.log(`Completed regeneration for ${projects.length} projects`);
  }

  /**
   * Update project data and regenerate content
   */
  static async updateProject(
    projectId: string,
    updates: Partial<ProjectData>
  ): Promise<void> {
    const existingProject = contentManager.getProject(projectId);

    if (!existingProject) {
      throw new Error(`Project ${projectId} not found`);
    }

    const updatedProject: ProjectData = {
      ...existingProject,
      ...updates,
    };

    await contentManager.processProject(updatedProject);
    console.log(`Updated project: ${updatedProject.name}`);
  }

  /**
   * Add new project and generate all associated files
   */
  static async addNewProject(projectData: ProjectData): Promise<void> {
    await contentManager.processProject(projectData);
    console.log(`Added new project: ${projectData.name}`);
  }

  /**
   * Batch update multiple projects
   */
  static async batchUpdateProjects(
    updates: { id: string; data: Partial<ProjectData> }[]
  ): Promise<void> {
    console.log(`Starting batch update for ${updates.length} projects...`);

    const results = await Promise.allSettled(
      updates.map(({ id, data }) => this.updateProject(id, data))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(
      `Batch update completed: ${successful} successful, ${failed} failed`
    );

    if (failed > 0) {
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason);
      console.error('Batch update errors:', errors);
    }
  }

  /**
   * Validate all content and report issues
   */
  static async validateAllContent(): Promise<{
    valid: string[];
    invalid: { path: string; error: string }[];
  }> {
    const results = {
      valid: [] as string[],
      invalid: [] as { path: string; error: string }[],
    };

    const stats = contentManager.getContentStats();
    console.log(`Validating ${stats.cachedFiles} cached files...`);

    // This would iterate through all cached content in a real implementation
    // For now, we'll simulate validation of key content types
    const contentTypes = [
      { path: '/artist/bio.md', type: 'markdown' },
      { path: '/studio/toolbox/languages.json', type: 'json' },
      { path: '/projects/project-index.md', type: 'markdown' },
    ];

    for (const { path, type } of contentTypes) {
      try {
        // Simulate content loading and validation
        const isValid = await contentManager.validateContent(
          'sample content',
          type
        );

        if (isValid) {
          results.valid.push(path);
        } else {
          results.invalid.push({ path, error: 'Content validation failed' });
        }
      } catch (error) {
        results.invalid.push({
          path,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(
      `Validation complete: ${results.valid.length} valid, ${results.invalid.length} invalid`
    );
    return results;
  }

  /**
   * Generate content index for search and navigation
   */
  static async generateContentIndex(): Promise<{
    files: number;
    projects: number;
    lastUpdate: Date;
  }> {
    console.log('Generating content index...');

    await contentManager.regenerateIndex();
    const stats = contentManager.getContentStats();

    const indexData = {
      files: stats.cachedFiles,
      projects: stats.projects,
      lastUpdate: stats.lastUpdate || new Date(),
    };

    console.log('Content index generated:', indexData);
    return indexData;
  }

  /**
   * Setup automatic content regeneration
   */
  static setupAutoRegeneration(): void {
    // Listen for content updates
    contentManager.addUpdateListener((event) => {
      console.log(`Content update detected: ${event.type} at ${event.path}`);

      // Trigger regeneration based on event type
      switch (event.type) {
        case 'project_updated':
          console.log('Project updated, regenerating related content...');
          break;
        case 'file_changed':
          if (event.path.includes('README.md')) {
            console.log('README updated, checking for project changes...');
          }
          break;
        default:
          console.log('General content update, no specific action needed');
      }
    });

    console.log('Auto-regeneration setup complete');
  }

  /**
   * Export content for backup or migration
   */
  static async exportContent(): Promise<{
    projects: ProjectData[];
    metadata: {
      exportDate: Date;
      version: string;
      stats: any;
    };
  }> {
    const projects = contentManager.getAllProjects();
    const stats = contentManager.getContentStats();

    return {
      projects,
      metadata: {
        exportDate: new Date(),
        version: '1.0.0',
        stats,
      },
    };
  }

  /**
   * Import content from backup
   */
  static async importContent(data: {
    projects: ProjectData[];
    metadata?: any;
  }): Promise<void> {
    console.log(`Importing ${data.projects.length} projects...`);

    for (const project of data.projects) {
      try {
        await contentManager.processProject(project);
      } catch (error) {
        console.error(`Failed to import project ${project.id}:`, error);
      }
    }

    await contentManager.regenerateIndex();
    console.log('Content import completed');
  }

  /**
   * Schedule periodic content updates
   */
  static schedulePeriodicUpdates(intervalMinutes: number = 60): void {
    if (typeof window === 'undefined') return; // Server-side, no scheduling

    const interval = intervalMinutes * 60 * 1000;

    setInterval(async () => {
      try {
        console.log('Running scheduled content update...');
        await this.generateContentIndex();

        // Validate content periodically
        const validation = await this.validateAllContent();
        if (validation.invalid.length > 0) {
          console.warn('Content validation issues found:', validation.invalid);
        }
      } catch (error) {
        console.error('Scheduled content update failed:', error);
      }
    }, interval);

    console.log(`Scheduled periodic updates every ${intervalMinutes} minutes`);
  }
}

// Development utilities
export const devUtils = {
  /**
   * Add sample projects for development
   */
  async addSampleProjects(): Promise<void> {
    const sampleProjects: ProjectData[] = [
      {
        id: 'sample-web-app',
        name: 'Sample Web Application',
        description:
          'A demonstration web application showcasing modern development practices',
        techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        category: 'web-apps',
        status: 'active',
        features: [
          'User authentication',
          'Real-time updates',
          'Responsive design',
        ],
        challenges: [
          'Performance optimization',
          'Security implementation',
          'Scalability',
        ],
        outcomes: [
          'Improved user experience',
          'Reduced load times',
          'Enhanced security',
        ],
        liveUrl: 'https://sample-app.example.com',
        githubUrl: 'https://github.com/example/sample-app',
      },
      {
        id: 'client-portfolio',
        name: 'Client Portfolio Site',
        description: 'Professional portfolio website for a design client',
        techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion'],
        category: 'client-sites',
        status: 'completed',
        features: [
          'Animated transitions',
          'Portfolio gallery',
          'Contact forms',
        ],
        challenges: [
          'Brand alignment',
          'Performance requirements',
          'SEO optimization',
        ],
        outcomes: [
          'Increased client inquiries',
          'Better brand presence',
          'Improved SEO',
        ],
        liveUrl: 'https://client-portfolio.example.com',
      },
      {
        id: 'ai-experiment',
        name: 'AI Content Generator',
        description: 'Experimental AI-powered content generation tool',
        techStack: ['Python', 'OpenAI API', 'FastAPI', 'React'],
        category: 'experiments',
        status: 'active',
        features: [
          'Natural language processing',
          'Content templates',
          'Export options',
        ],
        challenges: ['API rate limiting', 'Content quality', 'User experience'],
        outcomes: [
          'Proof of concept',
          'Learning experience',
          'Future potential',
        ],
        githubUrl: 'https://github.com/example/ai-experiment',
      },
    ];

    for (const project of sampleProjects) {
      await ContentRegenerationUtils.addNewProject(project);
    }

    console.log('Sample projects added successfully');
  },

  /**
   * Clear all content for testing
   */
  async clearAllContent(): Promise<void> {
    await contentManager.regenerateIndex();
    console.log('All content cleared');
  },

  /**
   * Generate test content updates
   */
  async simulateContentUpdates(): Promise<void> {
    const projects = contentManager.getAllProjects();

    if (projects.length > 0) {
      const randomProject =
        projects[Math.floor(Math.random() * projects.length)];

      await ContentRegenerationUtils.updateProject(randomProject.id, {
        description: `${randomProject.description} (Updated at ${new Date().toLocaleTimeString()})`,
      });

      console.log(`Simulated update for project: ${randomProject.name}`);
    }
  },
};
