import React, { useState } from "react";
import { useQueryClient } from "react-query";
import dayjs from "dayjs";

import {
    delay,
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
    EncryptionPassword,
} from "encryption";

import { extractElectionDates } from "../../utils";
import { setElectionParticipation } from "../../transactions";
import { CurrentElection, ElectionStatus } from "elections/interfaces";
import AddToCalendar from "@culturehq/add-to-calendar";
import { CalendarEvent } from "@culturehq/add-to-calendar/dist/makeUrls";

interface Props {
    election?: CurrentElection;
}

export const ParticipationCard = ({ election }: Props) => {
    const [electionIsAboutToStart, setElectionIsAboutToStart] = useState(false);

    const [ualAccount, _, ualShowModal] = useUALAccount();
    const { data: currentMember } = useCurrentMember();

    const isProcessing = election?.electionState === ElectionStatus.InitVoters;
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
    const electionStartTime = electionDates.startDateTime.format("LT z");
    const electionParticipationLimitTime = electionDates.participationTimeLimit.format(
        "LLL z"
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

    const calendarEvent: CalendarEvent = {
        name: "Eden Election",
        details: "Join us at https://genesis.eden.eoscommunity.org/election",
        location: "Remote",
        startsAt: electionDates.startDateTime.toISOString(),
        endsAt: electionDates.estimatedEndDateTime.toISOString(),
    };

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
                        Registration is closed. Waiting for the election to
                        begin on {electionDate} at {electionStartTime}.
                    </Text>
                </>
            ) : (
                <Text>
                    The next election will be held on {electionDate} beginning
                    at {electionStartTime}.{" "}
                    <span className="font-semibold">
                        {participationCallLabel}
                    </span>
                </Text>
            )}

            <div className="flex justify-between">
                <div>
                    {!isPastElectionParticipationTimeLimit && statusButton}
                </div>
                {currentMember?.election_participation_status ===
                    ElectionParticipationStatus.InElection && (
                    <AddToCalendar event={calendarEvent} />
                )}
            </div>
            <ConfirmParticipationModal
                isOpen={showConfirmParticipationModal}
                close={() => setShowConfirmParticipationModal(false)}
                deadline={electionParticipationLimitTime}
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
    deadline?: string;
}

enum ParticipationStep {
    ConfirmParticipation,
    ConfirmParticipationSuccess,
    ConfirmPassword,
}

interface SetEncryptionPasswordAction {
    privateKey: string;
    publicKey: string;
    trx: any;
}

// TODO: Refactor to use password modals from new `usePasswordModal()` hook.
// See `meetingLink.tsx` for example implementation.
const ConfirmParticipationModal = ({ isOpen, close, deadline }: ModalProps) => {
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
                    ...setEncryptionPasswordAction.trx.actions,
                    ...transaction.actions,
                ];
            }

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("electopt trx", signedTrx);

            await delay(3000); // allow time for chain tables to update

            // invalidate current member query to update participating status
            queryClient.invalidateQueries(
                queryMemberByAccountName(ualAccount.accountName).queryKey
            );

            if (setEncryptionPasswordAction) {
                updateEncryptionPassword(
                    setEncryptionPasswordAction.publicKey,
                    setEncryptionPasswordAction.privateKey
                );
            }

            setStep(ParticipationStep.ConfirmParticipationSuccess);
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
            onRequestClose={close}
            onAfterClose={() => setStep(ParticipationStep.ConfirmParticipation)}
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
                    deadline={deadline}
                />
            )}
            {step === ParticipationStep.ConfirmParticipationSuccess && (
                <ConfirmParticipationStepSuccess close={close} />
            )}
            {step === ParticipationStep.ConfirmPassword && (
                <ConfirmPasswordStep
                    onSubmit={submitPasswordConfirmation}
                    isLoading={isLoading}
                    onCancel={close}
                    encryptionPassword={encryptionPassword}
                />
            )}
        </Modal>
    );
};

interface ConfirmParticipationStepProps {
    onSubmit: () => void;
    isLoading?: boolean;
    onCancel: () => void;
    deadline?: string;
}

const ConfirmParticipationStep = ({
    onSubmit,
    isLoading,
    onCancel,
    deadline,
}: ConfirmParticipationStepProps) => {
    const doSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={doSubmit}>
            <div className="space-y-4">
                <Heading>I want to participate</Heading>
                <Text>
                    You are committing to participate in the upcoming election.
                    Not showing up could impact your standing and reputation in
                    the community. If for some reason you cannot participate in
                    the election, please update your status before {deadline}.
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

const ConfirmParticipationStepSuccess = ({ close }: { close: () => void }) => {
    return (
        <div className="space-y-4">
            <Heading>Success!</Heading>
            <Text>
                You are committed to participate in the upcoming election.
            </Text>
            <div className="flex space-x-3">
                <Button onClick={close}>OK</Button>
            </div>
        </div>
    );
};

interface ConfirmPasswordStepProps {
    onSubmit: (
        setEncryptionPasswordAction?: SetEncryptionPasswordAction
    ) => void;
    isLoading?: boolean;
    onCancel: () => void;
    encryptionPassword: EncryptionPassword;
}

const ConfirmPasswordStep = ({
    onSubmit,
    isLoading,
    onCancel,
    encryptionPassword,
}: ConfirmPasswordStepProps) => {
    const [ualAccount] = useUALAccount();
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

    // Instantiate with encryptionPassword and keep that value so that modal doesn't flip
    // between <NewPasswordForm /> and <ReenterPasswordForm /> modes while open and saving.
    const [password] = useState(encryptionPassword);

    const doSubmitWithNewKeyTrx = async (
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

    const doSubmitWithoutTrx = async (
        publicKey: string,
        privateKey: string
    ) => {
        await onSubmit({ trx: { actions: [] }, publicKey, privateKey });
    };

    if (forgotPasswordMode || !password.publicKey) {
        // when key is not present or user clicked in forgot password
        return (
            <NewPasswordForm
                isLoading={isLoading}
                onSubmit={doSubmitWithNewKeyTrx}
                onCancel={() => {
                    setForgotPasswordMode(false);
                    onCancel();
                }}
                forgotPassword={forgotPasswordMode}
            />
        );
    } else {
        // public key present, user needs to re-enter password
        return (
            <ReenterPasswordForm
                expectedPublicKey={encryptionPassword.publicKey!}
                isLoading={isLoading}
                onSubmit={doSubmitWithoutTrx}
                onCancel={onCancel}
                onForgotPassword={() => setForgotPasswordMode(true)}
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
            await delay(3000);
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
            onRequestClose={close}
            contentLabel="Election Participation Modal - Canceling Participation"
            preventScroll
            shouldCloseOnOverlayClick={!isLoading}
            shouldCloseOnEsc={!isLoading}
        >
            <div className="space-y-4">
                <Heading>I do not want to participate in the election</Heading>
                <Text>
                    Thank you for letting us know in advance. Please confirm
                    below. If something changes, you can still update your
                    participation status more than 24 hours before the election.
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
