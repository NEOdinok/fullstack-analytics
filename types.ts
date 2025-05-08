import { z } from "zod";

export const RawEventSchema = z
  .object({
    event: z.string(),
    tags: z.array(z.string()),
    url: z.string(),
    title: z.string(),
    ts: z.number(),
  })
  .strict();

export type RawEvent = z.infer<typeof RawEventSchema>;

export const RawEventArraySchema = z.array(RawEventSchema);
