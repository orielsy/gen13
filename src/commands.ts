import { z } from "zod";

export const commandSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("setSurfaceMaterial"),
    target: z.string().min(1),
    side: z.enum(["a", "b"]),
    material: z.string().min(1),
  }),
  z.object({
    op: z.literal("setMaterialIor"),
    target: z.string().min(1),
    value: z.number().finite().min(1),
  }),
  z.object({
    op: z.literal("setRayAngle"),
    target: z.string().min(1),
    degrees: z.number().finite(),
  }),
]);

export type Command = z.infer<typeof commandSchema>;

export function parseCommand(input: unknown): Command {
  return commandSchema.parse(input);
}
