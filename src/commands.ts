import { z } from "zod";

/**
 * Commands are the only supported write-path into Scene state.
 *
 * The eventual UI and Genie should both produce these same commands instead of
 * mutating Scene directly. Zod gives us runtime validation as well as the
 * TypeScript type inferred below.
 */
export const commandSchema = z.discriminatedUnion("op", [
  /**
   * Change the material on one side of an optical interface.
   *
   * "a" and "b" correspond to Surface2D.materialA/materialB.
   */
  z.object({
    op: z.literal("setSurfaceMaterial"),
    target: z.string().min(1),
    side: z.enum(["a", "b"]),
    material: z.string().min(1),
  }),

  /**
   * Override the constant index of refraction for a material.
   *
   * v0.0 limits n >= 1. That is sufficient for the ordinary optical materials
   * we are exploring right now.
   */
  z.object({
    op: z.literal("setMaterialIor"),
    target: z.string().min(1),
    value: z.number().finite().min(1),
  }),

  /**
   * Rotate a source ray while leaving its origin and medium unchanged.
   */
  z.object({
    op: z.literal("setRayAngle"),
    target: z.string().min(1),
    degrees: z.number().finite(),
  }),
]);

export type Command = z.infer<typeof commandSchema>;

/**
 * Use this at trust boundaries (UI input, persisted JSON, Genie output, etc.)
 * before a value is allowed to reach the reducer.
 */
export function parseCommand(input: unknown): Command {
  return commandSchema.parse(input);
}
