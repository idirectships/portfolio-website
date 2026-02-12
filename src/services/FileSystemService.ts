import { FileSystemNode, NavigationState } from '../types/portfolio';
import { contentService } from './ContentService';

export class FileSystemService {
  private fileSystem: FileSystemNode | null = null;
  private navigationState: NavigationState = {
    currentPath: '~',
    history: ['~'],
    fileSystem: {} as FileSystemNode,
  };

  constructor() {
    this.initializeFileSystem();
  }

  private async initializeFileSystem(): Promise<void> {
    this.fileSystem = await contentService.buildFileSystem();
    this.navigationState.fileSystem = this.fileSystem;
  }

  /**
   * Get current directory contents
   */
  async getCurrentDirectoryContents(): Promise<FileSystemNode[]> {
    if (!this.fileSystem) {
      await this.initializeFileSystem();
    }

    const currentNode = this.findNodeByPath(this.navigationState.currentPath);
    return currentNode?.children || [];
  }

  /**
   * Navigate to a directory
   */
  async navigateToDirectory(
    path: string
  ): Promise<{ success: boolean; error?: string; newPath?: string }> {
    if (!this.fileSystem) {
      await this.initializeFileSystem();
    }

    // Handle special paths
    if (path === '~' || path === '/') {
      this.navigationState.currentPath = '~';
      this.addToHistory('~');
      return { success: true, newPath: '~' };
    }

    if (path === '..') {
      return this.navigateUp();
    }

    // Handle relative paths
    let targetPath: string;
    if (path.startsWith('~/')) {
      targetPath = path;
    } else if (path.startsWith('/')) {
      targetPath = '~' + path;
    } else {
      // Relative path from current directory
      if (this.navigationState.currentPath === '~') {
        targetPath = `~/${path}`;
      } else {
        targetPath = `${this.navigationState.currentPath}/${path}`;
      }
    }

    // Check if target directory exists
    const targetNode = this.findNodeByPath(targetPath);
    if (!targetNode) {
      return {
        success: false,
        error: `cd: no such file or directory: ${path}`,
      };
    }

    if (targetNode.type !== 'directory') {
      return {
        success: false,
        error: `cd: not a directory: ${path}`,
      };
    }

    this.navigationState.currentPath = targetPath;
    this.addToHistory(targetPath);
    return { success: true, newPath: targetPath };
  }

  /**
   * Navigate up one directory level
   */
  private navigateUp(): { success: boolean; newPath?: string } {
    const pathParts = this.navigationState.currentPath
      .split('/')
      .filter((p) => p && p !== '~');

    if (pathParts.length === 0) {
      // Already at root
      return { success: true, newPath: '~' };
    }

    pathParts.pop();
    const newPath = pathParts.length === 0 ? '~' : '~/' + pathParts.join('/');

    this.navigationState.currentPath = newPath;
    this.addToHistory(newPath);
    return { success: true, newPath };
  }

  /**
   * Find a node by its path
   */
  private findNodeByPath(path: string): FileSystemNode | null {
    if (!this.fileSystem) return null;

    if (path === '~') {
      return this.fileSystem;
    }

    const pathParts = path
      .replace('~/', '')
      .split('/')
      .filter((p) => p);
    let currentNode = this.fileSystem;

    for (const part of pathParts) {
      const child = currentNode.children?.find((child) => child.name === part);
      if (!child) return null;
      currentNode = child;
    }

    return currentNode;
  }

  /**
   * Get file content
   */
  async getFileContent(filePath: string): Promise<string | null> {
    const node = this.findNodeByPath(filePath);
    if (!node || node.type !== 'file') {
      return null;
    }

    // Load content using ContentService
    return await contentService.loadContent(filePath);
  }

