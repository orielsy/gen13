import { describe, expect, it } from "vitest";

import { parseCommand } from "../src/commands";
import { applyCommand, CommandDomainError } from "../src/reducer";
import { airToBk7Scene } from "./fixtures";

describe("command reducer", () => {
  it("changes a surface material immutably", () => {
    const scene = airToBk7Scene();

    const next = applyCommand(scene, {
      op: "setSurfaceMaterial",
      target: "surface-1",
      side: "b",
      material: "diamond",
    });

    expect(next).not.toBe(scene);
    expect(scene.surfaces[0]?.materialB).toBe("bk7");
    expect(next.surfaces[0]?.materialB).toBe("diamond");
  });

  it("changes material IOR immutably", () => {
    const scene = airToBk7Scene();

    const next = applyCommand(scene, {
      op: "setMaterialIor",
      target: "bk7",
      value: 1.7,
    });

    expect(scene.materials.bk7?.ior.value).toBe(1.5168);
    expect(next.materials.bk7?.ior.value).toBe(1.7);
  });

  it("turns a ray through the command path", () => {
    const scene = airToBk7Scene();

    const next = applyCommand(scene, {
      op: "setRayAngle",
      target: "ray-1",
      degrees: 30,
    });

    expect(next.rays[0]?.direction.x).toBeCloseTo(Math.cos(Math.PI / 6));
    expect(next.rays[0]?.direction.y).toBeCloseTo(Math.sin(Math.PI / 6));
  });

  it("rejects domain references that do not exist", () => {
    const scene = airToBk7Scene();

    expect(() =>
      applyCommand(scene, {
        op: "setSurfaceMaterial",
        target: "surface-missing",
        side: "b",
        material: "diamond",
      }),
    ).toThrow(CommandDomainError);
  });

  it("rejects structurally valid-looking commands with impossible v0.0 IOR values", () => {
    expect(() =>
      parseCommand({
        op: "setMaterialIor",
        target: "bk7",
        value: 0.5,
      }),
    ).toThrow();
  });
});
