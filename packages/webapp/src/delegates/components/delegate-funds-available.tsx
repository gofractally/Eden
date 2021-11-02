import React, { useState } from "react";
import dayjs from "dayjs";
import { useQueryClient } from "react-query";
import { RiDownloadLine } from "react-icons/ri";

import {
    Asset,
    assetFromNumber,
    assetToLocaleString,
    assetToString,
    onError,
    queryDistributionsForAccount,
    queryTokenBalanceForAccount,
    SetValuesEvent,
    sumAssetStrings,
    useDistributionsForAccount,
    useDistributionState,
    useFormFields,
    useMemberByAccountName,
    useUALAccount,
} from "_app";
import {
    Button,
    Container,
    Form,
    Heading,
    Modal,
    Text,
    Link,
    OpensInNewTabIcon,
} from "_app/ui";

import { withdrawAndTransfer } from "../transactions";
import { useAccountBalance } from "treasury/hooks";
import { DistributionAccount } from "delegates/interfaces";
import { blockExplorerTransactionBaseUrl, tokenConfig } from "config";

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
    const [isWithdrawModalOpen, setIsWithDrawModalOpen] = useState(false);

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
                            ? assetToLocaleString(
                                  availableFunds,
                                  tokenConfig.precision
                              )
                            : "None"}
                    </Text>
                </div>
                <div>
                    {profileBelongsToCurrentUser && (
                        <Button
                            onClick={() => setIsWithDrawModalOpen(true)}
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
                close={() => setIsWithDrawModalOpen(false)}
                availableFunds={availableFunds}
                distributions={distributions}
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
    distributions?: DistributionAccount[];
}

enum WithdrawStep {
    Form,
    Confirmation,
    Success,
}

const WithdrawModal = ({
    isOpen,
    close,
    availableFunds,
    distributions,
}: ModalProps) => {
    const queryClient = useQueryClient();
    const [ualAccount] = useUALAccount();

    const [step, setStep] = useState<WithdrawStep>(WithdrawStep.Form);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [transactionId, setTransactionId] = useState<string>("");
    // TODO: clear all modal state on close

    const formState = useFormFields<WithdrawForm>({
        to: ualAccount?.accountName,
        amount: 0,
        memo: "",
    });

    const onPreview = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep(WithdrawStep.Confirmation);
    };

    const submitWithdraw = async () => {
        const { amount, to, memo } = formState[0];
        setIsLoading(true);

        try {
            const authorizerAccount = ualAccount.accountName;
            const trx = withdrawAndTransfer(
                authorizerAccount,
                assetFromNumber(amount),
                to,
                memo,
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
            setTransactionId(signedTrx.transactionId);
            setStep(WithdrawStep.Success);
        } catch (error) {
            console.error(error);
            onError(error as Error);
        }

        setIsLoading(false);
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
            {step === WithdrawStep.Form ? (
                <WithdrawFundsForm
                    availableFunds={availableFunds}
                    onPreview={onPreview}
                    formState={formState}
                    onCancel={close}
                />
            ) : step === WithdrawStep.Confirmation ? (
                <WithdrawConfirmationStep
                    formValues={formState[0]}
                    goBack={() => setStep(WithdrawStep.Form)}
                    onConfirm={submitWithdraw}
                    isLoading={isLoading}
                />
            ) : (
                <WithdrawalSuccessStep
                    isThirdPartyTransfer={
                        ualAccount.accountName !== formState[0].to
                    }
                    dismiss={close}
                    transactionId={transactionId}
                />
            )}
        </Modal>
    );
};

interface WithdrawForm {
    to: string;
    amount: number;
    memo: string;
}

interface WithdrawFundsFormProps {
    availableFunds?: Asset;
    formState: [WithdrawForm, SetValuesEvent];
    onPreview: (e: React.FormEvent) => Promise<void>;
    onCancel: () => void;
}

const WithdrawFundsForm = ({
    availableFunds,
    formState,
    onPreview,
    onCancel,
}: WithdrawFundsFormProps) => {
    const [ualAccount] = useUALAccount();
    const [fields, setFields] = formState;

    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFields(e);
    };

    const validateAccountField = (e: React.FormEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        if (target.validity.valueMissing) {
            target.setCustomValidity("Enter an account name");
        } else {
            target.setCustomValidity("Invalid account name");
        }
    };

    const clearErrorMessages = (e: React.FormEvent<HTMLInputElement>) => {
        (e.target as HTMLInputElement).setCustomValidity("");
    };

    if (!availableFunds) return null;

    const maxWithdrawal = Number(
        assetToString(availableFunds!, availableFunds.precision).split(" ")[0]
    );

    const setMaxAmount = () =>
        setFields({ target: { id: "amount", value: maxWithdrawal } });

    const isThirdPartyWithdrawal = ualAccount.accountName !== formState[0].to;

    const amountInputPreventChangeOnScroll = (
        e: React.WheelEvent<HTMLInputElement>
    ) => (e.target as HTMLInputElement).blur();

    return (
        <div className="space-y-4">
            <Heading>Withdraw funds</Heading>
            <Text>
                Withdraw funds from my Eden account to a public EOS account.
            </Text>
            <Text>
                Available:{" "}
                <span className="font-medium">
                    {assetToLocaleString(
                        availableFunds,
                        availableFunds.precision
                    )}
                </span>
            </Text>
            <form onSubmit={onPreview} className="space-y-3">
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
                        maxLength={12}
                        pattern="^[a-z,1-5.]{1,12}$"
                        onInvalid={validateAccountField}
                        onInput={clearErrorMessages}
                    />
                </Form.LabeledSet>
                <Form.LabeledSet label="Amount to withdraw" htmlFor="amount">
                    <div className="flex space-x-2">
                        <div className="relative flex-1">
                            <Form.Input
                                id="amount"
                                type="number"
                                inputMode="decimal"
                                min={0}
                                max={maxWithdrawal}
                                step="any"
                                required
                                value={fields.amount}
                                onChange={onChangeFields}
                                maxLength={12}
                                onWheel={amountInputPreventChangeOnScroll}
                            />
                            <div className="absolute top-3 right-2">
                                <p className="text-sm text-gray-400">
                                    {availableFunds?.symbol}
                                </p>
                            </div>
                        </div>
                        <Button type="neutral" onClick={setMaxAmount}>
                            Max
                        </Button>
                    </div>
                </Form.LabeledSet>
                {isThirdPartyWithdrawal && (
                    <Form.LabeledSet label="Memo" htmlFor="memo">
                        <Form.Input
                            id="memo"
                            type="text"
                            value={fields.memo}
                            onChange={onChangeFields}
                        />
                    </Form.LabeledSet>
                )}
                <div className="flex space-x-3">
                    <Button type="neutral" onClick={onCancel} disabled={false}>
                        Cancel
                    </Button>
                    <Button isSubmit>Preview</Button>
                </div>
            </form>
        </div>
    );
};

