/* AUTO-GENERATED - do not edit */

import { z } from "zod";

export const APIKey = z.object({ id: z.string() });
export type APIKey = z.infer<typeof APIKey>;
export const ArcWidthUpdatePayload = z.object({ arc_width: z.number() });
export type ArcWidthUpdatePayload = z.infer<typeof ArcWidthUpdatePayload>;
export const SocketJoinPayload = z.object({ room: z.string() });
export type SocketJoinPayload = z.infer<typeof SocketJoinPayload>;
export const Status = z.object({ status: z.string() });
export type Status = z.infer<typeof Status>;
export const TextUpdatePayload = z.object({ text: z.string() });
export type TextUpdatePayload = z.infer<typeof TextUpdatePayload>;
export const TickPayload = z.object({ timestamp: z.string() });
export type TickPayload = z.infer<typeof TickPayload>;
