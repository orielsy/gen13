import { describe, expect, it } from "vitest";

import { solve } from "../src/solve";
import { airToBk7Scene, bk7ToAirScene } from "./fixtures";

describe("LIGHT solver", () => {
  it("matches Snell's law for air to BK7 at 45 degrees", () => {
    const scene = airToBk7Scene(45);
    const trace = solve(scene);
    const event = trace.rays[0]?.events[0];

    expect(event?.kind).toBe("refract");

    if (!event || event.kind !== "refract") {
      throw new Error("Expected a refraction event.");
    }

    const expected =
      (Math.asin(
        (event.n1 / event.n2) * Math.sin((45 * Math.PI) / 180),
      ) *
        180) /
      Math.PI;

    expect(event.thetaIncidentDeg).toBeCloseTo(45, 10);
    expect(event.thetaTransmittedDeg).toBeCloseTo(expected, 10);
  });

  it("produces total internal reflection above the critical angle", () => {
    const scene = bk7ToAirScene(45);
    const trace = solve(scene);
    const event = trace.rays[0]?.events[0];

    expect(event?.kind).toBe("tir");

    if (!event || event.kind !== "tir") {
      throw new Error("Expected a total internal reflection event.");
    }

    const expectedCritical =
      (Math.asin(event.n2 / event.n1) * 180) / Math.PI;

    expect(event.thetaIncidentDeg).toBeCloseTo(45, 10);
    expect(event.thetaCriticalDeg).toBeCloseTo(expectedCritical, 10);
    expect(event.thetaIncidentDeg).toBeGreaterThan(event.thetaCriticalDeg);
  });

  it("refracts below the critical angle", () => {
    const event = solve(bk7ToAirScene(30)).rays[0]?.events[0];
    expect(event?.kind).toBe("refract");
  });

  it("drives p-polarized Fresnel reflectance toward zero at Brewster's angle", () => {
    const n1 = 1.000293;
    const n2 = 1.5168;
    const brewsterDeg = (Math.atan(n2 / n1) * 180) / Math.PI;
    const event = solve(airToBk7Scene(brewsterDeg)).rays[0]?.events[0];

    expect(event?.kind).toBe("refract");

    if (!event || event.kind !== "refract") {
      throw new Error("Expected a refraction event.");
    }

    expect(event.fresnel.reflectanceP).toBeLessThan(1e-12);
    expect(event.fresnel.reflectance).toBeGreaterThan(0);
  });

  it("emits stable referent IDs and deterministic output", () => {
    const scene = airToBk7Scene(45);
    const first = solve(scene);
    const second = solve(scene);

    expect(first.rays[0]?.events[0]?.id).toBe("ray-1:event:0");
    expect(second).toEqual(first);
  });
});
