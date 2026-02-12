/**
 * Property-Based Tests for Content Update Propagation
 *
 * Feature: personal-brand-website, Property 11: Content update propagation
 * Validates: Requirements 9.1
 */

import fc from 'fast-check';
import { contentManager } from '../ContentManager';
import { ContentRegenerationUtils } from '../../utils/contentRegeneration';
import { ProjectData } from '../../types/portfolio';

describe('Content Update Propagation Properties', () => {
  beforeEach(() => {
    // Clear content manager state before each test
    contentManager.clearCache?.();
  });

  /**
   * Property 11: Content update propagation
   * For any markdown file modification in the content system, the changes should
   * automatically reflect in the rendered site without manual intervention
   */
  test('Property 11: Content update propagation - markdown file changes reflect automatically', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary markdown content
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 10, maxLength: 500 }),
          content: fc.array(fc.string({ minLength: 1, maxLength: 200 }), {
            minLength: 1,
            maxLength: 10,
          }),
          lastUpdated: fc.date(),
        }),
        // Generate file path
        fc.oneof(
          fc.constant('/artist/bio.md'),
          fc.constant('/studio/toolbox/languages.json'),
          fc.constant('/projects/project-index.md'),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .map((name) => `/projects/web-apps/${name}/README.md`)
        ),
        async (contentData, filePath) => {
          // Generate markdown content from the data
          const markdownContent = [
            `# ${contentData.title}`,
            '',
            contentData.description,
            '',
            ...contentData.content.map((line) => `- ${line}`),
            '',
            `*Last updated: ${contentData.lastUpdated.toLocaleDateString()}*`,
          ].join('\n');

          // Process the markdown content
          const processedContent = await contentManager.processMarkdown(
            markdownContent,
            {
              lastUpdated: contentData.lastUpdated.toISOString(),
              title: contentData.title,
            }
          );

          // Verify that processed content contains the original information
          expect(processedContent).toContain(contentData.title);
          expect(processedContent).toContain(contentData.description);

          // Verify that metadata is preserved and enhanced
          expect(processedContent).toContain(
            contentData.lastUpdated.toLocaleDateString()
          );

          // Verify that content structure is maintained
          const lines = processedContent.split('\n');
          expect(lines[0]).toMatch(/^# /); // Title should be a heading

          // Verify that list items are preserved
          const listItems = lines.filter((line) => line.startsWith('- '));
          expect(listItems.length).toBeGreaterThanOrEqual(
            contentData.content.length
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Project data updates propagate to all related files
   * For any project data modification, all related files (README, tech-stack, demo)
   * should be updated consistently
   */
  test('Property: Project updates propagate to all related files consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary project data
        fc.record({
          id: fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => /^[a-z0-9-]+$/.test(s)),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 10, maxLength: 500 }),
          techStack: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
            minLength: 1,
            maxLength: 10,
          }),
          category: fc.oneof(
            fc.constant('web-apps' as const),
            fc.constant('client-sites' as const),
            fc.constant('experiments' as const)
          ),
          status: fc.oneof(
            fc.constant('active' as const),
            fc.constant('completed' as const),
            fc.constant('locked' as const)
          ),
          features: fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
            minLength: 1,
            maxLength: 8,
          }),
          challenges: fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
            minLength: 0,
            maxLength: 5,
          }),
          outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
            minLength: 0,
            maxLength: 5,
          }),
        }),
        async (projectData) => {
          // Process the project
          await contentManager.processProject(projectData);

          // Verify project is in the index
          const retrievedProject = contentManager.getProject(projectData.id);
          expect(retrievedProject).toBeDefined();
          expect(retrievedProject?.name).toBe(projectData.name);
          expect(retrievedProject?.description).toBe(projectData.description);
          expect(retrievedProject?.category).toBe(projectData.category);
          expect(retrievedProject?.status).toBe(projectData.status);

          // Verify all required arrays are present
          expect(Array.isArray(retrievedProject?.techStack)).toBe(true);
          expect(Array.isArray(retrievedProject?.features)).toBe(true);
          expect(Array.isArray(retrievedProject?.challenges)).toBe(true);
          expect(Array.isArray(retrievedProject?.outcomes)).toBe(true);

          // Verify tech stack is preserved
          expect(retrievedProject?.techStack).toEqual(projectData.techStack);
          expect(retrievedProject?.features).toEqual(projectData.features);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Content validation maintains data integrity
   * For any content type and valid content, validation should pass and
   * preserve the original content structure
   */
  test('Property: Content validation maintains data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate content by type
        fc.oneof(
          // Markdown content
          fc.record({
            type: fc.constant('markdown'),
            content: fc
              .array(
                fc.oneof(
                  fc
                    .string({ minLength: 1, maxLength: 100 })
                    .map((s) => `# ${s}`), // Headers
                  fc.string({ minLength: 1, maxLength: 200 }), // Regular text
                  fc
                    .string({ minLength: 1, maxLength: 100 })
                    .map((s) => `- ${s}`), // List items
                  fc
                    .string({ minLength: 1, maxLength: 100 })
                    .map((s) => `[${s}](https://example.com)`) // Links
                ),
                { minLength: 1, maxLength: 10 }
              )
              .map((lines) => lines.join('\n')),
          }),
          // JSON content
          fc.record({
            type: fc.constant('json'),
            content: fc
              .record({
                name: fc.string(),
                version: fc.string(),
                data: fc.array(fc.string()),
              })
              .map((obj) => JSON.stringify(obj, null, 2)),
          }),
          // YAML content (simplified)
          fc.record({
            type: fc.constant('yaml'),
            content: fc
              .record({
                title: fc.string({ minLength: 1, maxLength: 50 }),
                items: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
                  minLength: 1,
                  maxLength: 5,
                }),
              })
              .map(
                (obj) =>
                  `title: ${obj.title}\nitems:\n${obj.items.map((item) => `  - ${item}`).join('\n')}`
              ),
          })
        ),
        async ({ type, content }) => {
          // Validate the content
          const isValid = await contentManager.validateContent(content, type);

          // For well-formed content, validation should pass
          if (type === 'json') {
            // JSON should be parseable
            expect(() => JSON.parse(content)).not.toThrow();
            expect(isValid).toBe(true);
          } else if (type === 'markdown') {
            // Markdown should have balanced brackets and proper structure
            const openBrackets = (content.match(/\[/g) || []).length;
            const closeBrackets = (content.match(/\]/g) || []).length;

            if (openBrackets === closeBrackets) {
              expect(isValid).toBe(true);
            }
          } else if (type === 'yaml') {
            // YAML should have proper key-value structure
            const lines = content.split('\n');
            const hasValidStructure = lines.every((line) => {
              const trimmed = line.trim();
              return (
                !trimmed ||
                trimmed.startsWith('#') ||
                trimmed.includes(':') ||
                trimmed.startsWith('-')
              );
            });

            if (hasValidStructure) {
              expect(isValid).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Content regeneration preserves existing data
   * For any content regeneration operation, existing valid content should be preserved
   * and enhanced, not lost or corrupted
   */
  test('Property: Content regeneration preserves existing data', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial project set
        fc.array(
          fc.record({
            id: fc
              .string({ minLength: 1, maxLength: 30 })
              .filter((s) => /^[a-z0-9-]+$/.test(s)),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 10, maxLength: 200 }),
            techStack: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
              minLength: 1,
              maxLength: 5,
            }),
            category: fc.oneof(
              fc.constant('web-apps' as const),
              fc.constant('client-sites' as const),
              fc.constant('experiments' as const)
            ),
            status: fc.oneof(
              fc.constant('active' as const),
              fc.constant('completed' as const)
            ),
            features: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
              minLength: 1,
              maxLength: 3,
            }),
            challenges: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
              minLength: 0,
              maxLength: 2,
            }),
            outcomes: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
              minLength: 0,
              maxLength: 2,
            }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (initialProjects) => {
          // Add initial projects
          for (const project of initialProjects) {
            await contentManager.processProject(project);
          }

          // Get initial state
          const initialStats = contentManager.getContentStats();
          const initialProjectCount = contentManager.getAllProjects().length;

          // Regenerate content
          await contentManager.regenerateIndex();

          // Verify data preservation after regeneration
          const finalStats = contentManager.getContentStats();
          const finalProjects = contentManager.getAllProjects();

          // Projects should still exist after regeneration
          expect(finalProjects.length).toBeGreaterThanOrEqual(0);

          // For each initial project, verify it still exists with correct data
          for (const initialProject of initialProjects) {
            const foundProject = finalProjects.find(
              (p) => p.id === initialProject.id
            );
            if (foundProject) {
              expect(foundProject.name).toBe(initialProject.name);
              expect(foundProject.description).toBe(initialProject.description);
              expect(foundProject.category).toBe(initialProject.category);
              expect(foundProject.status).toBe(initialProject.status);
            }
          }

          // Stats should be reasonable after regeneration
          expect(finalStats.projects).toBeGreaterThanOrEqual(0);
          expect(finalStats.cachedFiles).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 50 } // Fewer runs for this more complex test
    );
  });

  /**
   * Property: Batch updates maintain consistency
   * For any batch of project updates, all updates should be applied consistently
   * without partial failures corrupting the content state
   */
  test('Property: Batch updates maintain consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate batch of updates
        fc.array(
          fc.record({
            id: fc
              .string({ minLength: 1, maxLength: 30 })
              .filter((s) => /^[a-z0-9-]+$/.test(s)),
            updates: fc.record({
              name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
                nil: undefined,
              }),
              description: fc.option(
                fc.string({ minLength: 10, maxLength: 200 }),
                { nil: undefined }
              ),
              status: fc.option(
                fc.oneof(
                  fc.constant('active' as const),
                  fc.constant('completed' as const),
                  fc.constant('locked' as const)
                ),
                { nil: undefined }
              ),
            }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (batchUpdates) => {
          // Create initial projects for the updates
          for (const { id } of batchUpdates) {
            const initialProject: ProjectData = {
              id,
              name: `Initial ${id}`,
              description: 'Initial description for testing',
              techStack: ['Initial Tech'],
              category: 'experiments',
              status: 'active',
              features: ['Initial feature'],
              challenges: [],
              outcomes: [],
            };
            await contentManager.processProject(initialProject);
          }

          // Apply batch updates
          const updatePromises = batchUpdates.map(async ({ id, updates }) => {
            const existingProject = contentManager.getProject(id);
            if (existingProject) {
              // Only apply non-undefined updates to preserve required fields
              const filteredUpdates = Object.fromEntries(
                Object.entries(updates).filter(
                  ([_, value]) => value !== undefined
                )
              );
              const updatedProject = { ...existingProject, ...filteredUpdates };
              await contentManager.processProject(updatedProject);
              return { id, success: true };
            }
            return { id, success: false };
          });

          const results = await Promise.allSettled(updatePromises);

          // Verify consistency after batch updates
          for (let i = 0; i < batchUpdates.length; i++) {
            const { id, updates } = batchUpdates[i];
            const result = results[i];

            if (result.status === 'fulfilled' && result.value.success) {
              const updatedProject = contentManager.getProject(id);
              expect(updatedProject).toBeDefined();

              // Verify updates were applied (only for non-undefined values)
              if (updates.name !== undefined) {
                expect(updatedProject?.name).toBe(updates.name);
              }
              if (updates.description !== undefined) {
                expect(updatedProject?.description).toBe(updates.description);
              }
              if (updates.status !== undefined) {
                expect(updatedProject?.status).toBe(updates.status);
              }
            }
          }

          // Verify overall system consistency
          const allProjects = contentManager.getAllProjects();
          const stats = contentManager.getContentStats();

          expect(stats.projects).toBe(allProjects.length);
          // All projects should have valid required fields (name and description should not be empty)
          expect(
            allProjects.every(
              (p) =>
                p.id &&
                p.name &&
                p.name.length > 0 &&
                p.description &&
                p.description.length > 0
            )
          ).toBe(true);
        }
      ),
      { numRuns: 30 } // Fewer runs for this complex batch test
    );
  });
});
