import { describe, expect, it } from "vitest";

import { parseCommand } from "../src/commands";
import { applyCommand } from "../src/reducer";
import { solve } from "../src/solve";
import { createDemoScene } from "../src/app/demo-scene";

describe("v0.1 browser flow", () => {
  it("changes the visual experiment through the command path", () => {
    const initialScene = createDemoScene();
    const initialEvent = solve(initialScene).rays[0]?.events[0];

    const command = parseCommand({
      op: "setRayAngle",
      target: "ray-1",
      degrees: 20,
    });
    const nextScene = applyCommand(initialScene, command);
    const nextEvent = solve(nextScene).rays[0]?.events[0];

    expect(initialEvent?.kind).toBe("refract");
    expect(nextEvent?.kind).toBe("refract");

    if (nextEvent?.kind !== "refract") {
      throw new Error("Expected a refracted ray after the UI-style command.");
    }

    expect(nextEvent.thetaIncidentDeg).toBeCloseTo(20, 10);
    expect(nextEvent.id).toBe("ray-1:event:0");
    expect(initialScene.rays[0]?.direction).not.toEqual(
      nextScene.rays[0]?.direction,
    );
  });

  it("changes material through the same reducer used by the future Genie", () => {
    const initialScene = createDemoScene();
    const nextScene = applyCommand(
      initialScene,
      parseCommand({
        op: "setSurfaceMaterial",
        target: "surface-1",
        side: "b",
        material: "diamond",
      }),
    );

    const event = solve(nextScene).rays[0]?.events[0];

    expect(event?.kind).toBe("refract");

    if (event?.kind !== "refract") {
      throw new Error("Expected a refraction event.");
    }

    expect(event.toMaterial).toBe("diamond");
    expect(event.n2).toBeCloseTo(2.417, 10);
  });
});
