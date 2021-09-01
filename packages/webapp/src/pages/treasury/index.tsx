import React from "react";
import {
    TreasuryDisbursementsInfo,
    TreasuryHeader,
    TreasuryDelegateLevelsInfo,
} from "treasury";

import { FluidLayout } from "_app";

export const TreasuryPage = () => {
    return (
        <FluidLayout title="Treasury">
            <div className="divide-y">
                <TreasuryHeader />
                <TreasuryDisbursementsInfo />
                {/* <TreasuryDelegateLevelsInfo /> */}
            </div>
        </FluidLayout>
    );
};

export default TreasuryPage;
