import { describe, it, expect } from "vitest";
import { stackCards, hardware, optimizationNotes } from "../../src/data/about.js";

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

describe("hardware", () => {
  it("is a non-empty tuple array", () => {
    expect(hardware.length).toBeGreaterThan(0);
  });

  it("every entry is a two-element tuple of non-empty strings", () => {
    for (const row of hardware) {
      expect(row).toHaveLength(2);
      expect(row[0].trim().length).toBeGreaterThan(0);
      expect(row[1].trim().length).toBeGreaterThan(0);
    }
  });

  it("includes Machine and Operating System entries", () => {
    const labels = hardware.map(([label]) => label);
    expect(labels).toContain("Machine");
    expect(labels).toContain("Operating System");
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
