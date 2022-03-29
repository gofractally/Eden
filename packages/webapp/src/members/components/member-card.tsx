import React from "react";
import { FaVideo } from "react-icons/fa";

import { SocialButton, Container } from "_app";

import { Member } from "../interfaces";
import { MemberBio } from "./member-bio";
import { MemberSocialLinks } from "./member-social-links";
import { TokenBalance } from "./token-balance";

interface Props {
    member: Member;
    showBalance?: boolean;
}

export const MemberCard = ({ member, showBalance }: Props) => {
    return (
        <div
            data-testid={`member-card-${member.accountName}`}
            className="divide-y"
        >
            <Container>
                {showBalance && <TokenBalance account={member.accountName} />}
            </Container>
            <Container>
                <MemberBio bio={member.profile.bio} />
                {member.inductionVideo.url && (
                    <SocialButton
                        handle="Induction Ceremony"
                        icon={FaVideo}
                        href={member.inductionVideo.url}
                        className="mt-4"
                    />
                )}
            </Container>
            <Container>
                <MemberSocialLinks
                    accountName={member.accountName}
                    socialHandles={member.profile.socialHandles}
                />
            </Container>
        </div>
    );
};
