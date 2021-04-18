import React from "react";
import { FaVideo } from "react-icons/fa";

import { Button, Heading, Text } from "_app";

import { MemberData } from "../interfaces";
import { MemberSocialLinks } from "./member-social-links";

interface Props {
    member: MemberData;
}

export const NewMemberCardPreview = ({ member }: Props) => {
    return (
        <div>
            <div className="mt-4">
                <strong>Name:</strong>
                <br />
                {member.name}
            </div>

            <div className="mt-4">
                <strong>Profile Image:</strong>
                <div className="max-w-sm mr-4">
                    <img
                        src={`https://ipfs.pink.gg/ipfs/${member.image}`}
                        className="object-contain rounded-md"
                    />
                </div>
            </div>

            <div className="mt-4">
                <strong>Biography:</strong>
                <br />
                {member.bio}
            </div>

            <div className="mt-4">
                <strong>Social Handles:</strong>
                <MemberSocialLinks member={member} />
            </div>

            {member.inductionVideo && (
                <div className="mx-auto">
                    <Button
                        href={`https://ipfs.video/#/ipfs/${member.inductionVideo}`}
                        target="_blank"
                        className="mt-10 inline-flex"
                        icon={FaVideo}
                    >
                        Induction Ceremony
                    </Button>
                </div>
            )}
        </div>
    );
};
