import React from "react";
import Link from "next/link";

import { SmallText } from "_app";

import { MemberData } from "../interfaces";

interface Props {
    members: MemberData[];
}

const IPFS_BASE_URL = "https://ipfs.pink.gg/ipfs/";

export const MemberSquare = ({ member }: { member: MemberData }) => (
    <div>
        <Link href={`/members/${member.edenAccount}`}>
            <a>
                <img
                    src={IPFS_BASE_URL + member.image}
                    className="max-h-44 block rounded-md mx-auto"
                />
                <div className="text-center mt-4">
                    <SmallText>{member.name}</SmallText>
                </div>
            </a>
        </Link>
    </div>
);

export const MembersGrid = ({ members }: Props) => {
    return (
        <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto p-8">
            {members.map((member, index) => (
                <MemberSquare key={index} member={member} />
            ))}
        </div>
    );
};
