import { describe, expect, it } from "vitest";
import { getTopbarPersistKey } from "../../src/utils/layout-shell";
import { isActiveRoute } from "../../src/utils/nav-state";

describe("getTopbarPersistKey", () => {
  it("uses a dedicated persistence key for shell pages", () => {
    expect(getTopbarPersistKey(true)).toBe("site-topbar-shell");
  });

  it("uses a dedicated persistence key for plain pages", () => {
    expect(getTopbarPersistKey(false)).toBe("site-topbar-plain");
  });

  it("does not reuse the same key across shell variants", () => {
    expect(getTopbarPersistKey(true)).not.toBe(getTopbarPersistKey(false));
  });
});

describe("isActiveRoute", () => {
  it("matches the home route only on the root pathname", () => {
    expect(isActiveRoute("/", "/")).toBe(true);
    expect(isActiveRoute("/", "/projects/")).toBe(false);
  });

  it("matches section routes by prefix", () => {
    expect(isActiveRoute("/projects/", "/projects/")).toBe(true);
    expect(isActiveRoute("/projects/", "/projects/mimick/")).toBe(true);
    expect(isActiveRoute("/about/", "/projects/")).toBe(false);
  });
});
