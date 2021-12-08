import express, { Request, Response } from "express";
import {
    handleErrors,
    BadRequestError,
    sessionSignRequest,
    SessionSignRequest,
} from "@edenos/common";
import { arrayToHex } from "eosjs/dist/eosjs-serialize";

import logger from "../logger";
import { eosDefaultApi, taposManager } from "../eos";
import { edenContractAccount, serverPaysConfig } from "../config";

export const sessionHandler = express.Router();

sessionHandler.post("/sign", async (req: Request, res: Response) => {
    try {
        const { body } = req;
        if (!body) {
            throw new BadRequestError(["missing session sign data"]);
        }

        const parsedRequest = sessionSignRequest.safeParse(body);
        if (parsedRequest.success !== true) {
            throw new BadRequestError(parsedRequest.error.flatten());
        }
        console.info("parsed req >>>", parsedRequest);

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

    const signatureAuth = {
        signature: sessionSignRequest.signature,
        contract: edenContractAccount,
        account: sessionSignRequest.edenAccount,
        sequence: sessionSignRequest.sequence,
    };

    return {
        ...tapos,
        expiration,
        actions: [
            {
                account: serverPaysConfig.serverPaysNoopContract,
                name: serverPaysConfig.serverPaysNoopAction,
                authorization: [
                    {
                        actor: serverPaysConfig.serverPaysAccount,
                        permission: serverPaysConfig.serverPaysPermission,
                    },
                ],
                data: {},
            },
            {
                account: edenContractAccount,
                name: "run",
                authorization: [] as any[],
                data: {
                    auth: ["signature_auth", signatureAuth],
                    verbs: sessionSignRequest.verbs,
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
