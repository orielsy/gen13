import type { EntityId, MaterialId, Vec2 } from "./scene";

export interface FresnelResult {
  readonly reflectanceS: number;
  readonly reflectanceP: number;
  readonly reflectance: number;
  readonly transmittance: number;
}

interface BaseTraceEvent {
  readonly id: EntityId;
  readonly rayId: EntityId;
  readonly at: Vec2;
}

export interface RefractTraceEvent extends BaseTraceEvent {
  readonly kind: "refract";
  readonly surfaceId: EntityId;
  readonly fromMaterial: MaterialId;
  readonly toMaterial: MaterialId;
  readonly wavelengthNm: number;
  readonly n1: number;
  readonly n2: number;
  readonly thetaIncidentDeg: number;
  readonly thetaTransmittedDeg: number;
  readonly incomingDirection: Vec2;
  readonly transmittedDirection: Vec2;
  readonly reflectedDirection: Vec2;
  readonly fresnel: FresnelResult;
}

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

export interface EscapeTraceEvent extends BaseTraceEvent {
  readonly kind: "escape";
  readonly reason: "no-surface-hit";
}

export type TraceEvent = RefractTraceEvent | TirTraceEvent | EscapeTraceEvent;

export interface RayTrace {
  readonly rayId: EntityId;
  readonly events: readonly TraceEvent[];
}

export interface Trace {
  readonly sceneVersion: SceneVersion;
  readonly rays: readonly RayTrace[];
}

export type SceneVersion = 1;
