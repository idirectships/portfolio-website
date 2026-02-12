import {
  ProjectData,
  FileSystemNode,
  ContentMetadata,
} from '../types/portfolio';
import { contentService } from './ContentService';

export interface ContentUpdateEvent {
  type: 'file_changed' | 'file_added' | 'file_deleted' | 'project_updated';
  path: string;
  timestamp: Date;
  metadata?: ContentMetadata;
}

export interface ContentPipeline {
  processMarkdown: (
    content: string,
    metadata?: ContentMetadata
  ) => Promise<string>;
  processProject: (projectData: ProjectData) => Promise<void>;
  regenerateIndex: () => Promise<void>;
  validateContent: (content: string, type: string) => Promise<boolean>;
}

export class ContentManager implements ContentPipeline {
  private updateListeners: ((event: ContentUpdateEvent) => void)[] = [];
  private contentCache = new Map<
    string,
    { content: string; lastModified: Date }
  >();
  private projectIndex = new Map<string, ProjectData>();
  private watchedPaths = new Set<string>();

  constructor() {
    this.initializeContentWatching();
  }

  /**
   * Initialize content watching for automatic updates
   */
  private initializeContentWatching(): void {
    // In a real implementation, this would set up file system watchers
    // For now, we'll simulate content watching with periodic checks
    this.setupContentPolling();
  }

  /**
   * Set up periodic content checking (simulates file watching)
   */
  private setupContentPolling(): void {
    // Check for content updates every 30 seconds in development
    if (
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      setInterval(() => {
        this.checkForContentUpdates();
      }, 30000);
    }
  }

  /**
   * Check for content updates across watched paths
   */
  private async checkForContentUpdates(): Promise<void> {
    for (const path of this.watchedPaths) {
      try {
        const currentContent = await contentService.loadContent(path);
        const cached = this.contentCache.get(path);

        if (currentContent && (!cached || cached.content !== currentContent)) {
          // Content has changed
          this.contentCache.set(path, {
            content: currentContent,
            lastModified: new Date(),
          });

          this.notifyContentUpdate({
            type: 'file_changed',
            path,
            timestamp: new Date(),
          });

          // If it's a project file, update project index
          if (path.includes('/projects/') && path.endsWith('README.md')) {
            await this.updateProjectFromReadme(path, currentContent);
          }
        }
      } catch (error) {
        console.error(`Error checking content updates for ${path}:`, error);
      }
    }
  }

  /**
   * Process markdown content with metadata
   */
  async processMarkdown(
    content: string,
    metadata?: ContentMetadata
  ): Promise<string> {
    // Extract frontmatter if present
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    let processedContent = content;
    let extractedMetadata: any = {};

    if (match) {
      const [, frontmatter, markdownContent] = match;
      processedContent = markdownContent;

      // Parse YAML frontmatter (simplified)
      try {
        extractedMetadata = this.parseYamlFrontmatter(frontmatter);
      } catch (error) {
        console.warn('Failed to parse frontmatter:', error);
      }
    }

    // Merge metadata
    const finalMetadata = { ...extractedMetadata, ...metadata };

    // Process markdown content
    processedContent = await this.enhanceMarkdownContent(
      processedContent,
      finalMetadata
    );

    return processedContent;
  }

