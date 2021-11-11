import React from "react";
import { FaVideo } from "react-icons/fa";

import { SocialButton, ipfsUrl, Container } from "_app";

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
        <div data-testid={`member-card-${member.account}`} className="divide-y">
            <Container>
                {showBalance && <TokenBalance account={member.account} />}
            </Container>
            <Container>
                <MemberBio bio={member.bio} />
                {member.inductionVideo && (
                    <SocialButton
                        handle="Induction Ceremony"
                        icon={FaVideo}
                        href={ipfsUrl(member.inductionVideo)}
                        className="mt-4"
                    />
                )}
            </Container>
            <Container>
                <MemberSocialLinks member={member} />
            </Container>
        </div>
    );
};
