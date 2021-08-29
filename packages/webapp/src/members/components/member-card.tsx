import React from "react";
import { FaVideo } from "react-icons/fa";

import { SocialButton, ipfsUrl } from "_app";

import { MemberData } from "../interfaces";
import { MemberBio } from "./member-bio";
import { MemberSocialLinks } from "./member-social-links";
import { TokenBalance } from "./token-balance";

interface Props {
    member: MemberData;
    showBalance?: boolean;
}

export const MemberCard = ({ member, showBalance }: Props) => {
    return (
        <div
            data-testid={`member-card-${member.account}`}
            className="px-2 w-full space-y-5 py-5"
        >
            <section>{showBalance && <TokenBalance member={member} />}</section>
            <section>
                <MemberBio bio={member.bio} />
            </section>
            {member.inductionVideo && (
                <SocialButton
                    handle="View Induction Ceremony"
                    icon={FaVideo}
                    href={ipfsUrl(member.inductionVideo)}
                />
            )}
            <hr />
            <MemberSocialLinks member={member} />
        </div>
    );
};
