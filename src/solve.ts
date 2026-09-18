import { iorAtWavelength } from "./materials";
import type { Material, RaySource, Scene, Surface2D, Vec2 } from "./scene";
import type {
  FresnelResult,
  RayTrace,
  RefractTraceEvent,
  TirTraceEvent,
  Trace,
} from "./trace";

const EPSILON = 1e-9;

interface SurfaceHit {
  readonly surface: Surface2D;
  readonly at: Vec2;
  readonly distance: number;
  readonly normal: Vec2;
  readonly fromMaterial: Material;
  readonly toMaterial: Material;
}

function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(v: Vec2, factor: number): Vec2 {
  return { x: v.x * factor, y: v.y * factor };
}

function normalize(v: Vec2): Vec2 {
  const length = Math.hypot(v.x, v.y);

  if (!Number.isFinite(length) || length <= EPSILON) {
    throw new Error("Direction and normal vectors must be finite and non-zero.");
  }

  return { x: v.x / length, y: v.y / length };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function materialOrThrow(scene: Scene, id: string): Material {
  const material = scene.materials[id];

  if (!material) {
    throw new Error(`Scene references unknown material: ${id}`);
  }

  return material;
}

function findNearestHit(scene: Scene, ray: RaySource): SurfaceHit | null {
  const direction = normalize(ray.direction);
  let nearest: SurfaceHit | null = null;

  for (const surface of scene.surfaces) {
    const fromA = ray.medium === surface.materialA;
    const fromB = ray.medium === surface.materialB;

    if (!fromA && !fromB) {
      continue;
    }

    const geometricNormal = normalize(surface.normal);
    const denominator = dot(direction, geometricNormal);

    if (Math.abs(denominator) <= EPSILON) {
      continue;
    }

    const distance =
      dot(
        {
          x: surface.point.x - ray.origin.x,
          y: surface.point.y - ray.origin.y,
        },
        geometricNormal,
      ) / denominator;

    if (distance <= EPSILON) {
      continue;
    }

    if (nearest && distance >= nearest.distance) {
      continue;
    }

    const normal = fromA ? scale(geometricNormal, -1) : geometricNormal;
    const cosIncident = -dot(normal, direction);

    if (cosIncident <= EPSILON) {
      throw new Error(
        `Ray ${ray.id} medium assignment is inconsistent with surface ${surface.id} orientation.`,
      );
    }

    nearest = {
      surface,
      at: add(ray.origin, scale(direction, distance)),
      distance,
      normal,
      fromMaterial: materialOrThrow(scene, ray.medium),
      toMaterial: materialOrThrow(
        scene,
        fromA ? surface.materialB : surface.materialA,
      ),
    };
  }

  return nearest;
}

function reflectedDirection(incoming: Vec2, normal: Vec2, cosIncident: number): Vec2 {
  return normalize(add(incoming, scale(normal, 2 * cosIncident)));
}

function fresnel(
  n1: number,
  n2: number,
  cosIncident: number,
  cosTransmitted: number,
): FresnelResult {
  const rsNumerator = n1 * cosIncident - n2 * cosTransmitted;
  const rsDenominator = n1 * cosIncident + n2 * cosTransmitted;
  const rpNumerator = n1 * cosTransmitted - n2 * cosIncident;
  const rpDenominator = n1 * cosTransmitted + n2 * cosIncident;

  const reflectanceS = (rsNumerator / rsDenominator) ** 2;
  const reflectanceP = (rpNumerator / rpDenominator) ** 2;
  const reflectance = (reflectanceS + reflectanceP) / 2;

  return {
    reflectanceS,
    reflectanceP,
    reflectance,
    transmittance: 1 - reflectance,
  };
}

function solveRay(scene: Scene, ray: RaySource): RayTrace {
  const incoming = normalize(ray.direction);
  const hit = findNearestHit(scene, ray);
  const eventId = `${ray.id}:event:0`;

  if (!hit) {
    return {
      rayId: ray.id,
      events: [
        {
          id: eventId,
          rayId: ray.id,
          kind: "escape",
          at: ray.origin,
          reason: "no-surface-hit",
        },
      ],
    };
  }

  const n1 = iorAtWavelength(hit.fromMaterial, ray.wavelengthNm);
  const n2 = iorAtWavelength(hit.toMaterial, ray.wavelengthNm);
  const cosIncident = clamp(-dot(hit.normal, incoming), -1, 1);
  const thetaIncident = Math.acos(cosIncident);
  const eta = n1 / n2;
  const sinTransmittedSquared =
    eta * eta * Math.max(0, 1 - cosIncident * cosIncident);
  const reflected = reflectedDirection(incoming, hit.normal, cosIncident);

  if (sinTransmittedSquared > 1) {
    const criticalAngle =
      n1 > n2 ? Math.asin(clamp(n2 / n1, -1, 1)) : Math.PI / 2;

    const event: TirTraceEvent = {
      id: eventId,
      rayId: ray.id,
      kind: "tir",
      at: hit.at,
      surfaceId: hit.surface.id,
      fromMaterial: hit.fromMaterial.id,
      toMaterial: hit.toMaterial.id,
      wavelengthNm: ray.wavelengthNm,
      n1,
      n2,
      thetaIncidentDeg: toDegrees(thetaIncident),
      thetaCriticalDeg: toDegrees(criticalAngle),
      incomingDirection: incoming,
      reflectedDirection: reflected,
    };

    return { rayId: ray.id, events: [event] };
  }

  const cosTransmitted = Math.sqrt(Math.max(0, 1 - sinTransmittedSquared));
  const transmitted = normalize(
    add(
      scale(incoming, eta),
      scale(hit.normal, eta * cosIncident - cosTransmitted),
    ),
  );

  const event: RefractTraceEvent = {
    id: eventId,
    rayId: ray.id,
    kind: "refract",
    at: hit.at,
    surfaceId: hit.surface.id,
    fromMaterial: hit.fromMaterial.id,
    toMaterial: hit.toMaterial.id,
    wavelengthNm: ray.wavelengthNm,
    n1,
    n2,
    thetaIncidentDeg: toDegrees(thetaIncident),
    thetaTransmittedDeg: toDegrees(Math.asin(Math.sqrt(sinTransmittedSquared))),
    incomingDirection: incoming,
    transmittedDirection: transmitted,
    reflectedDirection: reflected,
    fresnel: fresnel(n1, n2, cosIncident, cosTransmitted),
  };

  return { rayId: ray.id, events: [event] };
}

export function solve(scene: Scene): Trace {
  return {
    sceneVersion: scene.version,
    rays: scene.rays.map((ray) => solveRay(scene, ray)),
  };
}