interface ConfirmationProps {
    formValues: WithdrawForm;
    goBack: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}

const WithdrawConfirmationStep = ({
    formValues,
    goBack,
    onConfirm,
    isLoading,
}: ConfirmationProps) => {
    const [ualAccount] = useUALAccount();
    if (!ualAccount?.accountName) return null; // TODO: dismiss modal

    const amountAsAsset = assetFromNumber(formValues.amount);
    const isThirdPartyWithdrawal = ualAccount.accountName !== formValues.to;

    return (
        <div className="space-y-4">
            <Heading>
                Confirm withdrawal{isThirdPartyWithdrawal && " and transfer"}
            </Heading>
            <Text>Please confirm the following details:</Text>
            <ul className="list-inside list-disc">
                <li>
                    <Text className="inline">To: </Text>
                    <Text className="inline" type="info">
                        {formValues.to}
                    </Text>
                    {isThirdPartyWithdrawal && (
                        <Text className="inline italic" type="note">
                            {" "}
                            via {ualAccount.accountName}
                        </Text>
                    )}
                </li>
                <li>
                    <Text className="inline">Amount: </Text>
                    <Text className="inline" type="info">
                        {assetToLocaleString(
                            amountAsAsset,
                            amountAsAsset.precision
                        )}
                    </Text>
                </li>
                {isThirdPartyWithdrawal && formValues.memo ? (
                    <li>
                        <Text className="inline">Memo: </Text>
                        <Text className="inline" type="info">
                            {formValues.memo}
                        </Text>
                    </li>
                ) : null}
            </ul>
            {isThirdPartyWithdrawal && (
                <Text>
                    These funds will first be withdrawn to your Eden EOS account
                    of record (
                    <span className="font-medium">
                        {ualAccount.accountName}
                    </span>
                    ) and then transferred from your EOS account to{" "}
                    <span className="font-medium">{formValues.to}</span>. This
                    will happen within a single transaction.
                </Text>
            )}
            <div className="flex space-x-3">
                <Button type="neutral" onClick={goBack}>
                    Make Changes
                </Button>
                <Button
                    onClick={onConfirm}
                    isLoading={isLoading}
                    disabled={isLoading}
                >
                    Withdraw
                </Button>
            </div>
        </div>
    );
};

interface SuccessProps {
    isThirdPartyTransfer: boolean;
    dismiss: () => void;
    transactionId: string;
}

const WithdrawalSuccessStep = ({
    isThirdPartyTransfer,
    dismiss,
    transactionId,
}: SuccessProps) => {
    return (
        <div className="space-y-4">
            <Heading>
                Withdrawal {isThirdPartyTransfer && "and transfer"} complete
            </Heading>
            <Text>Your transaction was successful. </Text>
            <div className="flex space-x-3">
                <Button onClick={dismiss}>Dismiss</Button>
                <Button
                    type="link"
                    isExternal
                    target="_blank"
                    href={`${blockExplorerTransactionBaseUrl}/${transactionId}`}
                >
                    View transaction
                    <OpensInNewTabIcon />
                </Button>
            </div>
        </div>
    );
};
