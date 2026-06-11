import { describe, it, expect } from "vitest";
import { stackCards, pipeline, optimizationNotes } from "../../src/data/about.js";

describe("stackCards", () => {
  it("is a non-empty array", () => {
    expect(stackCards.length).toBeGreaterThan(0);
  });

  it("every card has a non-empty title and body", () => {
    for (const card of stackCards) {
      expect(card.title.trim().length).toBeGreaterThan(0);
      expect(card.body.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("pipeline", () => {
  it("is a non-empty tuple array", () => {
    expect(pipeline.length).toBeGreaterThan(0);
  });

  it("every entry is a two-element tuple of non-empty strings", () => {
    for (const row of pipeline) {
      expect(row).toHaveLength(2);
      expect(row[0].trim().length).toBeGreaterThan(0);
      expect(row[1].trim().length).toBeGreaterThan(0);
    }
  });

  it("includes Source Control and Deploy Target entries", () => {
    const labels = pipeline.map(([label]) => label);
    expect(labels).toContain("Source Control");
    expect(labels).toContain("Deploy Target");
  });
});

describe("optimizationNotes", () => {
  it("is a non-empty tuple array", () => {
    expect(optimizationNotes.length).toBeGreaterThan(0);
  });

  it("every entry is a two-element tuple of non-empty strings", () => {
    for (const row of optimizationNotes) {
      expect(row).toHaveLength(2);
      expect(row[0].trim().length).toBeGreaterThan(0);
      expect(row[1].trim().length).toBeGreaterThan(0);
    }
  });

  it("includes a Rendering and Security entry", () => {
    const labels = optimizationNotes.map(([label]) => label);
    expect(labels).toContain("Rendering");
    expect(labels).toContain("Security");
  });
});
