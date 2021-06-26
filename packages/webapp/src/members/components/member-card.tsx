import React from "react";
import { FaVideo } from "react-icons/fa";

import { SocialButton, ipfsUrl } from "_app";

import { MemberData } from "../interfaces";
import { MemberBio } from "./member-bio";
import { MemberSocialLinks } from "./member-social-links";

interface Props {
    member: MemberData;
}

export const MemberCard = ({ member }: Props) => {
    return (
        <div
            data-testid={`member-card-${member.account}`}
            className="px-2 flex flex-col max-w-2xl w-full"
        >
            <section className="py-5">
                <MemberBio bio={member.bio} />
            </section>
            {member.inductionVideo && (
                <div className="mb-5">
                    <SocialButton
                        handle="View Induction Ceremony"
                        icon={FaVideo}
                        href={ipfsUrl(member.inductionVideo)}
                    />
                </div>
            )}
            <hr />
            <MemberSocialLinks member={member} />
        </div>
    );
};
