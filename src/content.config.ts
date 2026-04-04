import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
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

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    icon: z.string().optional(),
    repository: HTTPS_URL,
    repositoryLabel: z.string(),
    canonicalPath: PROJECT_CANONICAL_PATH,
    tags: z.array(z.string()),
    order: z.number(),
    featured: z.boolean().default(false),
    liveUrl: HTTPS_URL.optional()
  })
});

export const collections = { projects };