import { describe, it, expect } from "vitest";
import { homeLinks, type HomeLink } from "../../src/data/links.js";

describe("homeLinks data", () => {
  it("exports a non-empty array", () => {
    expect(homeLinks.length).toBeGreaterThan(0);
  });

  it("every entry has a non-empty label and href", () => {
    for (const link of homeLinks) {
      expect(link.label.trim().length).toBeGreaterThan(0);
      expect(link.href.trim().length).toBeGreaterThan(0);
    }
  });

  it("internal links start with /", () => {
    const internal = homeLinks.filter((l) => !l.external);
    for (const link of internal) {
      expect(link.href).toMatch(/^\//);
    }
  });

  it("external links start with https://", () => {
    const external = homeLinks.filter((l) => l.external === true);
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link.href).toMatch(/^https:\/\//);
    }
  });

  it("Projects link is internal and points to /projects/", () => {
    const projects = homeLinks.find((l) => l.label === "Projects");
    expect(projects).toBeDefined();
    expect(projects?.external).toBeFalsy();
    expect(projects?.href).toBe("/projects/");
  });

  it("GitHub link is external and points to nicx17", () => {
    const github = homeLinks.find((l) => l.label === "GitHub");
    expect(github).toBeDefined();
    expect(github?.external).toBe(true);
    expect(github?.href).toContain("nicx17");
  });

  it("HomeLink interface shape is satisfied by all entries", () => {
    const check = (l: HomeLink) => typeof l.label === "string" && typeof l.href === "string";
    expect(homeLinks.every(check)).toBe(true);
  });
});
