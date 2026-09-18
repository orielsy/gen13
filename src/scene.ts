export type EntityId = string;
export type MaterialId = string;

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface ConstantIorModel {
  readonly model: "constant";
  readonly value: number;
  readonly referenceWavelengthNm: number;
}

export interface Material {
  readonly id: MaterialId;
  readonly name: string;
  readonly ior: ConstantIorModel;
}

export interface RaySource {
  readonly id: EntityId;
  readonly origin: Vec2;
  readonly direction: Vec2;
  readonly medium: MaterialId;
  readonly wavelengthNm: number;
}

export interface Surface2D {
  readonly id: EntityId;
  /**
   * Any point on the infinite 2D interface.
   */
  readonly point: Vec2;
  /**
   * Points from materialA toward materialB.
   */
  readonly normal: Vec2;
  readonly materialA: MaterialId;
  readonly materialB: MaterialId;
}

export interface Scene {
  readonly version: 1;
  readonly units: "m";
  readonly materials: Readonly<Record<MaterialId, Material>>;
  readonly rays: readonly RaySource[];
  readonly surfaces: readonly Surface2D[];
}
