import dayjs from "dayjs";

import {
    Button,
    Card,
    Heading,
    Text,
    useCurrentMember,
    useFormFields,
    Modal,
    Form,
} from "_app";
import { EdenMember, ElectionParticipationStatus } from "members";
import { useState } from "react";

interface Props {
    startTime: string;
}

export const RsvpBoxContainer = ({ startTime }: Props) => {
    const {
        data: edenMember,
        isLoading: isLoadingEdenMember,
    } = useCurrentMember();

    if (isLoadingEdenMember) {
        return <Text type="note">Loading Member Data for RSVP...</Text>;
    } else if (!edenMember) {
        return <Text type="note">Eden Member not found.."</Text>;
    } else {
        return <RsvpBox member={edenMember} startTime={startTime} />;
    }
};

interface RsvpBoxProps {
    member: EdenMember;
    startTime: string;
}

const RsvpBox = ({ member, startTime }: RsvpBoxProps) => {
    const parsedStartTime = dayjs(startTime);
    const rsvpLimitTime = parsedStartTime.subtract(1, "hour");
    const [showRsvpModal, setShowRsvpModal] = useState(false);

    return (
        <Card>
            <Text>The next election will be held:</Text>
            <Heading size={2}>
                {parsedStartTime.toDate().toLocaleString()}
            </Heading>
            <RsvpStatus
                status={member.election_participation_status}
                rsvpLimitTime={rsvpLimitTime.toDate().toLocaleString()}
            />
            <div className="mt-4">
                <RsvpMenu member={member} setShowRsvpModal={setShowRsvpModal} />
            </div>
            <RsvpModal
                isOpen={showRsvpModal}
                close={() => setShowRsvpModal(false)}
            />
        </Card>
    );
};

interface RsvpMenuProps {
    member: EdenMember;
    setShowRsvpModal: (val: boolean) => void;
}

const RsvpMenu = ({ member, setShowRsvpModal }: RsvpMenuProps) => {
    const participationStatus = member.election_participation_status;

    switch (participationStatus) {
        case ElectionParticipationStatus.NoDonation:
            return (
                <Button onClick={() => setShowRsvpModal(true)}>
                    Donate &amp; RSVP
                </Button>
            );
        case ElectionParticipationStatus.NotInElection:
            return <Button>Change RSVP to "Yes"</Button>;
        case ElectionParticipationStatus.InElection:
            return <Button type="danger">Change RSVP to "No"</Button>;
        default:
            return null;
    }
};

interface RsvpStatusProps {
    status: ElectionParticipationStatus;
    rsvpLimitTime: string;
}
const RsvpStatus = ({ status, rsvpLimitTime }: RsvpStatusProps) => {
    switch (status) {
        case ElectionParticipationStatus.NoDonation:
            return <Text size="lg">RSVP Required by {rsvpLimitTime}</Text>;
        case ElectionParticipationStatus.NotInElection:
            return (
                <Text size="lg" type="danger">
                    RSVP: NO - Not Participating
                </Text>
            );
        case ElectionParticipationStatus.InElection:
            return (
                <Text size="lg" type="info">
                    RSVP: YES - Participating
                </Text>
            );
        case ElectionParticipationStatus.RecentlyInducted:
            return (
                <Text>
                    Recent inducted members can't participate in the current
                    election
                </Text>
            );
    }
};

interface RsvpModalProps {
    isOpen: boolean;
    close: () => void;
}

const RsvpModal = ({ isOpen, close }: RsvpModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fields, setFields] = useFormFields({
        password: "5J91w1EQuT2o1rKaQ4gMmJebrM4Los9hRhYZ158BP9jftnBFv33",
    });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setIsLoading(false);
        setFields({ target: { id: "password", value: "" } });
        close();
    };

    return (
        <Modal
            isOpen={isOpen}
            title="Donate &amp; RSVP"
            onRequestClose={close}
            contentLabel="Donating and Confirming RSVP to Election"
            preventScroll
            shouldCloseOnOverlayClick={!isLoading}
            shouldCloseOnEsc={!isLoading}
        >
            <div className="space-y-4">
                <Text>
                    Thanks for your interest to participe in the current Eden
                    Election. To participate, you will be donating 2.00 EOS.
                </Text>
                <Text>
                    An election password was generated for you below. Copy and
                    store it in a safe place. It will be required for creating
                    and joining the Election meetings. Press submit to donate
                    and confirm your RSVP for the Current Election.
                </Text>
                <form onSubmit={onSubmit} className="space-y-3">
                    <Form.LabeledSet
                        label="Your Election Password"
                        htmlFor="password"
                        className="col-span-6 sm:col-span-3"
                    >
                        <Form.Input
                            id="password"
                            type="text"
                            required
                            value={fields.password}
                            onChange={onChangeFields}
                        />
                    </Form.LabeledSet>
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
                            disabled={!fields.password || isLoading}
                        >
                            {isLoading ? "Submitting..." : "Submit"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
