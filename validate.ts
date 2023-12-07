import { z } from "zod";

export const schema = z.object({
    M: z.number(),
    efConstruction: z.number(),
    levelMax: z.number(),
    entryPointId: z.number(),
    nodes: z.array(
        z.object({
            id: z.number(),
            level: z.number(),
            vector: z.array(z.number()),
            neighbors: z.array(z.array(z.number()))
        })
    )
});

export function validate(data: any) {
    return schema.safeParse(data);
}
