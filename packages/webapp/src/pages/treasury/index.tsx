import React from "react";
import {
    TreasuryDisbursementsInfo,
    TreasuryHeader,
    TreasuryDelegateLevelsInfo,
} from "treasury";

import { Container, FluidLayout } from "_app";

export const TreasuryPage = () => {
    return (
        <FluidLayout title="Treasury">
            <Container>
                <TreasuryHeader />
                <TreasuryDisbursementsInfo />
                <TreasuryDelegateLevelsInfo />
            </Container>
        </FluidLayout>
    );
};

export default TreasuryPage;
