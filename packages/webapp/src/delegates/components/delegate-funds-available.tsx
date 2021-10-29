import React, { useState } from "react";
import dayjs from "dayjs";
import { useQueryClient } from "react-query";
import { RiDownloadLine } from "react-icons/ri";

import {
    Asset,
    assetToLocaleString,
    assetToString,
    onError,
    queryDistributionsForAccount,
    queryTokenBalanceForAccount,
    sumAssetStrings,
    useDistributionsForAccount,
    useDistributionState,
    useFormFields,
    useMemberByAccountName,
    useUALAccount,
} from "_app";
import { Button, Container, Form, Heading, Modal, Text } from "_app/ui";

import { withdrawAvailableFunds } from "../transactions";
import { useAccountBalance } from "treasury/hooks";

interface Props {
    account: string;
}

export const DelegateFundsAvailable = ({ account }: Props) => {
    const [ualAccount] = useUALAccount();
    const { data: profile } = useMemberByAccountName(account);
    const {
        data: accountBalance,
        isLoading: isLoadingAccountBalance,
        isError: isErrorAccountBalance,
    } = useAccountBalance(account);
    const { data: distributions } = useDistributionsForAccount(account);

    const [isLoading, setIsLoading] = useState(false);
    const [isWithdrawModalOpen, setIsWithDrawModalOpen] = useState(true);
    const queryClient = useQueryClient();

    let availableFunds: Asset | undefined = undefined;
    if (accountBalance && distributions) {
        const assetStrings = [
            ...distributions.map((distribution) => distribution.balance),
            accountBalance.balanceAsString,
        ];
        availableFunds = sumAssetStrings(assetStrings);
    }

    const isProfileDelegate = Boolean(profile?.election_rank);

    if (!isProfileDelegate && !availableFunds?.quantity) return null;

    const submitWithdraw = async () => {
        setIsLoading(true);

        try {
            const authorizerAccount = ualAccount.accountName;
            const trx = withdrawAvailableFunds(
                authorizerAccount,
                availableFunds!,
                distributions!
            );
            console.info("signing trx", trx);

            const signedTrx = await ualAccount.signTransaction(trx, {
                broadcast: true,
            });
            console.info("withdraw available funds trx", signedTrx);

            // allow time for chain tables to update
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // invalidate current member query to update participating status
            queryClient.invalidateQueries(
                queryDistributionsForAccount(ualAccount.accountName).queryKey
            );
            queryClient.invalidateQueries(
                queryTokenBalanceForAccount(ualAccount.accountName).queryKey
            );
        } catch (error) {
            console.error(error);
            onError(error as Error);
        }

        setIsLoading(false);
    };

    const profileBelongsToCurrentUser = Boolean(
        ualAccount && profile && ualAccount.accountName === profile.account
    );

    return (
        <Container className="space-y-2.5">
            <div className="flex justify-between items-center">
                <div>
                    <Heading size={4}>Funds available</Heading>
                    <Text>
                        {availableFunds
                            ? assetToLocaleString(availableFunds)
                            : "None"}
                    </Text>
                </div>
                <div>
                    {profileBelongsToCurrentUser && (
                        <Button
                            onClick={submitWithdraw}
                            disabled={
                                isLoading ||
                                !availableFunds ||
                                availableFunds.quantity === 0
                            }
                            isLoading={isLoading}
                        >
                            {!isLoading && (
                                <RiDownloadLine className="-ml-1 mr-1" />
                            )}
                            Withdraw
                        </Button>
                    )}
                </div>
            </div>
            {profileBelongsToCurrentUser && isProfileDelegate && (
                <NextDisbursementInfo />
            )}
            <WithdrawModal
                isOpen={isWithdrawModalOpen}
                close={() => {}}
                availableFunds={availableFunds}
            />
        </Container>
    );
};

