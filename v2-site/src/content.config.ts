import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import * as z from "zod/v4";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    role: z.string(),
    repository: z.url(),
    repositoryLabel: z.string(),
    canonicalPath: z.string(),
    tags: z.array(z.string()),
    order: z.number(),
    featured: z.boolean().default(false),
    liveUrl: z.url().optional()
  })
});

export const collections = { projects };