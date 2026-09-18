import type { Command } from "./commands";
import type { Material, RaySource, Scene, Surface2D } from "./scene";

export class CommandDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandDomainError";
  }
}

function degreesToDirection(degrees: number): { x: number; y: number } {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: Math.cos(radians),
    y: Math.sin(radians),
  };
}

export function applyCommand(scene: Scene, command: Command): Scene {
  switch (command.op) {
    case "setSurfaceMaterial": {
      if (!(command.material in scene.materials)) {
        throw new CommandDomainError(`Unknown material: ${command.material}`);
      }

      let found = false;
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
