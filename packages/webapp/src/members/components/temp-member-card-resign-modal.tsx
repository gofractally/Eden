import React, { useState } from "react";
import { FaUserMinus, FaVideo } from "react-icons/fa";

import { Button, Modal, SocialButton, Text, ipfsUrl } from "_app";

import { MemberData } from "../interfaces";
import { MemberBio } from "./member-bio";
import { MemberSocialLinks } from "./member-social-links";

interface Props {
    member: MemberData;
}

export const MemberCard = ({ member }: Props) => {
    const [modalIsOpen, setIsOpen] = useState(false);
    return (
        <div
            data-testid={`member-card-${member.account}`}
            className="px-2 flex flex-col max-w-2xl w-full"
        >
            <section className="py-5">
                <MemberBio bio={member.bio} />
            </section>
            <div className="flex flex-col xs:flex-row justify-between mb-5">
                {member.inductionVideo && (
                    <SocialButton
                        handle="View Induction Ceremony"
                        icon={FaVideo}
                        href={ipfsUrl(member.inductionVideo)}
                    />
                )}
                <Button
                    size="sm"
                    type="dangerOutline"
                    onClick={() => setIsOpen(true)}
                    className="self-start"
                >
                    <FaUserMinus className="mr-1" />
                    Resign
                </Button>
            </div>
            <Modal
                isOpen={modalIsOpen}
                title="Resign from Eden"
                onRequestClose={() => setIsOpen(false)}
                contentLabel="Resign Modal"
                preventScroll
            >
                <div className="space-y-4">
                    <Text>
                        Are you sure you want to resign from Eden? Doing so will
                        deactivate your Eden account. You will no longer be
                        eligible to participate in elections, invite new
                        members, etc. Your NFTs will not be affected.
                    </Text>
                    <div>
                        <Button type="danger" className="mr-2">
                            Resign
                        </Button>
                        <Button type="neutral" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
            <hr />
            <MemberSocialLinks member={member} />
        </div>
    );
};
