import React, { CSSProperties } from "react";
import { FaSpinner } from "react-icons/fa";

import { ipfsUrl } from "_app";

import { Image } from "./image";

interface ProfileImageProps {
    imageCid?: string;
    badge?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    size?: number;
}

export const ProfileImage = ({
    imageCid,
    badge,
    onClick,
    size = 56,
}: ProfileImageProps) => {
    const imageClass = "rounded-full object-cover shadow";
    const imageSize = { height: size, width: size };
    if (imageCid) {
        return (
            <div className="relative group" onClick={onClick}>
                <Image
                    src={ipfsUrl(imageCid)}
                    fallbackImage="/images/avatars/fallback/avatar-6.svg"
                    loaderComponent={<ImageLoader style={imageSize} />}
                    className={imageClass}
                    style={imageSize}
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition rounded-full" />
                {badge && (
                    <div className="absolute top-0 -right-0">{badge}</div>
                )}
            </div>
        );
    }
    return (
        <Image
            src={"/images/unknown-member.png"}
            className={imageClass}
            style={imageSize}
        />
    );
};

export default ProfileImage;

const ImageLoader = ({ style }: { style: CSSProperties }) => (
    <div className="flex justify-center items-center" style={style}>
        <FaSpinner size={28} className="animate-spin text-gray-400" />
    </div>
);
