import { useState, useEffect, useCallback } from 'react';
import { contentManager, ContentUpdateEvent } from '../services/ContentManager';
import { ProjectData } from '../types/portfolio';

export interface ContentManagerState {
  isLoading: boolean;
  error: string | null;
  stats: {
    cachedFiles: number;
    watchedPaths: number;
    projects: number;
    lastUpdate: Date | null;
  };
  projects: ProjectData[];
}

export interface ContentManagerActions {
  refreshContent: (path?: string) => Promise<void>;
  updateProject: (
    projectId: string,
    updates: Partial<ProjectData>
  ) => Promise<void>;
  addProject: (project: ProjectData) => Promise<void>;
  regenerateIndex: () => Promise<void>;
  validateContent: (content: string, type: string) => Promise<boolean>;
}

/**
 * React hook for managing content updates and state
 */
export function useContentManager(): ContentManagerState &
  ContentManagerActions {
  const [state, setState] = useState<ContentManagerState>({
    isLoading: false,
    error: null,
    stats: {
      cachedFiles: 0,
      watchedPaths: 0,
      projects: 0,
      lastUpdate: null,
    },
    projects: [],
  });

  // Update state with current content manager stats
  const updateStats = useCallback(() => {
    const stats = contentManager.getContentStats();
    const projects = contentManager.getAllProjects();

    setState((prev) => ({
      ...prev,
      stats,
      projects,
    }));
  }, []);

  // Handle content update events
  const handleContentUpdate = useCallback(
    (event: ContentUpdateEvent) => {
      console.log('Content update received:', event);

      // Update stats after content changes
      setTimeout(updateStats, 100);

      // Handle specific update types
      switch (event.type) {
        case 'project_updated':
          console.log(`Project updated: ${event.path}`);
          break;
        case 'file_changed':
          console.log(`File changed: ${event.path}`);
          break;
        case 'file_added':
          console.log(`File added: ${event.path}`);
          break;
        case 'file_deleted':
          console.log(`File deleted: ${event.path}`);
          break;
      }
    },
    [updateStats]
  );

  // Setup content update listener
  useEffect(() => {
    contentManager.addUpdateListener(handleContentUpdate);
    updateStats(); // Initial stats load

    return () => {
      contentManager.removeUpdateListener(handleContentUpdate);
    };
  }, [handleContentUpdate, updateStats]);

  // Action: Refresh content
  const refreshContent = useCallback(
    async (path?: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (path) {
          await contentManager.refreshContent(path);
        } else {
          await contentManager.regenerateIndex();
        }
        updateStats();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to refresh content',
        }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [updateStats]
  );

  // Action: Update project
  const updateProject = useCallback(
    async (projectId: string, updates: Partial<ProjectData>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const existingProject = contentManager.getProject(projectId);
        if (!existingProject) {
          throw new Error(`Project ${projectId} not found`);
        }

        const updatedProject: ProjectData = {
          ...existingProject,
          ...updates,
        };

        await contentManager.processProject(updatedProject);
        updateStats();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Failed to update project',
        }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [updateStats]
  );

  // Action: Add new project
  const addProject = useCallback(
    async (project: ProjectData) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await contentManager.processProject(project);
        updateStats();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Failed to add project',
        }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [updateStats]
  );

  // Action: Regenerate index
  const regenerateIndex = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await contentManager.regenerateIndex();
      updateStats();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to regenerate index',
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [updateStats]);

  // Action: Validate content
  const validateContent = useCallback(
    async (content: string, type: string): Promise<boolean> => {
      try {
        return await contentManager.validateContent(content, type);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Content validation failed',
        }));
        return false;
      }
    },
    []
  );

  return {
    ...state,
    refreshContent,
    updateProject,
    addProject,
    regenerateIndex,
    validateContent,
  };
}

/**
 * Hook for monitoring content updates in real-time
 */
export function useContentUpdates() {
  const [updates, setUpdates] = useState<ContentUpdateEvent[]>([]);
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    if (isListening) return;

    const handleUpdate = (event: ContentUpdateEvent) => {
      setUpdates((prev) => [event, ...prev.slice(0, 49)]); // Keep last 50 updates
    };

    contentManager.addUpdateListener(handleUpdate);
    setIsListening(true);

    return () => {
      contentManager.removeUpdateListener(handleUpdate);
      setIsListening(false);
    };
  }, [isListening]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    // Cleanup is handled by the effect return function
  }, []);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  useEffect(() => {
    const cleanup = startListening();
    return cleanup;
  }, [startListening]);

  return {
    updates,
    isListening,
    startListening,
    stopListening,
    clearUpdates,
  };
}

/**
 * Hook for project-specific content management
 */
export function useProjectContent(projectId?: string) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const projectData = contentManager.getProject(id);
      setProject(projectData || null);

      if (!projectData) {
        setError(`Project ${id} not found`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProject = useCallback(
    async (updates: Partial<ProjectData>) => {
      if (!project) return;

      setIsLoading(true);
      setError(null);

      try {
        const updatedProject: ProjectData = { ...project, ...updates };
        await contentManager.processProject(updatedProject);
        setProject(updatedProject);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update project'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [project]
  );

  const refreshProject = useCallback(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);

  return {
    project,
    isLoading,
    error,
    updateProject,
    refreshProject,
  };
}
