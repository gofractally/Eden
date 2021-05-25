import type { NextApiRequest, NextApiResponse } from "next";
import * as z from "zod";
import { Api } from "eosjs";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig"; // development only

import { edenContractAccount, eosPrivateKeys, jobKeys } from "config";
import { jobHandler } from "_api/job-helpers";
import { eosJsonRpc } from "_app";

const GC_JOB_KEY = jobKeys.gc;

const jobSchema = z.object({
    limit: z.number(),
});
type JobRequest = z.infer<typeof jobSchema>;

export default async (req: NextApiRequest, res: NextApiResponse) =>
    jobHandler(req, res, GC_JOB_KEY, gcJob, jobSchema.safeParse);

const gcJob = async ({ limit }: JobRequest) => {
    console.info(`Running GC Job with limit: ${limit}...`);

    const eosApi = new Api({
        rpc: eosJsonRpc,
        signatureProvider: new JsSignatureProvider([eosPrivateKeys.gcJob]),
    });

    try {
        const jobTrx = await eosApi.transact(
            {
                actions: [
                    {
                        account: edenContractAccount,
                        name: "gc",
                        authorization: [
                            {
                                actor: edenContractAccount,
                                permission: "active",
                            },
                        ],
                        data: {
                            limit,
                        },
                    },
                ],
            },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            }
        );

        return { success: "job completed", jobTrx };
    } catch (error) {
        if (error.message.includes("Nothing to do")) {
            return { success: "Nothing to do." };
        }
        throw error;
    }
};
