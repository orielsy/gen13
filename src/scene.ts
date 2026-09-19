/**
 * Scene is the complete input to the Gen13 solver.
 *
 * Important: keep Scene as plain data. It should describe what exists, not
 * store anything that can be derived by the solver. That keeps the same scene
 * reproducible, serializable, and easy to inspect.
 */

export type EntityId = string;
export type MaterialId = string;

/**
 * Minimal 2D vector used for positions, directions, and surface normals.
 */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/**
 * v0.0 uses a deliberately simple refractive-index model: one constant value.
 *
 * The reference wavelength is kept in the model because refractive index
 * eventually varies by wavelength (dispersion). We are keeping that future
 * capability visible without implementing it yet.
 */
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

/**
 * A ray source is the starting condition for one light ray.
 *
 * direction does not need to be pre-normalized; the solver normalizes it.
 * medium identifies the material the ray currently travels through.
 */
export interface RaySource {
  readonly id: EntityId;
  readonly origin: Vec2;
  readonly direction: Vec2;
  readonly medium: MaterialId;
  readonly wavelengthNm: number;
}

/**
 * v0.0 models each optical boundary as an infinite 2D interface.
 *
 * A future geometry system can add finite segments, circles, prisms, etc.
 * without changing the basic idea that a surface separates two materials.
 */
export interface Surface2D {
  readonly id: EntityId;

  /** Any point lying on the infinite interface. */
  readonly point: Vec2;

  /**
   * Defines the orientation of the interface.
   *
   * By convention this vector points from materialA toward materialB. The
   * solver uses that convention to determine which material the ray is leaving
   * and which material it is entering.
   */
  readonly normal: Vec2;

  readonly materialA: MaterialId;
  readonly materialB: MaterialId;
}

/**
 * The Scene is Gen13's source of truth.
 *
 * Commands create a new Scene. solve(scene) derives a Trace from it.
 */
export interface Scene {
  readonly version: 1;
  readonly units: "m";
  readonly materials: Readonly<Record<MaterialId, Material>>;
  readonly rays: readonly RaySource[];
  readonly surfaces: readonly Surface2D[];
}
