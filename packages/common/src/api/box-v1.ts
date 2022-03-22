import * as z from "zod";

export const ipfsUploadRequest = z.object({
    syncUpload: z.boolean(),
    eosTransaction: z.object({
        signatures: z.array(z.string()),
        serializedTransaction: z.array(z.number()),
    }),
});

export type IpfsUploadRequest = z.infer<typeof ipfsUploadRequest>;

export const sessionSignRequest = z.object({
    signature: z.string(),
    edenAccount: z.string(),
    sequence: z.number(),
    verbs: z.array(z.any()),
});

export type SessionSignRequest = z.infer<typeof sessionSignRequest>;
