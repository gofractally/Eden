import { useState } from "react";
import { FiUpload } from "react-icons/fi";

import { Button, Modal, Text } from "_app";
import { ROUTES } from "_app/config";

export const VideoUploadButton = () => {
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
            <Button
                type="secondary"
                onClick={() => setIsConfirmationModalOpen(true)}
            >
                <FiUpload />
                <span className="ml-2">Upload meeting video</span>
            </Button>
            <Modal
                isOpen={isConfirmationModalOpen}
                onRequestClose={onClose}
                title="Upload and Confirmation"
            >
                <Text>
                    The election video upload serice will open a new browser
                    tab. After completing the upload, your video will be
                    recorded on the blockchain, and viewable here on this
                    device. The rest of the community will not see it until some
                    time after the election.
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
            </Modal>
        </>
    );
};
