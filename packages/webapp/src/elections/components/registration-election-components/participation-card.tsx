import React, { useState } from "react";
import { useQueryClient } from "react-query";
import dayjs from "dayjs";

import {
    ElectionParticipationStatus,
    onError,
    queryMemberByAccountName,
    useCountdown,
    useCurrentElection,
    useCurrentMember,
    useUALAccount,
} from "_app";
import {
    Button,
    Container,
    Form,
    Heading,
    Loader,
    Modal,
    PieStatusIndicator,
    Text,
} from "_app/ui";
import {
    setEncryptionPublicKeyTransaction,
    useEncryptionPassword,
    NewPasswordForm,
    ReenterPasswordForm,
} from "encryption";

import { extractElectionDates } from "../../utils";
import { setElectionParticipation } from "../../transactions";
import { CurrentElection, ElectionStatus } from "elections/interfaces";

interface Props {
    election?: CurrentElection;
}

export const ParticipationCard = ({ election }: Props) => {
    const [electionIsAboutToStart, setElectionIsAboutToStart] = useState(false);

    const [ualAccount, _, ualShowModal] = useUALAccount();
    const { data: currentMember } = useCurrentMember();

    const isProcessing = election?.electionState === ElectionStatus.Voters;
    useCurrentElection({
        refetchInterval: electionIsAboutToStart || isProcessing ? 5000 : false,
        refetchIntervalInBackground: true,
    });

    const [
        showConfirmParticipationModal,
        setShowConfirmParticipationModal,
    ] = useState(false);
    const [
        showCancelParticipationModal,
        setShowCancelParticipationModal,
    ] = useState(false);

    if (!election) {
        return null;
    }

    if (isProcessing) {
        return (
            <Container className="py-10">
                <Loader />
            </Container>
        );
    }

    let electionDates = null;
    try {
        electionDates = extractElectionDates(election);
    } catch (e) {
        return <Text>{e.message}</Text>;
    }

    const electionDate = electionDates.startDateTime.format("LL");
    const electionStartTime = electionDates.startDateTime.format("LT");
    const electionStartTimeZone = electionDates.startDateTime.format("z");
    const electionEstimatedEndTime = electionDates.estimatedEndDateTime.format(
        "LT"
    );
    const electionParticipationLimitTime = electionDates.participationTimeLimit.format(
        "LLL (z)"
    );

    const isPastElectionParticipationTimeLimit = dayjs().isAfter(
        electionDates.participationTimeLimit
    );

    let statusLabel = "";
    let participationActionLabel = "";
    let participationCallLabel = "";
    let participationOpenModalFn = () => {};
    let statusButton = null;

    if (!ualAccount) {
        participationCallLabel = "Sign in to participate.";
        statusButton = (
            <Button onClick={ualShowModal}>Sign in to participate</Button>
        );
    } else if (currentMember) {
        if (
            currentMember.election_participation_status !==
            ElectionParticipationStatus.InElection
        ) {
            participationOpenModalFn = () =>
                setShowConfirmParticipationModal(true);
            statusLabel = "Status: You ARE NOT participating.";
            participationActionLabel = "I want to participate";
            participationCallLabel = `You must choose "${participationActionLabel}" by ${electionParticipationLimitTime} to vote in the election.`;
        } else {
            participationOpenModalFn = () =>
                setShowCancelParticipationModal(true);
            statusLabel = "Status: You ARE participating.";
            participationActionLabel = "I do not want to participate";
            participationCallLabel = `If you cannot attend, you must choose "${participationActionLabel}" by ${electionParticipationLimitTime}.`;
        }
        statusButton = (
            <Button onClick={participationOpenModalFn}>
                {participationActionLabel}
            </Button>
        );
    } else {
        participationCallLabel = "Join Eden to participate!";
        statusButton = (
            <Button href="/induction">Join Eden to participate</Button>
        );
    }

    return (
        <Container className="space-y-2.5">
            <div className="flex justify-between">
                <Heading size={2} className="inline-block">
                    Upcoming Election
                </Heading>
                <Heading size={2} className="inline-block">
                    {electionDates.startDateTime.format("MMM D")}
                </Heading>
            </div>
            <Heading size={3}>{statusLabel}</Heading>
            {isPastElectionParticipationTimeLimit ? (
                <>
                    <ParticipationCardCountdown
                        electionDates={electionDates}
                        onEnd={() => setElectionIsAboutToStart(true)}
                        electionIsAboutToStart={electionIsAboutToStart}
                    />
                    <Text>
                        <span className="font-semibold">
                            Registration is closed. Waiting for the election to
                            begin{" "}
                        </span>
                        {electionDate} at {electionStartTime}{" "}
                        {electionStartTimeZone}, until approximately{" "}
                        {electionEstimatedEndTime}.
                    </Text>
                </>
            ) : (
                <Text>
                    The next election will be held on {electionDate} between{" "}
                    {electionStartTime} and approximately{" "}
                    {electionEstimatedEndTime} ({electionStartTimeZone}).{" "}
                    <span className="font-semibold">
                        {participationCallLabel}
                    </span>
                </Text>
            )}

            {!isPastElectionParticipationTimeLimit && statusButton}
            <ConfirmParticipationModal
                isOpen={showConfirmParticipationModal}
                close={() => setShowConfirmParticipationModal(false)}
            />
            <CancelParticipationModal
                isOpen={showCancelParticipationModal}
                close={() => setShowCancelParticipationModal(false)}
            />
        </Container>
    );
};

