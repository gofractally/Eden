import { useState } from "react";
import { RiVideoUploadLine } from "react-icons/ri";

import {
    Text,
    Modal,
    Button,
    ButtonType,
    OpensInNewTabIcon,
    useCurrentElection,
} from "_app";
import { ROUTES } from "_app/routes";
import { ElectionStatus } from "elections";

interface Props {
    buttonType: ButtonType;
}

export const VideoUploadButton = ({ buttonType }: Props) => {
    const { data: currentElection } = useCurrentElection();

    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(
        false
    );

    const onContinue = () => {
        onClose();
        window.open(ROUTES.ELECTION_SLASH_ROUND_VIDEO_UPLOAD.href);
    };

    const onClose = () => {
        setIsConfirmationModalOpen(false);
    };

    return (
        <>
            <div className="tooltip">
                <Button
                    size="sm"
                    disabled={
                        currentElection?.electionState !==
                            ElectionStatus.Final &&
                        currentElection?.electionState !==
                            ElectionStatus.Registration
                    }
                    type={buttonType}
                    onClick={() => setIsConfirmationModalOpen(true)}
                >
                    <RiVideoUploadLine size={18} className="mr-2" />
                    Upload round recording
                    <OpensInNewTabIcon className="mb-1.5" />
                </Button>
                {currentElection?.electionState !== ElectionStatus.Final &&
                    currentElection?.electionState !==
                        ElectionStatus.Registration && (
                        <span className="tooltiptext">
                            Video uploads will be enabled once the election
                            rounds have finished
                        </span>
                    )}
            </div>
            <Modal
                isOpen={isConfirmationModalOpen}
                onRequestClose={onClose}
                title="Election video upload"
            >
                <div className="space-y-3">
                    <Text>
                        The election video upload service will open in a new
                        browser tab. It is available during the 2 weeks after
                        the beginning of the election. Any election videos must
                        be uploaded during this period.
                    </Text>
                    <Text>
                        Due to the large size of election videos, we recommend
                        uploading them from a desktop computer whenever
                        possible.
                    </Text>
                    <div className="flex space-x-3">
                        <Button type="neutral" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={onContinue}>Continue</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
