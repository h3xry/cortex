import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

let tmpDir: string;

vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return { ...actual, default: { ...actual.default, homedir: () => tmpDir } };
});

describe("group-store", () => {
  let store: typeof import("../src/services/group-store.js");

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "group-store-test-"));
    vi.resetModules();
    store = await import("../src/services/group-store.js");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("listGroups returns empty array initially", async () => {
    expect(await store.listGroups()).toEqual([]);
  });

  it("createGroup creates group with auto id and order", async () => {
    const g = await store.createGroup({ name: "Work", icon: "🏢", color: "#89b4fa" });
    expect(g.id).toMatch(/^[a-f0-9]{8}$/);
    expect(g.name).toBe("Work");
    expect(g.icon).toBe("🏢");
    expect(g.color).toBe("#89b4fa");
    expect(g.order).toBe(0);
  });

  it("createGroup increments order", async () => {
    const g1 = await store.createGroup({ name: "A", icon: "🅰️", color: "#f00" });
    const g2 = await store.createGroup({ name: "B", icon: "🅱️", color: "#0f0" });
    expect(g1.order).toBe(0);
    expect(g2.order).toBe(1);
  });

  it("listGroups returns sorted by order", async () => {
    await store.createGroup({ name: "B", icon: "🅱️", color: "#0f0" });
    await store.createGroup({ name: "A", icon: "🅰️", color: "#f00" });
    const groups = await store.listGroups();
    expect(groups[0].name).toBe("B");
    expect(groups[1].name).toBe("A");
  });

  it("updateGroup changes fields", async () => {
    const g = await store.createGroup({ name: "Old", icon: "🔵", color: "#00f" });
    const updated = await store.updateGroup(g.id, { name: "New", color: "#f00" });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("New");
    expect(updated!.color).toBe("#f00");
    expect(updated!.icon).toBe("🔵"); // unchanged
  });

  it("updateGroup returns null for unknown id", async () => {
    expect(await store.updateGroup("nope", { name: "x" })).toBeNull();
  });

  it("deleteGroup removes group and re-indexes order", async () => {
    const g1 = await store.createGroup({ name: "A", icon: "🅰️", color: "#f00" });
    const g2 = await store.createGroup({ name: "B", icon: "🅱️", color: "#0f0" });
    const g3 = await store.createGroup({ name: "C", icon: "©️", color: "#00f" });

    expect(await store.deleteGroup(g2.id)).toBe(true);
    const groups = await store.listGroups();
    expect(groups).toHaveLength(2);
    expect(groups[0].order).toBe(0);
    expect(groups[1].order).toBe(1);
  });

  it("deleteGroup returns false for unknown id", async () => {
    expect(await store.deleteGroup("nope")).toBe(false);
  });

  it("reorderGroups changes order", async () => {
    const g1 = await store.createGroup({ name: "A", icon: "🅰️", color: "#f00" });
    const g2 = await store.createGroup({ name: "B", icon: "🅱️", color: "#0f0" });
    const g3 = await store.createGroup({ name: "C", icon: "©️", color: "#00f" });

    await store.reorderGroups([g3.id, g1.id, g2.id]);
    const groups = await store.listGroups();
    expect(groups[0].name).toBe("C");
    expect(groups[1].name).toBe("A");
    expect(groups[2].name).toBe("B");
  });

  it("reorderGroups returns false for invalid ids", async () => {
    expect(await store.reorderGroups(["invalid"])).toBe(false);
  });

  it("getGroup returns group by id", async () => {
    const g = await store.createGroup({ name: "Test", icon: "🧪", color: "#fff" });
    const found = await store.getGroup(g.id);
    expect(found).not.toBeUndefined();
    expect(found!.name).toBe("Test");
  });

  it("getGroup returns undefined for unknown id", async () => {
    expect(await store.getGroup("nope")).toBeUndefined();
  });
});
