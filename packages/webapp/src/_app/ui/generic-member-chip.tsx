import { DelegateBadge, ProfileImage } from "_app/ui";
import { MemberData } from "members/interfaces";

interface Props {
    member: MemberData;
    isDelegate?: boolean;
    actionComponent?: React.ReactNode;
    contentComponent: React.ReactNode;
    footerComponent?: React.ReactNode;
    onClickChip?: (e: React.MouseEvent) => void;
    onClickProfileImage?: (e: React.MouseEvent) => void;
}

export const GenericMemberChip = ({
    member,
    isDelegate, // TODO: depend on info in member for this
    onClickChip,
    onClickProfileImage,
    actionComponent,
    contentComponent,
    footerComponent,
}: Props) => (
    <div
        className="relative p-2.5 hover:bg-gray-100 active:bg-gray-200 transition select-none cursor-pointer"
        style={{ boxShadow: "0 0 0 1px #e5e5e5" }}
        onClick={onClickChip}
    >
        <div
            className="flex items-center justify-between"
            onClick={onClickChip}
        >
            <div className="flex space-x-2.5">
                <ProfileImage
                    imageCid={member.image}
                    badge={isDelegate && <DelegateBadge size={11} />}
                    onClick={onClickProfileImage || onClickChip}
                />
                {contentComponent}
            </div>
            {actionComponent}
        </div>
        {footerComponent}
    </div>
);

export default GenericMemberChip;
