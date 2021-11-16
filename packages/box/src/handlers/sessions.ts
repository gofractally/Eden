import express, { Request, Response } from "express";
import {
    handleErrors,
    BadRequestError,
    sessionSignRequest,
    SessionSignRequest,
} from "@edenos/common";

import logger from "../logger";
import { eosJsonRpc, eosDefaultApi } from "../eos";
import { sessionsConfig } from "../config";
import { TaposManager } from "../sessions";

export const sessionHandler = express.Router();

const taposManager = new TaposManager(eosJsonRpc);
taposManager.init();

sessionHandler.post("/sign", async (req: Request, res: Response) => {
    try {
        const { body } = req;
        if (!body) {
            throw new BadRequestError(["missing session sign data"]);
        }

        const parsedRequest = sessionSignRequest.safeParse(JSON.parse(body));
        if (parsedRequest.success !== true) {
            throw new BadRequestError(parsedRequest.error.flatten());
        }

        const requestData: SessionSignRequest = parsedRequest.data;
        return await signSessionRequest(requestData, res);
    } catch (error) {
        logger.error(`sessionHandler: ${error.message}`);
        return handleErrors(res, error);
    }
});

const signSessionRequest = async (
    requestData: SessionSignRequest,
    res: Response
) => {
    return res.json({ hey: "wip" });
};

// // Make up an ABI if needed // TODO: is it needed since we have the execsession from the contract?
// if (sessionsConfig.sessionsCreateABI) {
//     const noopAbi = {
//         version: "eosio::abi/1.1",
//         types: [] as any[],
//         structs: [
//             {
//                 name: sessionsConfig.sessionsNoopAction,
//                 base: "",
//                 fields: [] as any[],
//             },
//         ],
//         actions: [
//             {
//                 name: sessionsConfig.sessionsNoopAction,
//                 type: sessionsConfig.sessionsNoopAction,
//                 ricardian_contract: "",
//             },
//         ],
//         tables: [] as any[],
//         ricardian_clauses: [] as any[],
//         error_messages: [] as any[],
//         abi_extensions: [] as any[],
//         variants: [] as any[],
//     };
//     eosDefaultApi.cachedAbis.set(sessionsConfig.sessionsNoopContract, {
//         rawAbi: eosDefaultApi.jsonToRawAbi(noopAbi),
//         abi: noopAbi,
//     });
// }
