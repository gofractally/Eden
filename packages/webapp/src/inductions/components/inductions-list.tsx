import NextLink from "next/link";
import dayjs from "dayjs";
import * as relativeTime from "dayjs/plugin/relativeTime";

import { getEndorsementsByInductionId } from "inductions/api";
import { getInductionStatus, getInductionStatusLabel } from "inductions/utils";
import { Heading, Link, useFetchedData } from "_app";
import * as InductionTable from "inductions/components/induction-table";
import { Endorsement, Induction, InductionStatus } from "../interfaces";

dayjs.extend(relativeTime.default);

interface InductionsListProps {
    inductions: Induction[];
    isInviter?: boolean;
}

export const InductionsList = ({
    inductions,
    isInviter,
}: InductionsListProps) => {
    return (
        <div>
            {isInviter ? (
                <ul className="mb-4 space-y-4">
                    {inductions.map((induction) => (
                        <li key={induction.id}>
                            <Link href={`/induction/${induction.id}`}>
                                Invitation sent to ${induction.invitee}
                            </Link>
                            <span className="ml-2 text-red-600 italic">
                                {getInductionStatusLabel(induction)}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <InductionsForInvitee inductions={inductions} />
            )}
        </div>
    );
};

interface InductionsForInviteeProps {
    inductions: Induction[];
}

const InductionsForInvitee = ({ inductions }: InductionsForInviteeProps) => {
    const columns: InductionTable.Column[] = [
        {
            key: "inviter",
            label: "Inviter",
        },
        {
            key: "voters",
            label: "Voters",
            className: "hidden md:flex",
        },
        {
            key: "time_remaining",
            label: "Time remaining",
            className: "hidden md:flex",
        },
        {
            key: "status",
            label: "Action/Status",
            type: InductionTable.DataTypeEnum.Action,
        },
    ];
    const data: InductionTable.Row[] = inductions.map((ind) => {
        const [allEndorsements] = useFetchedData<any>(
            getEndorsementsByInductionId,
            ind.id
        );
        const endorsers = allEndorsements
            ?.map((end: Endorsement): string => end.endorser)
            .filter((end: string) => end !== ind.inviter)
            ?.join(", ");
        const remainingTime = dayjs().to(
            dayjs(ind.created_at).add(7, "day"),
            true
        );
        return {
            key: ind.id,
            inviter: ind.inviter,
            voters: endorsers,
            time_remaining: remainingTime,
            status: <InviteeInductionStatus induction={ind} />,
        };
    });

    return (
        <>
            <Heading size={3} className="mb-2 md:mb-3">
                My invitations to Eden
            </Heading>
            <InductionTable.Table columns={columns} data={data} />
        </>
    );
};

const InviteeInductionStatus = ({ induction }: { induction: Induction }) => {
    const status = getInductionStatus(induction);
    switch (status) {
        case InductionStatus.waitingForProfile:
            return (
                <InductionActionButton
                    href={`/induction/${induction.id}`}
                    className="bg-blue-400 border-blue-400"
                    lightText
                >
                    Create my profile
                </InductionActionButton>
            );
        case InductionStatus.waitingForVideo:
            return (
                <InductionActionButton
                    href={`/induction/${induction.id}`}
                    className="bg-gray-50"
                >
                    Induction ceremony
                </InductionActionButton>
            );
        case InductionStatus.waitingForEndorsement:
            return (
                <InductionActionButton
                    href={`/induction/${induction.id}`}
                    className="bg-gray-50"
                >
                    Voting
                </InductionActionButton>
            );
        default:
            return <>Error</>;
    }
};

const InductionActionButton = ({
    href,
    className = "",
    lightText = false,
    children,
}: InductionActionButtonProps) => {
    const baseClass =
        "w-full items-center text-center py-1.5 border rounded text-sm focus:outline-none";
    const labelColor = lightText ? "text-white" : "";
    const buttonClass = `${baseClass} ${labelColor} ${className}`;
    return (
        <NextLink href={href}>
            <a className={buttonClass}>{children}</a>
        </NextLink>
    );
};

interface InductionActionButtonProps {
    href: string;
    className?: string;
    lightText?: boolean;
    children: React.ReactNode;
}
