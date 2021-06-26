import { Card } from "_app";
import { MemberData, MemberHoloCard, MemberCard } from "members";

export const MemberCardPreview = ({
    memberData,
}: {
    memberData: MemberData;
}) => (
    <Card title="Invitee information" titleSize={2}>
        <div className="flex justify-center items-center space-y-10 xl:space-y-0 xl:space-x-10 flex-col xl:flex-row">
            <div className="max-w-xl">
                <MemberHoloCard member={memberData} inducted={false} />
            </div>
            <MemberCard member={memberData} />
        </div>
    </Card>
);
