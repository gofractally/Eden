import { HiOutlineLink } from "react-icons/hi";
import { FaFacebook, FaLinkedin, FaTelegram, FaTwitter } from "react-icons/fa";
import { IoChatbubblesOutline } from "react-icons/io5";
import { GenIcon } from "react-icons/lib";

import { explorerAccountUrl, SocialButton } from "_app";
import { MemberData } from "../interfaces";

interface Props {
    member: MemberData;
}

export const MemberSocialLinks = ({ member }: Props) => (
    <div
        className="grid gap-y-2 sm:justify-between mt-5 text-sm"
        style={{ gridTemplateColumns: "repeat(auto-fill, 12.5rem)" }}
    >
        <SocialButton
            handle={member.account}
            icon={EosCommunityIcon}
            href={explorerAccountUrl(member.account)}
        />
        {member.socialHandles.eosCommunity && (
            <SocialButton
                handle={member.socialHandles.eosCommunity}
                icon={IoChatbubblesOutline}
                href={`https://eoscommunity.org/u/${member.socialHandles.eosCommunity}`}
            />
        )}
        {member.socialHandles.blog && (
            <SocialButton
                handle="Blog"
                icon={HiOutlineLink}
                href={urlify(member.socialHandles.blog)}
            />
        )}
        {member.socialHandles.twitter && (
            <SocialButton
                handle={member.socialHandles.twitter}
                icon={FaTwitter}
                href={`https://twitter.com/${member.socialHandles.twitter}`}
            />
        )}
        {member.socialHandles.telegram && (
            <SocialButton
                handle={member.socialHandles.telegram}
                icon={FaTelegram}
                href={`https://t.me/${member.socialHandles.telegram}`}
            />
        )}
        {member.socialHandles.linkedin && (
            <SocialButton
                handle={member.socialHandles.linkedin}
                icon={FaLinkedin}
                href={`https://www.linkedin.com/in/${member.socialHandles.linkedin}`}
            />
        )}
        {member.socialHandles.facebook && (
            <SocialButton
                handle={member.socialHandles.facebook}
                icon={FaFacebook}
                href={`https://facebook.com/${member.socialHandles.facebook}`}
            />
        )}
    </div>
);

const urlify = (address: string) => {
    let domainBeginIndex = 0;

    const protocolIndex = address.indexOf("//");
    if (protocolIndex > -1 && protocolIndex <= 6) {
        domainBeginIndex = protocolIndex + 2;
    }

    return `//${address.substring(domainBeginIndex)}`;
};

const EosCommunityIcon = (props: any) =>
    GenIcon({
        tag: "svg",
        attr: { viewBox: "0 0 32.2 48" },
        child: [
            {
                tag: "path",
                attr: {
                    d:
                        "M16.1 0L4.8 15.5 0 38.3 16.1 48l16.1-9.7-4.8-22.9L16.1 0zM7.4 15.9L16.1 4l8.7 11.9L16.1 42 7.4 15.9zM26 19.8l3.6 17.4-11.8 7.1L26 19.8zM2.6 37.2l3.6-17.4 8.2 24.5-11.8-7.1z",
                },
            },
        ],
    } as any)(props);
