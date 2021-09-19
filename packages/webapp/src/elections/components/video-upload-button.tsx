import { useState } from "react";
// import { FiUpload } from "react-icons/fi";
import { RiVideoUploadLine } from "react-icons/ri";

import { Button, Modal, Text } from "_app";
import { ROUTES } from "_app/config";

interface Props {
    roundIndex: number;
}

export const VideoUploadButton = ({ roundIndex }: Props) => {
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
            {/* <Button
                type="secondary"
                onClick={() => setIsConfirmationModalOpen(true)}
            >
                <FiUpload />
                <span className="ml-2">Upload meeting video</span>
            </Button> */}
            <Button size="sm" onClick={() => setIsConfirmationModalOpen(true)}>
                <RiVideoUploadLine size={18} className="mr-2" />
                Upload round {roundIndex + 1} recording
            </Button>
            <Modal
                isOpen={isConfirmationModalOpen}
                onRequestClose={onClose}
                title="Upload and Confirmation"
            >
                <div className="space-y-3">
                    <Text>
                        The election video upload serice will open a new browser
                        tab. After completing the upload, your video will be
                        recorded on the blockchain, and viewable here on this
                        device. The rest of the community will not see it until
                        some time after the election.
                    </Text>
                    <Text>
                        We highly recommend uploading election videos from your
                        desktop computer.
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
