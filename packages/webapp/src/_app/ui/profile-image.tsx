import { ipfsUrl } from "_app";

interface ProfileImageProps {
    imageCid?: string;
    badge?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
}

export const ProfileImage = ({
    imageCid,
    badge,
    onClick,
}: ProfileImageProps) => {
    const imageClass = "rounded-full h-14 w-14 object-cover shadow";
    if (imageCid) {
        return (
            <div className="relative group" onClick={onClick}>
                <img src={ipfsUrl(imageCid)} className={imageClass} />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition rounded-full" />
                {badge && (
                    <div className="absolute top-0 -right-0">{badge}</div>
                )}
            </div>
        );
    }
    return <img src={"/images/unknown-member.png"} className={imageClass} />;
};

export default ProfileImage;
