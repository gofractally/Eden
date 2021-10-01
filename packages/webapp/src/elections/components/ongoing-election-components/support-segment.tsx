import React from "react";
import { BiWebcam } from "react-icons/bi";
import { GoSync } from "react-icons/go";
import { ROUTES } from "_app/routes";
import { Button, Container, Expander, OpensInNewTabIcon, Text } from "_app/ui";

export const SupportSegment = () => (
    <Expander
        type="info"
        header={
            <div className="flex justify-center items-center space-x-2">
                <GoSync size={24} className="text-gray-400" />
                <Text className="font-semibold">
                    Community room &amp; live results
                </Text>
            </div>
        }
    >
        <Container className="flex justify-between sm:justify-start items-center space-x-4">
            <Button size="sm">
                <BiWebcam className="mr-1" />
                Join community room
            </Button>
            <Button
                type="link"
                href={ROUTES.ELECTION_STATS.href}
                target="_blank"
            >
                Live results <OpensInNewTabIcon />
            </Button>
        </Container>
    </Expander>
);

export default SupportSegment;
