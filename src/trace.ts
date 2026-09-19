import type { EntityId, MaterialId, Vec2 } from "./scene";

/**
 * Fresnel equations tell us how much light is reflected versus transmitted at
 * a boundary. S and P are the two polarization orientations.
 *
 * v0.0 records both and also their average, which represents unpolarized light.
 */
export interface FresnelResult {
  readonly reflectanceS: number;
  readonly reflectanceP: number;
  readonly reflectance: number;
  readonly transmittance: number;
}

/**
 * Trace is not merely renderer output. It is Gen13's evidence of what the
 * solver decided.
 *
 * Every event gets a stable ID so the UI can select it and a future Genie can
 * resolve phrases such as "why did that ray bend?"
 */
interface BaseTraceEvent {
  readonly id: EntityId;
  readonly rayId: EntityId;
  readonly at: Vec2;
}

/**
 * A normal refraction event: some light may reflect, while the transmitted
 * portion enters the next material according to Snell's law.
 */
export interface RefractTraceEvent extends BaseTraceEvent {
  readonly kind: "refract";
  readonly surfaceId: EntityId;
  readonly fromMaterial: MaterialId;
  readonly toMaterial: MaterialId;
  readonly wavelengthNm: number;

  // Refractive indices on the incident (n1) and transmitted (n2) sides.
  readonly n1: number;
  readonly n2: number;

  // Angles are measured from the surface normal, not from the surface itself.
  readonly thetaIncidentDeg: number;
  readonly thetaTransmittedDeg: number;

  // Keeping the vectors makes the result directly drawable later.
  readonly incomingDirection: Vec2;
  readonly transmittedDirection: Vec2;
  readonly reflectedDirection: Vec2;

  readonly fresnel: FresnelResult;
}

/**
 * Total internal reflection occurs when a ray travels from a higher-index
 * material toward a lower-index material at an angle above the critical angle.
 * There is no transmitted ray in this event.
 */
export interface TirTraceEvent extends BaseTraceEvent {
  readonly kind: "tir";
  readonly surfaceId: EntityId;
  readonly fromMaterial: MaterialId;
  readonly toMaterial: MaterialId;
  readonly wavelengthNm: number;
  readonly n1: number;
  readonly n2: number;
  readonly thetaIncidentDeg: number;
  readonly thetaCriticalDeg: number;
  readonly incomingDirection: Vec2;
  readonly reflectedDirection: Vec2;
}

/**
 * If no compatible surface lies in front of the ray, it simply leaves the
 * currently modeled scene.
 */
export interface EscapeTraceEvent extends BaseTraceEvent {
  readonly kind: "escape";
  readonly reason: "no-surface-hit";
}

export type TraceEvent = RefractTraceEvent | TirTraceEvent | EscapeTraceEvent;

/**
 * Keeping events grouped under their source ray leaves room for multi-bounce
 * tracing later. v0.0 currently produces at most one interaction per ray.
 */
export interface RayTrace {
  readonly rayId: EntityId;
  readonly events: readonly TraceEvent[];
}

/**
 * Trace is fully derived from Scene. We never write it back into Scene state.
 */
export interface Trace {
  readonly sceneVersion: SceneVersion;
  readonly rays: readonly RayTrace[];
}

export type SceneVersion = 1;
