import React, { useState } from "react";
import { FaVideo } from "react-icons/fa";

import { SocialButton } from "_app";
import { ipfsBaseUrl } from "config";

import { MemberData } from "../interfaces";
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
                        color="black"
                        size={5}
                        href={`${ipfsBaseUrl}/${member.inductionVideo}`}
                    />
                </div>
            )}
            <hr />
            <MemberSocialLinks member={member} />
        </div>
    );
};

const MemberBio = ({ bio }: { bio: string }) => {
    const [expanded, setExpanded] = useState(false);
    const TRUNCATION_THRESHOLD_IN_CHARS = 310;
    const shouldTruncate = bio.length > TRUNCATION_THRESHOLD_IN_CHARS;

    const toggleExpanded = (e: React.MouseEvent) => {
        e.preventDefault();
        setExpanded((prevState) => !prevState);
    };

    const truncatedBio =
        bio
            .substr(0, TRUNCATION_THRESHOLD_IN_CHARS)
            .split(" ")
            .slice(0, -1) // don't leave a partial word dangling
            .join(" ") + "... ";

    const renderContent = () => {
        if (!shouldTruncate) return bio;
        return (
            <>
                <span>
                    {expanded || !shouldTruncate ? bio + " " : truncatedBio}
                </span>
                {expanded ? (
                    <a
                        href="#"
                        onClick={toggleExpanded}
                        className="text-sm underline hover:text-gray-500 transition"
                    >
                        show less
                    </a>
                ) : (
                    <a
                        href="#"
                        onClick={toggleExpanded}
                        className="text-sm underline hover:text-gray-500 transition"
                    >
                        read more
                    </a>
                )}
            </>
        );
    };

    return (
        <>
            <h4 className="font-semibold text-xl">Member Profile Statement</h4>
            <p className="text-gray-900 pt-2 pl-2">{renderContent()}</p>
        </>
    );
};
