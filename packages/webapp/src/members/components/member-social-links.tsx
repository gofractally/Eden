import { HiOutlineLink } from "react-icons/hi";
import { FaFacebook, FaLinkedin, FaTelegram, FaTwitter } from "react-icons/fa";
import { IoChatbubblesOutline } from "react-icons/io5";

import { explorerAccountUrl, SocialButton } from "_app";
import { EosCommunityIcon } from "_app/ui/icons";

import { getValidSocialLink } from "../helpers/social-links";
import { EdenNftSocialHandles } from "nfts";

interface Props {
    accountName: string;
    socialHandles: EdenNftSocialHandles;
}

export const MemberSocialLinks = ({ accountName, socialHandles }: Props) => {
    const linkedinHandle = getValidSocialLink(socialHandles.linkedin);
    const facebookHandle = getValidSocialLink(socialHandles.facebook);
    const twitterHandle = getValidSocialLink(socialHandles.twitter);
    const telegramHandle = getValidSocialLink(socialHandles.telegram);
    return (
        <div
            className="grid gap-y-2 sm:justify-between text-sm"
            style={{ gridTemplateColumns: "repeat(auto-fill, 12.5rem)" }}
        >
            <SocialButton
                handle={accountName}
                icon={EosCommunityIcon}
                href={explorerAccountUrl(accountName)}
            />
            {socialHandles.eosCommunity && (
                <SocialButton
                    handle={socialHandles.eosCommunity}
                    icon={IoChatbubblesOutline}
                    href={`https://forums.eoscommunity.org/u/${socialHandles.eosCommunity}`}
                />
            )}
            {socialHandles.blog && (
                <SocialButton
                    handle="Website"
                    icon={HiOutlineLink}
                    href={urlify(socialHandles.blog)}
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
