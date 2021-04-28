import { FaVideo } from "react-icons/fa";

import { Button } from "_app";
import { MemberData, MemberSocialLinks } from "members";
import { ipfsBaseUrl } from "config";

interface Props {
    member: MemberData;
}

export const NewMemberCardPreview = ({ member }: Props) => {
    return (
        <div>
            <div className="mt-4">
                <strong>Name:</strong>
                <br />
                {member.name}
            </div>

            <div className="mt-4">
                <strong>Profile Image:</strong>
                <div className="max-w-sm mr-4">
                    <img
                        src={`${ipfsBaseUrl}/${member.image}`}
                        className="object-contain rounded-md"
                    />
                </div>
            </div>

            <div className="mt-4">
                <strong>Biography:</strong>
                <br />
                {member.bio}
            </div>

            <div className="mt-4">
                <strong>Social Handles:</strong>
                <MemberSocialLinks member={member} />
            </div>

            {member.inductionVideo && (
                <div className="w-max mx-auto mt-4">
                    <Button
                        href={`${ipfsBaseUrl}/${member.inductionVideo}`}
                        target="_blank"
                        className="inline-flex"
                        icon={FaVideo}
                    >
                        Induction Ceremony
                    </Button>
                </div>
            )}
        </div>
    );
};
