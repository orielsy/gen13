import { createDefaultMaterials } from "../materials";
import type { Scene } from "../scene";

/**
 * The first visual experiment is intentionally boring geometry:
 * one ray and one flat boundary.
 *
 * Keeping the scene small makes it easy to compare the picture with the exact
 * Trace values and with the analytic optics tests already in the repository.
 */
export function createDemoScene(): Scene {
  const angleRadians = (45 * Math.PI) / 180;

  return {
    version: 1,
    units: "m",
    materials: createDefaultMaterials(),
    rays: [
      {
        id: "ray-1",
        origin: { x: -3, y: 0 },
        direction: {
          x: Math.cos(angleRadians),
          y: Math.sin(angleRadians),
        },
        medium: "air",
        wavelengthNm: 589.3,
      },
    ],
    surfaces: [
      {
        id: "surface-1",
        point: { x: 0, y: 0 },
        normal: { x: 1, y: 0 },
        materialA: "air",
        materialB: "bk7",
      },
    ],
  };
}
