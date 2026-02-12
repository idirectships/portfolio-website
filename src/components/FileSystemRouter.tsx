'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileSystemNode } from '../types/portfolio';
import { fileSystemService } from '../services/FileSystemService';

interface FileSystemRouterProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

interface FileTreeNodeProps {
  node: FileSystemNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  level: number;
  isExpanded: boolean;
  onToggleExpand: (path: string) => void;
}

function FileTreeNode({
  node,
  currentPath,
  onNavigate,
  level,
  isExpanded,
  onToggleExpand,
}: FileTreeNodeProps) {
  const isCurrentPath = currentPath === node.path;
  const hasChildren = node.children && node.children.length > 0;
  const isDirectory = node.type === 'directory';

  const handleClick = useCallback(() => {
    if (isDirectory) {
      if (hasChildren) {
        onToggleExpand(node.path);
      }
      onNavigate(node.path);
    }
  }, [isDirectory, hasChildren, node.path, onNavigate, onToggleExpand]);

  const getIcon = () => {
    if (isDirectory) {
      return hasChildren ? (isExpanded ? '📂' : '📁') : '📁';
    }

    const extension = node.name.split('.').pop()?.toLowerCase();
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
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-terminal-bg/50 transition-colors rounded ${
          isCurrentPath
            ? 'bg-terminal-accent/20 text-terminal-accent'
            : 'text-terminal-fg'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {isDirectory && hasChildren && (
          <span className="mr-1 text-xs text-terminal-fg/60">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        <span className="mr-2">{getIcon()}</span>
        <span className="text-sm font-mono truncate">
          {node.name}
          {isDirectory && '/'}
        </span>
      </div>

      {isDirectory && hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              currentPath={currentPath}
              onNavigate={onNavigate}
              level={level + 1}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileSystemRouter({
  currentPath,
  onNavigate,
  className = '',
}: FileSystemRouterProps) {
  const [fileSystem, setFileSystem] = useState<FileSystemNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(['~'])
  );
  const [isLoading, setIsLoading] = useState(true);

  // Initialize file system
  useEffect(() => {
    const initializeFileSystem = async () => {
      try {
        setIsLoading(true);
        const tree = fileSystemService.getFileSystemTree();
        if (tree) {
          setFileSystem(tree);
        } else {
          // Wait a bit and try again if file system isn't ready
          setTimeout(async () => {
            const retryTree = fileSystemService.getFileSystemTree();
            setFileSystem(retryTree);
          }, 100);
        }
      } catch (error) {
        console.error('Failed to initialize file system:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeFileSystem();
  }, []);

  // Auto-expand path to current directory
  useEffect(() => {
    if (currentPath && currentPath !== '~') {
      const pathParts = currentPath.split('/').filter((p) => p && p !== '~');
      const newExpanded = new Set(expandedPaths);

      let buildPath = '~';
      newExpanded.add(buildPath);

      for (const part of pathParts) {
        buildPath = buildPath === '~' ? `~/${part}` : `${buildPath}/${part}`;
        newExpanded.add(buildPath);
      }

      setExpandedPaths(newExpanded);
    }
  }, [currentPath]);

  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      onNavigate(path);
    },
    [onNavigate]
  );

  if (isLoading) {
    return (
      <div className={`${className} p-4`}>
        <div className="text-terminal-fg/60 text-sm font-mono">
          Loading file system...
        </div>
      </div>
    );
  }

  if (!fileSystem) {
    return (
      <div className={`${className} p-4`}>
        <div className="text-terminal-error text-sm font-mono">
          Failed to load file system
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${className} bg-terminal-bg/30 border border-terminal-border rounded-lg`}
    >
      <div className="p-3 border-b border-terminal-border">
        <h3 className="text-sm font-mono text-terminal-accent font-medium">
          File System
        </h3>
        <div className="text-xs text-terminal-fg/60 font-mono mt-1">
          Current: {currentPath}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        <FileTreeNode
          node={fileSystem}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          level={0}
          isExpanded={expandedPaths.has(fileSystem.path)}
          onToggleExpand={handleToggleExpand}
        />
      </div>

      <div className="p-2 border-t border-terminal-border text-xs text-terminal-fg/50 font-mono">
        Click directories to navigate • Click arrows to expand/collapse
      </div>
    </div>
  );
}