  /**
   * List directory contents with formatting
   */
  async listDirectory(path?: string): Promise<string> {
    const targetPath = path || this.navigationState.currentPath;
    const node = this.findNodeByPath(targetPath);

    if (!node) {
      return `ls: cannot access '${path}': No such file or directory`;
    }

    if (node.type === 'file') {
      return node.name;
    }

    const children = node.children || [];
    if (children.length === 0) {
      return ''; // Empty directory
    }

    // Format directory listing
    const directories = children.filter((child) => child.type === 'directory');
    const files = children.filter((child) => child.type === 'file');

    const formatItem = (item: FileSystemNode): string => {
      const icon =
        item.type === 'directory' ? '📁' : this.getFileIcon(item.name);
      const name = item.type === 'directory' ? `${item.name}/` : item.name;
      return `${icon} ${name}`;
    };

    // Combine directories first, then files
    const allItems = [...directories, ...files];

    // Format in columns (3 items per row for better readability)
    const itemsPerRow = 3;
    const rows: string[] = [];

    for (let i = 0; i < allItems.length; i += itemsPerRow) {
      const rowItems = allItems.slice(i, i + itemsPerRow);
      const formattedRow = rowItems
        .map((item) => formatItem(item).padEnd(20))
        .join('');
      rows.push(formattedRow);
    }

    return rows.join('\n');
  }

  /**
   * Get appropriate icon for file type
   */
  private getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();

    const iconMap: { [key: string]: string } = {
      md: '📄',
      txt: '📄',
      json: '📋',
      yaml: '📋',
      yml: '📋',
      sh: '⚡',
      js: '📜',
      ts: '📜',
      py: '🐍',
      link: '🔗',
      timeline: '📅',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      gif: '🖼️',
      svg: '🖼️',
    };

    return iconMap[extension || ''] || '📄';
  }

  /**
   * Add path to navigation history
   */
  private addToHistory(path: string): void {
    // Avoid duplicate consecutive entries
    if (
      this.navigationState.history[this.navigationState.history.length - 1] !==
      path
    ) {
      this.navigationState.history.push(path);

      // Limit history size
      if (this.navigationState.history.length > 50) {
        this.navigationState.history = this.navigationState.history.slice(-50);
      }
    }
  }

  /**
   * Get current path
   */
  getCurrentPath(): string {
    return this.navigationState.currentPath;
  }

  /**
   * Get navigation history
   */
  getHistory(): string[] {
    return [...this.navigationState.history];
  }

  /**
   * Get file system tree for navigation component
   */
  getFileSystemTree(): FileSystemNode | null {
    return this.fileSystem;
  }

  /**
   * Check if path exists
   */
  pathExists(path: string): boolean {
    return this.findNodeByPath(path) !== null;
  }

  /**
   * Get path completions for tab completion
   */
  async getPathCompletions(
    partial: string,
    currentPath?: string
  ): Promise<string[]> {
    if (!this.fileSystem) {
      await this.initializeFileSystem();
    }

    const searchPath = currentPath || this.navigationState.currentPath;

    // Handle different path formats
    let targetPath = searchPath;
    let searchTerm = partial;

    if (partial.includes('/')) {
      const pathParts = partial.split('/');
      searchTerm = pathParts.pop() || '';
      const pathPrefix = pathParts.join('/');

      if (partial.startsWith('~/')) {
        targetPath = pathPrefix || '~';
      } else if (partial.startsWith('/')) {
        targetPath = '~' + pathPrefix;
      } else {
        // Relative path
        if (searchPath === '~') {
          targetPath = pathPrefix ? `~/${pathPrefix}` : '~';
        } else {
          targetPath = pathPrefix ? `${searchPath}/${pathPrefix}` : searchPath;
        }
      }
    }

    // Get contents of target directory
    const targetNode = this.findNodeByPath(targetPath);
    if (!targetNode || targetNode.type !== 'directory') {
      return [];
    }

    const contents = targetNode.children || [];

    // Filter by search term and format results
    const matches = contents
      .filter((item) => item.name.startsWith(searchTerm))
      .map((item) => {
        // Add trailing slash for directories
        return item.type === 'directory' ? `${item.name}/` : item.name;
      })
      .sort((a, b) => {
        // Sort directories first, then files
        const aIsDir = a.endsWith('/');
        const bIsDir = b.endsWith('/');
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
      });

    return matches;
  }

  /**
   * Get file node by path
   */
  async getFileNode(filePath: string): Promise<FileSystemNode | null> {
    if (!this.fileSystem) {
      await this.initializeFileSystem();
    }
    return this.findNodeByPath(filePath);
  }

  /**
   * Reset to home directory
   */
  resetToHome(): void {
    this.navigationState.currentPath = '~';
    this.addToHistory('~');
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemService();
