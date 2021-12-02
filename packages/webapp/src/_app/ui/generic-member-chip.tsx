import { DelegateBadge, ProfileImage } from "_app/ui";

interface Props {
    imageUrl: string;
    isDelegate?: boolean;
    actionComponent?: React.ReactNode;
    contentComponent: React.ReactNode;
    footerComponent?: React.ReactNode;
    onClickChip?: (e: React.MouseEvent) => void;
    onClickProfileImage?: (e: React.MouseEvent) => void;
}

export const GenericMemberChip = ({
    imageUrl,
    isDelegate, // TODO: depend on info in member for this
    onClickChip,
    onClickProfileImage,
    actionComponent,
    contentComponent,
    footerComponent,
    ...containerProps
}: Props) => (
    <div {...containerProps}>
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
                        imageUrl={imageUrl}
                        badge={isDelegate && <DelegateBadge size={11} />}
                        onClick={onClickProfileImage || onClickChip}
                    />
                    {contentComponent}
                </div>
                {actionComponent}
            </div>
            {footerComponent}
        </div>
    </div>
);

export default GenericMemberChip;
