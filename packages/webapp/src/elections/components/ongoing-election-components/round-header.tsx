import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { FaCheckCircle } from "react-icons/fa";
import { GoSync } from "react-icons/go";

type RoundHeaderProps = {
    isRoundActive: boolean;
    headlineComponent: React.ReactNode;
    sublineComponent: React.ReactNode;
    children?: React.ReactNode;
};

export const RoundHeader = ({
    headlineComponent,
    sublineComponent,
    isRoundActive,
    children,
}: RoundHeaderProps) => (
    <div className="w-full flex justify-between">
        <div className="flex items-center space-x-2">
            {isRoundActive ? (
                <GoSync size={24} className="text-gray-400" />
            ) : (
                <FaCheckCircle size={22} className="ml-px text-gray-400" />
            )}
            <div>
                {headlineComponent}
                {sublineComponent}
            </div>
        </div>
        {children}
    </div>
);

export default RoundHeader;
