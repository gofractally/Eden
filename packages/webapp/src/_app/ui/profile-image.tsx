import { ipfsUrl } from "_app";

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
    if (imageCid) {
        return (
            <div className="relative group" onClick={onClick}>
                <img
                    src={ipfsUrl(imageCid)}
                    className={imageClass}
                    style={{ height: size, width: size }}
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition rounded-full" />
                {badge && (
                    <div className="absolute top-0 -right-0">{badge}</div>
                )}
            </div>
        );
    }
    return (
        <img
            src={"/images/unknown-member.png"}
            className={imageClass}
            style={{ height: size, width: size }}
        />
    );
};

export default ProfileImage;
