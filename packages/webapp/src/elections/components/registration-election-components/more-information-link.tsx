import React from "react";
import { useRouter } from "next/router";
import { AiOutlineSchedule } from "react-icons/ai";

import { ROUTES } from "_app/routes";
import { Link } from "_app/ui";

export const MoreInformationLink = () => {
    const router = useRouter();

    if (router.pathname !== "/") return null;

    return (
        <div className="flex items-center space-x-1">
            <AiOutlineSchedule className="text-blue-500" />
            <Link href={ROUTES.ELECTION.href}>More details</Link>
        </div>
    );
};

export default MoreInformationLink;