  /**
   * Parse YAML frontmatter (simplified implementation)
   */
  private parseYamlFrontmatter(yaml: string): any {
    const result: any = {};
    const lines = yaml.split('\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');

        // Try to parse as JSON for arrays/objects
        try {
          result[key] = JSON.parse(cleanValue);
        } catch {
          result[key] = cleanValue;
        }
      }
    }

    return result;
  }

  /**
   * Enhance markdown content with dynamic elements
   */
  private async enhanceMarkdownContent(
    content: string,
    metadata: any
  ): Promise<string> {
    let enhanced = content;

    // Replace project references with live data
    const projectRefRegex = /\{\{project:([^}]+)\}\}/g;
    enhanced = enhanced.replace(projectRefRegex, (match, projectId) => {
      const project = this.projectIndex.get(projectId);
      if (project) {
        return `[${project.name}](${project.liveUrl || project.githubUrl || '#'})`;
      }
      return match;
    });

    // Replace skill references with live data
    const skillRefRegex = /\{\{skills:([^}]+)\}\}/g;
    enhanced = enhanced.replace(skillRefRegex, (match, category) => {
      // This would fetch skills from the content service
      return `*Skills in ${category} category*`;
    });

    // Add last updated timestamp if metadata includes it
    if (metadata.lastUpdated) {
      enhanced += `\n\n*Last updated: ${new Date(metadata.lastUpdated).toLocaleDateString()}*`;
    }

    return enhanced;
  }

  /**
   * Process project data and update index
   */
  async processProject(projectData: ProjectData): Promise<void> {
    // Validate project data
    if (!this.validateProjectData(projectData)) {
      throw new Error(`Invalid project data for ${projectData.id}`);
    }

    // Update project index
    this.projectIndex.set(projectData.id, projectData);

    // Generate project files if they don't exist
    await this.generateProjectFiles(projectData);

    // Notify listeners
    this.notifyContentUpdate({
      type: 'project_updated',
      path: `/projects/${projectData.category}/${projectData.id}`,
      timestamp: new Date(),
      metadata: {
        projectId: projectData.id,
        category: projectData.category,
        status: projectData.status,
      },
    });
  }

  /**
   * Validate project data structure
   */
  private validateProjectData(project: ProjectData): boolean {
    const required = ['id', 'name', 'description', 'techStack', 'category'];
    return required.every(
      (field) => project[field as keyof ProjectData] !== undefined
    );
  }

  /**
   * Generate project files from project data
   */
  private async generateProjectFiles(project: ProjectData): Promise<void> {
    const projectPath = `/projects/${project.category}/${project.id}`;

    // Generate README.md
    const readmeContent = this.generateProjectReadme(project);
    await this.writeContentFile(`${projectPath}/README.md`, readmeContent);

    // Generate tech-stack.json
    const techStackContent = JSON.stringify(
      {
        primary: project.techStack.slice(0, 3),
        secondary: project.techStack.slice(3),
        deployment: this.inferDeploymentStack(project),
        lastUpdated: new Date().toISOString(),
      },
      null,
      2
    );
    await this.writeContentFile(
      `${projectPath}/tech-stack.json`,
      techStackContent
    );

    // Generate launch.link or github.link
    if (project.liveUrl) {
      await this.writeContentFile(
        `${projectPath}/launch.link`,
        project.liveUrl
      );
    }
    if (project.githubUrl) {
      await this.writeContentFile(
        `${projectPath}/github.link`,
        project.githubUrl
      );
    }

    // Generate demo.md if features are available
    if (project.features && project.features.length > 0) {
      const demoContent = this.generateProjectDemo(project);
      await this.writeContentFile(`${projectPath}/demo.md`, demoContent);
    }
  }

  /**
   * Generate README content for a project
   */
  private generateProjectReadme(project: ProjectData): string {
    const sections = [
      `# ${project.name}`,
      '',
      project.description,
      '',
      '## Features',
      ...project.features.map((feature) => `- ${feature}`),
      '',
      '## Tech Stack',
      ...project.techStack.map((tech) => `- ${tech}`),
    ];

    if (project.challenges && project.challenges.length > 0) {
      sections.push(
        '',
        '## Challenges Solved',
        ...project.challenges.map((challenge) => `- ${challenge}`)
      );
    }

    if (project.outcomes && project.outcomes.length > 0) {
      sections.push(
        '',
        '## Outcomes',
        ...project.outcomes.map((outcome) => `- ${outcome}`)
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

  /**
   * Generate demo content for a project
   */
  private generateProjectDemo(project: ProjectData): string {
    return [
      `# ${project.name} - Demo`,
      '',
      '## Key Features Demo',
      '',
      ...project.features.map(
        (feature, index) =>
          `### ${index + 1}. ${feature}\n\n*Demo content for ${feature} would be shown here.*\n`
      ),
      '',
      '## Try It Yourself',
      '',
      project.liveUrl
        ? `Visit the live demo at [${project.liveUrl}](${project.liveUrl})`
        : 'Demo environment setup instructions would be provided here.',
    ].join('\n');
  }

  /**
   * Infer deployment stack from project data
   */
  private inferDeploymentStack(project: ProjectData): string[] {
    const stack = [];

    if (
      project.techStack.includes('Next.js') ||
      project.techStack.includes('React')
    ) {
      stack.push('Vercel');
    }
    if (
      project.techStack.includes('Python') ||
      project.techStack.includes('FastAPI')
    ) {
      stack.push('Railway', 'Docker');
    }
    if (project.techStack.includes('PostgreSQL')) {
      stack.push('Supabase');
    }

    return stack.length > 0 ? stack : ['Static Hosting'];
  }

  /**
   * Write content to file (simulated)
   */
  private async writeContentFile(path: string, content: string): Promise<void> {
    // In a real implementation, this would write to the file system
    // For now, we'll update our cache and notify listeners
    this.contentCache.set(path, {
      content,
      lastModified: new Date(),
    });

    this.notifyContentUpdate({
      type: 'file_added',
      path,
      timestamp: new Date(),
    });
  }

  /**
   * Update project from README content
   */
  private async updateProjectFromReadme(
    path: string,
    content: string
  ): Promise<void> {
    // Extract project ID from path
    const pathParts = path.split('/');
    const projectId = pathParts[pathParts.length - 2];

    if (!projectId) return;

    // Parse README to extract project information
    const project = this.parseProjectFromReadme(projectId, content);
    if (project) {
      await this.processProject(project);
    }
  }

  /**
   * Parse project data from README content
   */
  private parseProjectFromReadme(
    projectId: string,
    content: string
  ): ProjectData | null {
    const lines = content.split('\n');
    const project: Partial<ProjectData> = {
      id: projectId,
      features: [],
      challenges: [],
      outcomes: [],
      techStack: [],
    };

    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        project.name = trimmed.substring(2);
      } else if (trimmed.startsWith('## Features')) {
        currentSection = 'features';
      } else if (trimmed.startsWith('## Tech Stack')) {
        currentSection = 'techStack';
      } else if (trimmed.startsWith('## Challenges')) {
        currentSection = 'challenges';
      } else if (trimmed.startsWith('## Outcomes')) {
        currentSection = 'outcomes';
      } else if (trimmed.startsWith('- ')) {
        const item = trimmed.substring(2);
        if (currentSection === 'features') {
          project.features!.push(item);
        } else if (currentSection === 'techStack') {
          project.techStack!.push(item);
        } else if (currentSection === 'challenges') {
          project.challenges!.push(item);
        } else if (currentSection === 'outcomes') {
          project.outcomes!.push(item);
        }
      } else if (!project.description && trimmed && !trimmed.startsWith('#')) {
        project.description = trimmed;
      }
    }

    // Determine category from path
    if (projectId.includes('web-app')) {
      project.category = 'web-apps';
    } else if (projectId.includes('client')) {
      project.category = 'client-sites';
    } else {
      project.category = 'experiments';
    }

    project.status = 'active';

    return this.validateProjectData(project as ProjectData)
      ? (project as ProjectData)
      : null;
  }

  /**
   * Regenerate content index
   */
  async regenerateIndex(): Promise<void> {
    // Clear existing caches
    this.contentCache.clear();
    this.projectIndex.clear();

    // Rebuild file system and content index
    const fileSystem = await contentService.buildFileSystem();
    await this.indexFileSystemContent(fileSystem);

    this.notifyContentUpdate({
      type: 'file_changed',
      path: '/index',
      timestamp: new Date(),
    });
  }

  /**
   * Index all content in the file system
   */
  private async indexFileSystemContent(node: FileSystemNode): Promise<void> {
    if (node.type === 'file') {
      // Add to watched paths
      this.watchedPaths.add(node.path);

      // Load and cache content
      const content = await contentService.loadContent(node.path);
      if (content) {
        this.contentCache.set(node.path, {
          content,
          lastModified: new Date(),
        });
      }
    } else if (node.children) {
      // Recursively index children
      for (const child of node.children) {
        await this.indexFileSystemContent(child);
      }
    }
  }

  /**
   * Validate content based on type
   */
  async validateContent(content: string, type: string): Promise<boolean> {
    try {
      switch (type) {
        case 'markdown':
          return this.validateMarkdown(content);
        case 'json':
          JSON.parse(content);
          return true;
        case 'yaml':
          return this.validateYaml(content);
        default:
          return true; // Unknown types are considered valid
      }
    } catch (error) {
      console.error(`Content validation failed for type ${type}:`, error);
      return false;
    }
  }

  /**
   * Validate markdown content
   */
  private validateMarkdown(content: string): boolean {
    // Basic markdown validation
    // Check for balanced brackets, proper heading structure, etc.

    // Check for balanced brackets
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;

    if (openBrackets !== closeBrackets) {
      return false;
    }

    // Check for proper heading hierarchy
    const headings = content.match(/^#+\s/gm) || [];
    let lastLevel = 0;

    for (const heading of headings) {
      const level = heading.match(/^#+/)?.[0].length || 0;
      if (level > lastLevel + 1) {
        return false; // Skipped heading level
      }
      lastLevel = level;
    }

    return true;
  }

  /**
   * Validate YAML content (simplified)
   */
  private validateYaml(content: string): boolean {
    // Basic YAML validation
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        // Check for proper key-value format
        if (!trimmed.includes(':') && !trimmed.startsWith('-')) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Add content update listener
   */
  addUpdateListener(listener: (event: ContentUpdateEvent) => void): void {
    this.updateListeners.push(listener);
  }

  /**
   * Remove content update listener
   */
  removeUpdateListener(listener: (event: ContentUpdateEvent) => void): void {
    const index = this.updateListeners.indexOf(listener);
    if (index > -1) {
      this.updateListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of content updates
   */
  private notifyContentUpdate(event: ContentUpdateEvent): void {
    this.updateListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in content update listener:', error);
      }
    });
  }

  /**
   * Get content statistics
   */
  getContentStats(): {
    cachedFiles: number;
    watchedPaths: number;
    projects: number;
    lastUpdate: Date | null;
  } {
    const lastUpdate =
      Array.from(this.contentCache.values())
        .map((item) => item.lastModified)
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    return {
      cachedFiles: this.contentCache.size,
      watchedPaths: this.watchedPaths.size,
      projects: this.projectIndex.size,
      lastUpdate,
    };
  }

  /**
   * Force refresh of specific content
   */
  async refreshContent(path: string): Promise<void> {
    this.contentCache.delete(path);
    const content = await contentService.loadContent(path);

    if (content) {
      this.contentCache.set(path, {
        content,
        lastModified: new Date(),
      });

      this.notifyContentUpdate({
        type: 'file_changed',
        path,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get all projects in index
   */
  getAllProjects(): ProjectData[] {
    return Array.from(this.projectIndex.values());
  }

  /**
   * Get project by ID
   */
  getProject(id: string): ProjectData | undefined {
    return this.projectIndex.get(id);
  }
}

// Export singleton instance
export const contentManager = new ContentManager();
