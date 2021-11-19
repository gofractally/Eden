import express, { Request, Response } from "express";
import {
    handleErrors,
    BadRequestError,
    InternalServerError,
    sessionSignRequest,
    SessionSignRequest,
} from "@edenos/common";
import { arrayToHex } from "eosjs/dist/eosjs-serialize";

import logger from "../logger";
import { eosJsonRpc, eosDefaultApi } from "../eos";
import { edenContractAccount } from "../config";
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
    sessionSignRequest: SessionSignRequest,
    res: Response
) => {
    const trx = prepareExecSessionTrx(sessionSignRequest);
    const signedTrxResult = await signTrx(trx);
    logger.info(
        `signed [execsession] for account:${sessionSignRequest.edenAccount}
        sequence:${sessionSignRequest.sequence}`
    );
    return res.json(signedTrxResult);
};

const prepareExecSessionTrx = (sessionSignRequest: SessionSignRequest) => {
    const tapos = taposManager.getTapos();
    const expiration = new Date(Date.now() + 2 * 60 * 1000)
        .toISOString()
        .slice(0, -1);
    return {
        ...tapos,
        expiration,
        actions: [
            {
                account: edenContractAccount,
                name: "execsession",
                authorization: [] as any[],
                data: {
                    // TODO: pending interface definition
                    signature: sessionSignRequest.signature,
                    eden_account: sessionSignRequest.edenAccount,
                    sequence: sessionSignRequest.sequence,
                    actions: sessionSignRequest.actions,
                },
            },
        ],
    };
};

const signTrx = async (trx: any) => {
    const signedTrx = await eosDefaultApi.transact(trx, {
        broadcast: false,
    });
    return {
        signatures: (signedTrx as any).signatures,
        packed_trx: arrayToHex((signedTrx as any).serializedTransaction),
    };
};
