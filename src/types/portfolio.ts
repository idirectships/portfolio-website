// Portfolio Data Models

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  liveUrl?: string;
  githubUrl?: string;
  status: 'active' | 'completed' | 'locked';
  category: 'web-apps' | 'client-sites' | 'experiments';
  features: string[];
  challenges: string[];
  outcomes: string[];
  readme?: string;
  demoFiles?: string[];
}

export interface SkillData {
  category: string;
  skills: {
    name: string;
    level: 'beginner' | 'proficient' | 'expert';
    context: string;
  }[];
}

export interface ExperienceData {
  company: string;
  role: string;
  duration: string;
  location: string;
  achievements: string[];
  technologies: string[];
}

export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  metadata?: FileMetadata;
  children?: FileSystemNode[];
}

export interface FileMetadata {
  size?: number;
  modified?: Date;
  permissions?: string;
  mimeType?: string;
  executable?: boolean;
  projectId?: string;
  category?: string;
  status?: string;
  lastUpdated?: string;
}

export interface ContentMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  lastUpdated?: string;
  author?: string;
  projectId?: string;
  category?: string;
  status?: string;
}

export interface PortfolioContent {
  artist: {
    bio: string;
    philosophy: string;
    journey: string;
    influences?: string[];
  };
  studio: {
    toolbox: {
      languages: SkillData[];
      frameworks: SkillData[];
      tools: SkillData[];
    };
    certifications: string[];
    workspaceSetup: string;
  };
  projects: {
    webApps: ProjectData[];
    clientSites: ProjectData[];
    experiments: ProjectData[];
  };
  gallery: {
    screenshots: string[];
    designMockups: string[];
    processVideos: string[];
    uiComponents: string[];
  };
  commissions: {
    available: boolean;
    services: string[];
    process: string;
    contact: string;
  };
}

export interface ContentCache {
  [path: string]: {
    content: string;
    lastFetched: Date;
    ttl: number;
  };
}

// Navigation and Terminal Types
export interface NavigationState {
  currentPath: string;
  history: string[];
  fileSystem: FileSystemNode;
}

export interface TerminalOutput {
  id: string;
  command: string;
  output: string | React.JSX.Element;
  timestamp: Date;
  error?: boolean;
}
