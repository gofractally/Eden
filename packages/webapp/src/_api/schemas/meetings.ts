import { z } from "zod";

export enum AvailableMeetingClients {
    Zoom = "zoom",
}

export const meetingLinkRequestSchema = z.object({
    client: z.nativeEnum(AvailableMeetingClients),
    accessToken: z.string(),
});
export type MeetingLinkRequest = z.infer<typeof meetingLinkRequestSchema>;
