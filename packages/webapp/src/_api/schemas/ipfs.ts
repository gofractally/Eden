import * as z from "zod";

export const ipfsPostSchema = z.object({
    file: z.array(z.number()),
    eosTransaction: z.object({
        signatures: z.array(z.string()),
        serializedTransaction: z.array(z.number()),
    }),
});

export type IpfsPostRequest = z.infer<typeof ipfsPostSchema>;
