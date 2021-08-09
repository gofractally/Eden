import { BiWebcam } from "react-icons/bi";
import { GoSync } from "react-icons/go";
import { Button, Container, Expander, Text } from "_app/ui";

export const SupportSegment = () => (
    <Expander
        header={
            <div className="flex justify-center items-center space-x-2">
                <GoSync size={24} className="text-gray-400" />
                <Text className="font-semibold">
                    Community Room &amp; Support
                </Text>
            </div>
        }
    >
        <Container>
            <Button size="sm">
                <BiWebcam className="mr-1" />
                Join meeting
            </Button>
        </Container>
    </Expander>
);

export default SupportSegment;
