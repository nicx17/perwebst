/**
 * Unit tests for the content collection schema.
 * Validates that the Zod schema used in content.config.ts accepts
 * valid project entries and rejects malformed ones.
 */
import { describe, it, expect } from "vitest";
import * as z from "zod/v4";

const HTTPS_URL = z.url().refine((value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "must be an https URL");

const PROJECT_CANONICAL_PATH = z
  .string()
  .regex(/^\/projects\/[a-z0-9-]+\/$/i, "must match /projects/<slug>/");

// Replicate the schema from src/content.config.ts
const projectSchema = z.object({
  title: z.string(),
  summary: z.string(),
  icon: z.string().optional(),
  repository: HTTPS_URL,
  repositoryLabel: z.string(),
  canonicalPath: PROJECT_CANONICAL_PATH,
  tags: z.array(z.string()),
  order: z.number(),
  featured: z.boolean().default(false),
  liveUrl: HTTPS_URL.optional(),
});

type Project = z.infer<typeof projectSchema>;

const validProject: Project = {
  title: "TestProject",
  summary: "A test project.",
  repository: "https://github.com/nicx17/test",
  repositoryLabel: "nicx17/test",
  canonicalPath: "/projects/test/",
  tags: ["TypeScript", "Node"],
  order: 1,
  featured: false,
};

describe("project content schema", () => {
  it("accepts a fully valid project entry", () => {
    expect(() => projectSchema.parse(validProject)).not.toThrow();
  });

  it("icon is optional — parses without it", () => {
    const { icon, ...withoutIcon } = validProject as any;
    expect(() => projectSchema.parse(withoutIcon)).not.toThrow();
  });

  it("liveUrl is optional — parses without it", () => {
    const { liveUrl, ...withoutLive } = validProject as any;
    expect(() => projectSchema.parse(withoutLive)).not.toThrow();
  });

  it("accepts a valid liveUrl URL", () => {
    const withLive = { ...validProject, liveUrl: "https://example.com" };
    expect(() => projectSchema.parse(withLive)).not.toThrow();
  });

  it("rejects an invalid repository URL (not a URL)", () => {
    const bad = { ...validProject, repository: "not-a-url" };
    expect(() => projectSchema.parse(bad)).toThrow();
  });

  it("rejects non-https repository URLs", () => {
    const bad = { ...validProject, repository: "javascript:alert(1)" };
    expect(() => projectSchema.parse(bad)).toThrow();
  });

  it("rejects a missing title", () => {
    const { title, ...noTitle } = validProject as any;
    expect(() => projectSchema.parse(noTitle)).toThrow();
  });

  it("rejects a missing summary", () => {
    const { summary, ...noSummary } = validProject as any;
    expect(() => projectSchema.parse(noSummary)).toThrow();
  });

  it("rejects a non-array tags field", () => {
    const bad = { ...validProject, tags: "typescript" };
    expect(() => projectSchema.parse(bad)).toThrow();
  });

  it("rejects a non-number order field", () => {
    const bad = { ...validProject, order: "first" };
    expect(() => projectSchema.parse(bad)).toThrow();
  });

  it("featured defaults to false when not provided", () => {
    const { featured, ...noFeatured } = validProject as any;
    const result = projectSchema.parse(noFeatured);
    expect(result.featured).toBe(false);
  });

  it("accepts featured: true", () => {
    const result = projectSchema.parse({ ...validProject, featured: true });
    expect(result.featured).toBe(true);
  });

  it("rejects an invalid liveUrl", () => {
    const bad = { ...validProject, liveUrl: "not-a-url" };
    expect(() => projectSchema.parse(bad)).toThrow();
  });

  it("rejects non-https liveUrl values", () => {
    const bad = { ...validProject, liveUrl: "data:text/plain,hello" };
    expect(() => projectSchema.parse(bad)).toThrow();
  });

  it("tags array can be empty", () => {
    const result = projectSchema.parse({ ...validProject, tags: [] });
    expect(result.tags).toEqual([]);
  });

  it("canonicalPath must be a project route string", () => {
    const bad = { ...validProject, canonicalPath: 42 };
    expect(() => projectSchema.parse(bad)).toThrow();
  });

  it("rejects canonicalPath values outside /projects/<slug>/", () => {
    const bad = { ...validProject, canonicalPath: "https://example.com" };
    expect(() => projectSchema.parse(bad)).toThrow();
  });
});