export const NextDisbursementInfo = () => {
    const { data: distributionState } = useDistributionState();

    if (!distributionState) return null;

    switch (distributionState.state) {
        case "next_distribution":
            const nextDisbursementTime = dayjs(
                distributionState.data.distribution_time + "Z"
            );
            return (
                <Text>
                    Delegate funds are disbursed monthly. Check back on{" "}
                    {nextDisbursementTime.format("LL")} after{" "}
                    {nextDisbursementTime.format("LT z")} for your next
                    disbursement.
                </Text>
            );
        case "election_distribution":
            return (
                <Text>
                    An election is currently underway. Disbursements to
                    newly-elected delegates will be processed as soon as the
                    election ends.
                </Text>
            );
        case "current_distribution":
            return (
                <Text>
                    A disbursement is being processed now. Check back in the
                    next few hours.
                </Text>
            );
        default:
            return null;
    }
};

interface ModalProps {
    isOpen: boolean;
    close: () => void;
    availableFunds?: Asset;
}

const WithdrawModal = ({ isOpen, close, availableFunds }: ModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log(e);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            contentLabel="Withdraw funds from Eden"
            preventScroll
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
        >
            <WithdrawFundsForm
                availableFunds={availableFunds}
                onSubmit={onSubmit}
            />
        </Modal>
    );
};

interface WithdrawFundsFormProps {
    availableFunds?: Asset;
    onSubmit: (e: React.FormEvent) => Promise<void>;
}

const WithdrawFundsForm = ({
    availableFunds,
    onSubmit,
}: WithdrawFundsFormProps) => {
    const [ualAccount] = useUALAccount();

    interface WithdrawForm {
        to: string;
        amount: number;
        memo: string;
    }

    const [fields, setFields] = useFormFields<WithdrawForm>({
        to: ualAccount.accountName,
        amount: 0,
        memo: "",
    });

    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFields(e);
    };

    const setMaxAmount = (e: React.MouseEvent) => {
        const max = assetToString(
            availableFunds!,
            availableFunds!.precision
        ).split(" ")[0];
        setFields({ target: { id: "amount", value: max } });
    };

    return (
        <div className="space-y-4">
            <Heading>Withdraw funds</Heading>
            <Text>
                Withdraw funds from my Eden account to a public EOS account.
            </Text>
            <Text>
                Available:{" "}
                <span className="font-medium">
                    {availableFunds
                        ? assetToLocaleString(
                              availableFunds,
                              availableFunds.precision
                          )
                        : ""}
                </span>
            </Text>
            <form onSubmit={onSubmit} className="space-y-3">
                <Form.LabeledSet
                    label="EOS account (12 characters)"
                    htmlFor="to"
                >
                    <Form.Input
                        id="to"
                        type="text"
                        required
                        value={fields.to}
                        onChange={onChangeFields}
                        maxLength={12} // TODO: detect if valid EOSIO name
                    />
                </Form.LabeledSet>
                <Form.LabeledSet label="Amount to withdraw" htmlFor="amount">
                    <div className="flex space-x-2">
                        <div className="relative flex-1">
                            <Form.Input
                                id="amount"
                                type="number"
                                inputMode="decimal"
                                min={0} // TODO: Max should be available
                                step="any"
                                required
                                value={fields.amount}
                                onChange={onChangeFields}
                                maxLength={12} // TODO: detect if valid asset
                                onWheel={(e) =>
                                    (e.target as HTMLInputElement).blur()
                                }
                            />
                            <div className="absolute top-3 right-2">
                                <p className="text-sm text-gray-400">
                                    {availableFunds?.symbol}
                                </p>
                            </div>
                        </div>
                        <Button onClick={setMaxAmount}>MAX</Button>
                    </div>
                </Form.LabeledSet>
                <Form.LabeledSet label="Memo" htmlFor="memo">
                    <Form.Input
                        id="memo"
                        type="text"
                        value={fields.memo}
                        onChange={onChangeFields}
                    />
                </Form.LabeledSet>
            </form>
            <div className="flex space-x-3">
                <Button type="neutral" onClick={close} disabled={false}>
                    Cancel
                </Button>
                <Button onClick={onSubmit} isLoading={false} disabled={false}>
                    Preview
                </Button>
            </div>
        </div>
    );
};
