import React from "react";
import { FaVideo } from "react-icons/fa";
import Link from "next/link";

import { Button, Heading, SmallText, Text } from "_app";

import { MemberData } from "../interfaces";
import { MemberSocialLinks } from "./member-social-links";

interface Props {
    member: MemberData;
}

export const MemberCard = ({ member }: Props) => {
    return (
        <div className="px-5 py-8 mx-auto flex justify-around">
            <div className="max-w-sm mr-4">
                <img
                    src={`https://ipfs.pink.gg/ipfs/${member.image}`}
                    className="object-contain rounded-md"
                />
                <div className="text-center mt-2">
                    <Text>
                        <Link href={`/members/${member.edenAccount}`}>
                            {member.name}
                        </Link>
                    </Text>
                    <SmallText>
                        {new Date(member.createdAt).toLocaleString()}
                    </SmallText>
                </div>
            </div>
            <div className="max-w-md bg-white rounded-lg p-8 flex flex-col w-full mt-10 md:mt-0 shadow-md">
                <Heading size={2} className="mb-4">
                    {member.name}
                </Heading>
                <MemberSocialLinks member={member} />
                <Text className="mt-4">{member.bio}</Text>
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
            </div>
        </div>
    );
};
