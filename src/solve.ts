import { iorAtWavelength } from "./materials";
import type { Material, RaySource, Scene, Surface2D, Vec2 } from "./scene";
import type {
  FresnelResult,
  RayTrace,
  RefractTraceEvent,
  TirTraceEvent,
  Trace,
} from "./trace";

/**
 * Physics/math sources for the equations implemented in this file are recorded
 * in docs/physics-references.md. Keep that document updated whenever a new
 * physical law or geometric derivation enters the solver.
 */

/**
 * Floating-point geometry is never perfectly exact.
 *
 * EPSILON lets us treat values that are effectively zero as zero so tiny
 * numerical noise does not create fake intersections or invalid vectors.
 */
const EPSILON = 1e-9;

/**
 * Internal description of the first surface a ray reaches.
 *
 * The public Scene describes surfaces. SurfaceHit is derived data created by
 * the solver after it figures out where a specific ray intersects one.
 */
interface SurfaceHit {
  readonly surface: Surface2D;
  readonly at: Vec2;
  readonly distance: number;

  /**
   * The normal is re-oriented for this particular ray so it points back into
   * the material the ray is currently leaving. That convention makes the
   * refraction math below consistent no matter which side is entered.
   */
  readonly normal: Vec2;

  readonly fromMaterial: Material;
  readonly toMaterial: Material;
}

/*
 * The small vector helpers live here for now because v0.0 has very little math.
 * If vector operations become substantial, that will be evidence for a real
 * math module rather than a reason to create one preemptively.
 */
function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(v: Vec2, factor: number): Vec2 {
  return { x: v.x * factor, y: v.y * factor };
}

/**
 * Convert an arbitrary direction/normal into a unit vector.
 *
 * Most of the optics formulas assume unit vectors. Normalizing here keeps the
 * Scene format friendly: callers do not have to get vector length exactly 1.
 */
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

/**
 * Find the closest compatible optical boundary in front of the ray.
 *
 * v0.0 surfaces are infinite lines in 2D. The equation here is the standard
 * ray/plane intersection written for two dimensions:
 *
 *   distance = ((surfacePoint - rayOrigin) · normal)
 *              / (rayDirection · normal)
 *
 * A negative distance means the intersection is behind the ray and is ignored.
 *
 * Source: docs/physics-references.md §5 (Stanford CS348b ray/plane
 * intersection derivation).
 */
function findNearestHit(scene: Scene, ray: RaySource): SurfaceHit | null {
  const direction = normalize(ray.direction);
  let nearest: SurfaceHit | null = null;

  for (const surface of scene.surfaces) {
    /*
     * A surface only makes sense for this ray if the ray says it is currently
     * inside one of the two materials separated by that surface.
     */
    const fromA = ray.medium === surface.materialA;
    const fromB = ray.medium === surface.materialB;

    if (!fromA && !fromB) {
      continue;
    }

    const geometricNormal = normalize(surface.normal);
    const denominator = dot(direction, geometricNormal);

    // A near-zero denominator means the ray is parallel to the interface.
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

    // Ignore surfaces behind the ray or effectively at its origin.
    if (distance <= EPSILON) {
      continue;
    }

    // We only need the first interaction in v0.0.
    if (nearest && distance >= nearest.distance) {
      continue;
    }

    /*
     * Surface2D.normal always points A -> B.
     *
     * For the optics equations we want a normal that points back toward the
     * incident medium. If the ray is leaving A, flip the stored normal.
     */
    const normal = fromA ? scale(geometricNormal, -1) : geometricNormal;

    /*
     * For normalized vectors:
     *
     *   cos(theta_i) = -normal · incoming
     *
     * theta_i is the incident angle measured from the normal.
     */
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

/**
 * Mirror reflection of a vector around a surface normal.
 *
 * Because cosIncident = -n·d above, this is equivalent to:
 *
 *   r = d - 2(d·n)n
 *
 * Source: docs/physics-references.md §3 (law of reflection / PBRT vector
 * reflection derivation).
 */
function reflectedDirection(
  incoming: Vec2,
  normal: Vec2,
  cosIncident: number,
): Vec2 {
  return normalize(add(incoming, scale(normal, 2 * cosIncident)));
}

/**
 * Fresnel equations for a dielectric boundary.
 *
 * They answer a different question from Snell's law:
 * - Snell: where does the transmitted ray go?
 * - Fresnel: how much energy reflects vs. transmits?
 *
 * We calculate S and P polarization separately, then average them for
 * unpolarized light.
 *
 * Source: docs/physics-references.md §4 (RP Photonics and PBRT).
 */
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

/**
 * Solve the first optical interaction for one source ray.
 *
 * v0.0 intentionally stops after one event. Multi-bounce tracing will be
 * introduced only when we are ready to propagate the reflected/transmitted
 * child rays as new simulation work.
 */
function solveRay(scene: Scene, ray: RaySource): RayTrace {
  const incoming = normalize(ray.direction);
  const hit = findNearestHit(scene, ray);

  /*
   * Event IDs are deterministic. Running the same Scene twice produces the
   * same referent, which matters for selection, tests, and future Genie context.
   */
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

  /*
   * Snell's law:
   *
   *   n1 sin(theta1) = n2 sin(theta2)
   *
   * Rearranged:
   *
   *   sin(theta2)^2 = (n1 / n2)^2 * (1 - cos(theta1)^2)
   *
   * Working with the squared sine lets us detect total internal reflection
   * before attempting to calculate a transmitted angle that does not exist.
   *
   * Source: docs/physics-references.md §1 (OpenStax refraction).
   */
  const eta = n1 / n2;
  const sinTransmittedSquared =
    eta * eta * Math.max(0, 1 - cosIncident * cosIncident);

  const reflected = reflectedDirection(incoming, hit.normal, cosIncident);

  /*
   * If sin(theta2)^2 > 1, Snell's law has no real transmitted solution:
   * total internal reflection.
   */
  if (sinTransmittedSquared > 1) {
    /*
     * Critical angle exists only when moving from larger n to smaller n:
     *
     *   theta_c = asin(n2 / n1)
     *
     * Source: docs/physics-references.md §2 (OpenStax total internal
     * reflection).
     */
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

  /*
   * A transmitted solution exists. cos(theta2) follows from
   * sin^2(theta2) + cos^2(theta2) = 1.
   */
  const cosTransmitted = Math.sqrt(Math.max(0, 1 - sinTransmittedSquared));

  /*
   * Vector form of Snell refraction. This gives us a direction vector suitable
   * for both future rendering and future multi-bounce propagation.
   *
   * Source: docs/physics-references.md §1 and §3; PBRT also implements the
   * corresponding vector refraction form in its specular-transmission chapter.
   */
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
    thetaTransmittedDeg: toDegrees(
      Math.asin(Math.sqrt(sinTransmittedSquared)),
    ),
    incomingDirection: incoming,
    transmittedDirection: transmitted,
    reflectedDirection: reflected,
    fresnel: fresnel(n1, n2, cosIncident, cosTransmitted),
  };

  return { rayId: ray.id, events: [event] };
}

/**
 * Public solver entry point.
 *
 * Scene goes in; Trace comes out. No mutation, no DOM, no rendering, and no
 * hidden state. That purity is the central v0.0 architectural constraint.
 */
export function solve(scene: Scene): Trace {
  return {
    sceneVersion: scene.version,
    rays: scene.rays.map((ray) => solveRay(scene, ray)),
  };
}
