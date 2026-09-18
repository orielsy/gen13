import { createDefaultMaterials } from "../src/materials";
import type { Scene } from "../src/scene";

function direction(degrees: number): { x: number; y: number } {
  const radians = (degrees * Math.PI) / 180;
  return { x: Math.cos(radians), y: Math.sin(radians) };
}

export function airToBk7Scene(angleDeg = 45): Scene {
  return {
    version: 1,
    units: "m",
    materials: createDefaultMaterials(),
    rays: [
      {
        id: "ray-1",
        origin: { x: -1, y: 0 },
        direction: direction(angleDeg),
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

export function bk7ToAirScene(angleDeg = 45): Scene {
  const radians = (angleDeg * Math.PI) / 180;

  return {
    version: 1,
    units: "m",
    materials: createDefaultMaterials(),
    rays: [
      {
        id: "ray-1",
        origin: { x: 1, y: 0 },
        direction: { x: -Math.cos(radians), y: Math.sin(radians) },
        medium: "bk7",
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
