import { z } from "zod";

export enum AvailableMeetingClients {
    Zoom = "zoom",
}

export const meetingLinkRequestSchema = z.object({
    client: z.nativeEnum(AvailableMeetingClients),
    topic: z.string(),
    duration: z.number(),
    startTime: z.string(),
});
export type MeetingLinkRequest = z.infer<typeof meetingLinkRequestSchema>;
