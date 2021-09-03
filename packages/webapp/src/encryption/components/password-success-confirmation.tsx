import { Button, Heading, Text } from "_app/ui";

interface Props {
    onDismiss: () => void;
}

export const PasswordSuccessConfirmation = ({ onDismiss }: Props) => {
    return (
        <div className="space-y-4">
            <Heading>Success!</Heading>
            <Text>Your password is all set.</Text>
            <div className="flex space-x-3">
                <Button onClick={onDismiss}>OK</Button>
            </div>
        </div>
    );
};

export default PasswordSuccessConfirmation;
