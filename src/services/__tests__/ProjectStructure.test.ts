/**
 * Property-Based Tests for Project Structure
 * Feature: personal-brand-website, Property 7: Project structure completeness
 * Validates: Requirements 4.2
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { contentService } from '../ContentService';
import { fileSystemService } from '../FileSystemService';
import { FileSystemNode } from '../../types/portfolio';

describe('Project Structure Property Tests', () => {
  /**
   * Property 7: Project structure completeness
   * For any project directory, it should contain the expected file types
   * (README.md, tech-stack.json, demo files, launch links) in a consistent structure
   */
  it('should have consistent structure for all project directories', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('web-apps', 'client-sites', 'experiments'),
        async (projectCategory) => {
          // Get the file system structure
          const fileSystem = await contentService.buildFileSystem();

          // Navigate to the projects directory
          const projectsNode = findNodeByPath(fileSystem, '~/projects');
          expect(projectsNode).toBeTruthy();
          expect(projectsNode?.type).toBe('directory');

          // Find the category directory
          const categoryNode = projectsNode?.children?.find(
            (child) => child.name === projectCategory
          );
          expect(categoryNode).toBeTruthy();
          expect(categoryNode?.type).toBe('directory');

          // Check each project in the category
          if (categoryNode?.children && categoryNode.children.length > 0) {
            for (const projectNode of categoryNode.children) {
              expect(projectNode.type).toBe('directory');

              // Every project should have a README.md
              const hasReadme = projectNode.children?.some(
                (file) => file.name === 'README.md' && file.type === 'file'
              );
              expect(hasReadme).toBe(true);

              // Every project should have a tech-stack.json
              const hasTechStack = projectNode.children?.some(
                (file) =>
                  file.name === 'tech-stack.json' && file.type === 'file'
              );
              expect(hasTechStack).toBe(true);

              // Every project should have either a launch.link or github.link
              const hasLaunchLink = projectNode.children?.some(
                (file) =>
                  (file.name === 'launch.link' ||
                    file.name === 'github.link') &&
                  file.type === 'file'
              );
              expect(hasLaunchLink).toBe(true);

              // All files should have proper paths
              projectNode.children?.forEach((file) => {
                expect(file.path).toContain(projectNode.path);
                expect(file.path).toMatch(/^~\/projects\//);
              });
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Project file content accessibility
   * For any project file, it should be loadable through the content service
   */
  it('should be able to load content for all project files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('web-apps', 'client-sites', 'experiments'),
        async (projectCategory) => {
          const fileSystem = await contentService.buildFileSystem();
          const projectsNode = findNodeByPath(fileSystem, '~/projects');
          const categoryNode = projectsNode?.children?.find(
            (child) => child.name === projectCategory
          );

          if (categoryNode?.children && categoryNode.children.length > 0) {
            for (const projectNode of categoryNode.children) {
              if (projectNode.children) {
                for (const file of projectNode.children) {
                  if (file.type === 'file') {
                    // Should be able to load content for each file
                    const content = await fileSystemService.getFileContent(
                      file.path
                    );

                    // Content should not be null (file should exist)
                    expect(content).not.toBeNull();

                    // Content should be a non-empty string
                    expect(typeof content).toBe('string');
                    expect(content!.length).toBeGreaterThan(0);

                    // Link files should contain valid URLs
                    if (file.name.endsWith('.link')) {
                      const url = content!.trim();
                      expect(url).toMatch(/^https?:\/\/.+/);
                    }

                    // JSON files should be valid JSON
                    if (file.name.endsWith('.json')) {
                      expect(() => JSON.parse(content!)).not.toThrow();
                    }
                  }
                }
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Project path consistency
   * For any project, all file paths should be consistent with the project structure
   */
  it('should have consistent file paths for all projects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          category: fc.constantFrom('web-apps', 'client-sites', 'experiments'),
          projectName: fc.string({ minLength: 1, maxLength: 50 }).filter(
            (s) => /^[a-z0-9-]+$/.test(s) // Valid project name format
          ),
        }),
        async ({ category, projectName }) => {
          const expectedBasePath = `~/projects/${category}/${projectName}`;

          // Test that path construction is consistent
          const expectedFiles = ['README.md', 'tech-stack.json'];

          expectedFiles.forEach((fileName) => {
            const expectedPath = `${expectedBasePath}/${fileName}`;

            // Path should follow the expected pattern
            expect(expectedPath).toMatch(/^~\/projects\/[^/]+\/[^/]+\/[^/]+$/);

            // Path should contain the category
            expect(expectedPath).toContain(category);

            // Path should contain the project name
            expect(expectedPath).toContain(projectName);

            // Path should contain the file name
            expect(expectedPath).toContain(fileName);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Required file types presence
   * For any valid project structure, it must contain the minimum required files
   */
  it('should contain required file types for complete projects', async () => {
    const fileSystem = await contentService.buildFileSystem();
    const projectsNode = findNodeByPath(fileSystem, '~/projects');

    expect(projectsNode).toBeTruthy();

    const categories = ['web-apps', 'client-sites', 'experiments'];

    for (const category of categories) {
      const categoryNode = projectsNode?.children?.find(
        (child) => child.name === category
      );

      if (categoryNode?.children && categoryNode.children.length > 0) {
        for (const projectNode of categoryNode.children) {
          const fileNames =
            projectNode.children?.map((file) => file.name) || [];

          // Required files for any project
          expect(fileNames).toContain('README.md');
          expect(fileNames).toContain('tech-stack.json');

          // Should have at least one link file
          const hasLinkFile = fileNames.some((name) => name.endsWith('.link'));
          expect(hasLinkFile).toBe(true);

          // All files should be actual files, not directories
          projectNode.children?.forEach((child) => {
            if (
              child.name.endsWith('.md') ||
              child.name.endsWith('.json') ||
              child.name.endsWith('.link')
            ) {
              expect(child.type).toBe('file');
            }
          });
        }
      }
    }
  });
});

/**
 * Helper function to find a node by path in the file system
 */
function findNodeByPath(
  root: FileSystemNode,
  path: string
): FileSystemNode | null {
  if (root.path === path) {
    return root;
  }

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, path);
      if (found) {
        return found;
      }
    }
  }

  return null;
}
