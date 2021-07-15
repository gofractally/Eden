import { ipfsUrl } from "_app";
import { MemberData } from "members/interfaces";

interface Props {
    member: MemberData;
    actionComponent?: React.ReactNode;
    contentComponent: React.ReactNode;
    onClickChip?: (e: React.MouseEvent) => void;
    onClickProfileImage?: (e: React.MouseEvent) => void;
}

export const GenericMemberChip = ({
    member,
    onClickChip,
    onClickProfileImage,
    actionComponent,
    contentComponent,
}: Props) => (
    <div
        className="relative flex items-center justify-between p-2.5 bg-white hover:bg-gray-100 active:bg-gray-200 transition select-none cursor-pointer"
        style={{ boxShadow: "0 0 0 1px #e5e5e5" }}
        onClick={onClickChip}
    >
        <div className="flex space-x-2.5">
            <MemberImage
                member={member}
                onClick={onClickProfileImage || onClickChip}
            />
            {contentComponent}
        </div>
        {actionComponent}
    </div>
);

interface MemberImageProps {
    member: MemberData;
    onClick?: (e: React.MouseEvent) => void;
}

const MemberImage = ({ member, onClick }: MemberImageProps) => {
    const imageClass = "rounded-full h-14 w-14 object-cover shadow";
    if (member.account && member.image) {
        return (
            <div className="relative group" onClick={onClick}>
                <img src={ipfsUrl(member.image)} className={imageClass} />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition rounded-full" />
            </div>
        );
    }
    return <img src={"/images/unknown-member.png"} className={imageClass} />;
};

export default GenericMemberChip;
