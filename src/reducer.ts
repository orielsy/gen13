import type { Command } from "./commands";
import type { Material, RaySource, Scene, Surface2D } from "./scene";

/**
 * A command can be structurally valid but still reference something that does
 * not exist in the current Scene. Those failures are domain errors rather than
 * schema/validation errors.
 */
export class CommandDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandDomainError";
  }
}

/**
 * Scene stores direction as a unit vector, while the public command uses
 * degrees because that is friendlier for humans and future UI controls.
 */
function degreesToDirection(degrees: number): { x: number; y: number } {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: Math.cos(radians),
    y: Math.sin(radians),
  };
}

/**
 * Apply one command and return a NEW Scene.
 *
 * We intentionally avoid mutating the input scene. Immutable state makes
 * undo/redo, branching experiments, tests, and future "what if?" sweeps much
 * easier because every state transition is explicit.
 */
export function applyCommand(scene: Scene, command: Command): Scene {
  switch (command.op) {
    case "setSurfaceMaterial": {
      if (!(command.material in scene.materials)) {
        throw new CommandDomainError(`Unknown material: ${command.material}`);
      }

      let found = false;

      // Only the targeted surface is replaced. Every other surface keeps the
      // same object identity.
      const surfaces: Surface2D[] = scene.surfaces.map((surface) => {
        if (surface.id !== command.target) {
          return surface;
        }

        found = true;
        return command.side === "a"
          ? { ...surface, materialA: command.material }
          : { ...surface, materialB: command.material };
      });

      if (!found) {
        throw new CommandDomainError(`Unknown surface: ${command.target}`);
      }

      return { ...scene, surfaces };
    }

    case "setMaterialIor": {
      const material = scene.materials[command.target];

      if (!material) {
        throw new CommandDomainError(`Unknown material: ${command.target}`);
      }

      // Clone the material and its nested IOR model so the previous Scene
      // remains untouched.
      const updated: Material = {
        ...material,
        ior: {
          ...material.ior,
          value: command.value,
        },
      };

      return {
        ...scene,
        materials: {
          ...scene.materials,
          [command.target]: updated,
        },
      };
    }

    case "setRayAngle": {
      let found = false;

      const rays: RaySource[] = scene.rays.map((ray) => {
        if (ray.id !== command.target) {
          return ray;
        }

        found = true;
        return {
          ...ray,
          direction: degreesToDirection(command.degrees),
        };
      });

      if (!found) {
        throw new CommandDomainError(`Unknown ray: ${command.target}`);
      }

      return { ...scene, rays };
    }
  }
}