interface CountdownProps {
    electionDates: any;
    onEnd: () => void;
    electionIsAboutToStart: boolean;
}

const ParticipationCardCountdown = ({
    electionDates,
    onEnd,
    electionIsAboutToStart,
}: CountdownProps) => {
    const countdown = useCountdown({
        startTime: electionDates.startDateTime.subtract(1, "day").toDate(),
        endTime: electionDates.startDateTime.toDate(),
        onEnd,
    });

    return (
        <div className="flex items-center space-x-2">
            <PieStatusIndicator
                percent={countdown.percentDecimal * 100}
                size={24}
            />
            {electionIsAboutToStart ? (
                <Text className="font-semibold">
                    The election will begin momentarily
                </Text>
            ) : (
                <Text>
                    <span className="font-semibold">
                        The election starts in:
                    </span>{" "}
                    {countdown.hmmss}
                </Text>
            )}
        </div>
    );
};

interface ModalProps {
    isOpen: boolean;
    close: () => void;
}

enum ParticipationStep {
    ConfirmParticipation,
    ConfirmPassword,
}

interface SetEncryptionPasswordAction {
    privateKey: string;
    publicKey: string;
    trx: any;
}

const ConfirmParticipationModal = ({ isOpen, close }: ModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [ualAccount] = useUALAccount();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(ParticipationStep.ConfirmParticipation);
    const {
        encryptionPassword,
        updateEncryptionPassword,
    } = useEncryptionPassword();

    const onSubmit = async (
        setEncryptionPasswordAction?: SetEncryptionPasswordAction
    ) => {
        setIsLoading(true);

        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = setElectionParticipation(
                authorizerAccount,
                true
            );
            console.info("signing trx", transaction);

            if (setEncryptionPasswordAction) {
                transaction.actions = [
                    ...transaction.actions,
                    ...setEncryptionPasswordAction.trx.actions,
                ];
            }

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("electopt trx", signedTrx);

            if (setEncryptionPasswordAction) {
                updateEncryptionPassword(
                    setEncryptionPasswordAction.publicKey,
                    setEncryptionPasswordAction.privateKey
                );
            }

            // invalidate current member query to update participating status
            await new Promise((resolve) => setTimeout(resolve, 3000));
            queryClient.invalidateQueries(
                queryMemberByAccountName(ualAccount.accountName).queryKey
            );

            close();
        } catch (error) {
            console.error(error);
            onError(error);
        }

        setIsLoading(false);
    };

    const submitParticipationConfirmation = () => {
        if (!encryptionPassword.privateKey) {
            setStep(ParticipationStep.ConfirmPassword);
        } else {
            onSubmit();
        }
    };

    const submitPasswordConfirmation = async (
        setEncryptionPasswordTrx?: any
    ) => {
        await onSubmit(setEncryptionPasswordTrx);
    };

    return (
        <Modal
            isOpen={isOpen}
            title="I want to participate"
            onRequestClose={close}
            contentLabel="Election Participation Modal - Confirming Participation"
            preventScroll
            shouldCloseOnOverlayClick={
                step !== ParticipationStep.ConfirmPassword
            }
            shouldCloseOnEsc={step !== ParticipationStep.ConfirmPassword}
        >
            {step === ParticipationStep.ConfirmParticipation && (
                <ConfirmParticipationStep
                    onSubmit={submitParticipationConfirmation}
                    isLoading={isLoading}
                    onCancel={close}
                />
            )}
            {step === ParticipationStep.ConfirmPassword && (
                <ConfirmPasswordStep
                    onSubmit={submitPasswordConfirmation}
                    isLoading={isLoading}
                    onCancel={close}
                />
            )}
        </Modal>
    );
};

