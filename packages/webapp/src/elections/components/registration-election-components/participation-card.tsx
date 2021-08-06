import { useState } from "react";

import {
    Button,
    Container,
    ElectionParticipationStatus,
    Form,
    Heading,
    Modal,
    onError,
    queryMemberByAccountName,
    Text,
    useCurrentElection,
    useCurrentMember,
    useUALAccount,
} from "_app";

import { extractElectionDates } from "../../utils";
import { setElectionParticipation } from "../../transactions";
import { useQueryClient } from "react-query";

export const ParticipationCard = () => {
    const { data: currentMember } = useCurrentMember();
    const { data: election } = useCurrentElection();

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

    let electionDates = null;
    try {
        electionDates = extractElectionDates(election);
    } catch (e) {
        return <Text>{e.message}</Text>;
    }

    const electionDate = electionDates.startDateTime.format("LL");
    const electionStartTime = electionDates.startDateTime.format("LT");
    const electionEstimatedEndTime = electionDates.estimatedEndDateTime.format(
        "LT"
    );
    const electionParticipationLimitTime = electionDates.participationTimeLimit.format(
        "LLL"
    );

    let statusLabel = "";
    let participationActionLabel = "";
    let participationCallLabel = "";
    let participationOpenModalFn = () => {};
    let statusButton = null;

    if (currentMember) {
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
    }

    return (
        <Container>
            <Heading size={2}>{statusLabel}</Heading>
            <div className="space-y-2">
                <Text>
                    The next election will be held on {electionDate} between{" "}
                    {electionStartTime} and approximately{" "}
                    {electionEstimatedEndTime}.{" "}
                    <strong>{participationCallLabel}</strong>
                </Text>
                {statusButton}
            </div>
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

interface ModalProps {
    isOpen: boolean;
    close: () => void;
}

const ConfirmParticipationModal = ({ isOpen, close }: ModalProps) => {
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
                true
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
            title="I want to participate"
            onRequestClose={close}
            contentLabel="Election Participation Modal - Confirming Participation"
            preventScroll
            shouldCloseOnOverlayClick={!isLoading}
            shouldCloseOnEsc={!isLoading}
        >
            <form onSubmit={onSubmit}>
                <div className="space-y-4">
                    <Text>
                        You are committing to participate in the upcoming
                        election. Not showing up could impact your standing and
                        reputation in the community. If for some reason you
                        cannot participate in the election, please update your
                        status more than 24 hours from the election.
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
                            onClick={close}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            isSubmit
                            isLoading={isLoading}
                            disabled={isLoading}
                        >
                            {isLoading ? "Submitting..." : "Confirm"}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
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
