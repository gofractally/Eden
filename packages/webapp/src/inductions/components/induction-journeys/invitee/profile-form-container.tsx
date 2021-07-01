import { Heading } from "_app";
import { InductionExpiresIn, InductionProfileForm } from "inductions";
import { Induction, NewMemberProfile } from "inductions/interfaces";

interface Props {
    induction: Induction;
    isReviewingProfile: boolean;
    pendingProfile?: NewMemberProfile;
    selectedProfilePhoto?: File;
    setProfilePreview: (
        profileData: NewMemberProfile,
        profilePhoto?: File
    ) => void;
}

export const InductionProfileFormContainer = ({
    induction,
    isReviewingProfile,
    pendingProfile,
    selectedProfilePhoto,
    setProfilePreview,
}: Props) => {
    return (
        <>
            <Heading size={1} className="mb-2">
                {isReviewingProfile
                    ? "Review your Eden profile"
                    : "Create your Eden profile"}
            </Heading>
            <InductionExpiresIn induction={induction} />
            <InductionProfileForm
                newMemberProfile={
                    pendingProfile || induction.new_member_profile
                }
                onSubmit={setProfilePreview}
                selectedProfilePhoto={selectedProfilePhoto}
            />
        </>
    );
};