interface ConfirmParticipationStepProps {
    onSubmit: () => void;
    isLoading?: boolean;
    onCancel: () => void;
}

const ConfirmParticipationStep = ({
    onSubmit,
    isLoading,
    onCancel,
}: ConfirmParticipationStepProps) => {
    const doSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={doSubmit}>
            <div className="space-y-4">
                <Text>
                    You are committing to participate in the upcoming election.
                    Not showing up could impact your standing and reputation in
                    the community. If for some reason you cannot participate in
                    the election, please update your status more than 24 hours
                    prior to the start of the election.
                </Text>
                <div className="p-3 border rounded">
                    <Form.Checkbox
                        id="confirm-checkbox"
                        label="I agree to keep my participation status up to date."
                        disabled={isLoading}
                        required
                    />
                </div>
                <div className="flex space-x-3">
                    <Button
                        type="neutral"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button isSubmit isLoading={isLoading} disabled={isLoading}>
                        {isLoading ? "Submitting..." : "Confirm"}
                    </Button>
                </div>
            </div>
        </form>
    );
};

interface ConfirmPasswordStepProps {
    onSubmit: (
        setEncryptionPasswordAction?: SetEncryptionPasswordAction
    ) => void;
    isLoading?: boolean;
    onCancel: () => void;
}

const ConfirmPasswordStep = ({
    onSubmit,
    isLoading,
    onCancel,
}: ConfirmPasswordStepProps) => {
    const [ualAccount] = useUALAccount();
    const {
        encryptionPassword,
        updateEncryptionPassword,
    } = useEncryptionPassword();

    if (encryptionPassword.publicKey) {
        // public key present, user needs to re-enter password
        const doSubmit = async (
            publicKey: string,
            privateKey: string
        ): Promise<void> => {
            await onSubmit({ trx: { actions: [] }, publicKey, privateKey });
        };
        return (
            <ReenterPasswordForm
                expectedPublicKey={encryptionPassword.publicKey}
                onSubmit={doSubmit}
                onCancel={onCancel}
            />
        );
    } else {
        const doSubmit = async (
            publicKey: string,
            privateKey: string
        ): Promise<void> => {
            const authorizerAccount = ualAccount.accountName;
            const trx = setEncryptionPublicKeyTransaction(
                authorizerAccount,
                publicKey
            );
            await onSubmit({ trx, publicKey, privateKey });
        };
        return (
            <NewPasswordForm
                isLoading={isLoading}
                onSubmit={doSubmit}
                onCancel={onCancel}
            />
        );
    }
};

const CancelParticipationModal = ({ isOpen, close }: ModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [ualAccount] = useUALAccount();
    const queryClient = useQueryClient();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);

        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = setElectionParticipation(
                authorizerAccount,
                false
            );
            console.info("signing trx", transaction);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("electopt trx", signedTrx);

            // invalidate current member query to update participating status
            queryClient.invalidateQueries(
                queryMemberByAccountName(ualAccount.accountName).queryKey
            );

            close();
        } catch (error) {
            console.error(error);
            onError(error);
        }

        setIsLoading(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            title="I will not be participating"
            onRequestClose={close}
            contentLabel="Election Participation Modal - Cancelling Participation"
            preventScroll
            shouldCloseOnOverlayClick={!isLoading}
            shouldCloseOnEsc={!isLoading}
        >
            <div className="space-y-4">
                <Text>
                    Thank you for letting us know in advance. If you choose to
                    participate, you can change your status more than 24 hours
                    before the election.
                </Text>
                <div className="flex space-x-3">
                    <Button type="neutral" onClick={close} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        {isLoading ? "Submitting..." : "Confirm"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
