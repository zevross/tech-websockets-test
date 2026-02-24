/* AUTO-GENERATED - do not edit */

import { z } from "zod";

export const APIKey = z.object({ id: z.string() });
export type APIKey = z.infer<typeof APIKey>;
export const ArcWidthUpdatePayload = z.object({ arc_width: z.number() });
export type ArcWidthUpdatePayload = z.infer<typeof ArcWidthUpdatePayload>;
export const GetStatePayload = z
  .object({
    status: z.string(),
    timestamp: z.string(),
    text: z.string(),
    arc_width: z.number(),
    select_county_event: z.union([z.any(), z.null()]).default(null),
  })
  .describe(
    "Server response for get_state (ack). Matches State.to_dict() shape."
  );
export type GetStatePayload = z.infer<typeof GetStatePayload>;
export const SelectCountyBroadcastPayload = z.object({
  county_id: z.string(),
  animation_start_time: z.number().int(),
});
export type SelectCountyBroadcastPayload = z.infer<
  typeof SelectCountyBroadcastPayload
>;
export const SelectCountyPayload = z.object({ county_id: z.string() });
export type SelectCountyPayload = z.infer<typeof SelectCountyPayload>;
export const SocketJoinPayload = z.object({ room: z.string() });
export type SocketJoinPayload = z.infer<typeof SocketJoinPayload>;
export const Status = z.object({ status: z.string() });
export type Status = z.infer<typeof Status>;
export const TextUpdatePayload = z.object({ text: z.string() });
export type TextUpdatePayload = z.infer<typeof TextUpdatePayload>;
export const TickPayload = z.object({ timestamp: z.string() });
export type TickPayload = z.infer<typeof TickPayload>;
