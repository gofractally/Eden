import { HiOutlineLink } from "react-icons/hi";
import { FaFacebook, FaLinkedin, FaTelegram, FaTwitter } from "react-icons/fa";
import { IoChatbubblesOutline } from "react-icons/io5";

import { explorerAccountUrl, SocialButton } from "_app";
import { EosCommunityIcon } from "_app/ui/icons";

import { MemberData } from "../interfaces";
import { getValidSocialLink } from "../helpers/social-links";

interface Props {
    member: MemberData;
}

export const MemberSocialLinks = ({ member }: Props) => {
    const linkedinHandle = getValidSocialLink(member.socialHandles.linkedin);
    const facebookHandle = getValidSocialLink(member.socialHandles.facebook);
    const twitterHandle = getValidSocialLink(member.socialHandles.twitter);
    const telegramHandle = getValidSocialLink(member.socialHandles.telegram);
    return (
        <div
            className="grid gap-y-2 sm:justify-between text-sm"
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
                    href={`https://forums.eoscommunity.org/u/${member.socialHandles.eosCommunity}`}
                />
            )}
            {member.socialHandles.blog && (
                <SocialButton
                    handle="Website"
                    icon={HiOutlineLink}
                    href={urlify(member.socialHandles.blog)}
                />
            )}
            {twitterHandle && (
                <SocialButton
                    handle={`@${twitterHandle}`}
                    icon={FaTwitter}
                    href={`https://twitter.com/${twitterHandle}`}
                />
            )}
            {telegramHandle && (
                <SocialButton
                    handle={`@${telegramHandle}`}
                    icon={FaTelegram}
                    href={`https://t.me/${telegramHandle}`}
                />
            )}
            {linkedinHandle && (
                <SocialButton
                    handle={linkedinHandle}
                    icon={FaLinkedin}
                    href={`https://www.linkedin.com/in/${linkedinHandle}`}
                />
            )}
            {facebookHandle && (
                <SocialButton
                    handle={facebookHandle}
                    icon={FaFacebook}
                    href={`https://facebook.com/${facebookHandle}`}
                />
            )}
        </div>
    );
};

const urlify = (address: string) => {
    let domainBeginIndex = 0;

    const protocolIndex = address.indexOf("//");
    if (protocolIndex > -1 && protocolIndex <= 6) {
        domainBeginIndex = protocolIndex + 2;
    }

    return `//${address.substring(domainBeginIndex)}`;
};
