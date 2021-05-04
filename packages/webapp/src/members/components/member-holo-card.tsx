import dayjs from "dayjs";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import useDimensions from "react-cool-dimensions";

import { ipfsBaseUrl } from "config";
import { MemberData } from "members";

dayjs.extend(localizedFormat.default);

// TODO: 2x, 1x images for sharper images
export const MemberHoloCard = ({ member }: { member: MemberData }) => {
    const { observe, width } = useDimensions<HTMLDivElement | null>();
    return (
        <div
            className="relative rounded-xl overflow-hidden text-white"
            style={{ maxWidth: 1024 }}
            ref={observe}
        >
            <img src="/images/eden-profile-bg@3x.png" />
            <div
                className="absolute inset-0 flex flex-col justify-between"
                style={{ padding: width * 0.047 }}
            >
                <img
                    src={`${ipfsBaseUrl}/${member.image}`}
                    className="rounded-full object-cover bg-white"
                    title={member.attributions || undefined}
                    style={{
                        boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.68)",
                        width: width / 4,
                        height: width / 4,
                    }}
                />
                <div>
                    <p
                        className="py-3 lg:py-4 sm:tracking-wider leading-none sm:leading-normal"
                        style={{ fontSize: Math.max(width * 0.02, 10) }}
                    >
                        {dayjs(member.createdAt).format("L")}
                    </p>
                    <p
                        className="font-medium leading-none"
                        style={{ fontSize: width * 0.058 }}
                    >
                        {member.name}
                    </p>
                    <p
                        className="font-light sm:tracking-wide"
                        style={{ fontSize: width * 0.035 }}
                    >
                        Eden: @{member.account}
                    </p>
                </div>
            </div>
            <img
                src="/images/eden-profile-watermark@3x.png"
                className="absolute top-0 left-0"
                style={{ mixBlendMode: "overlay" }}
            />
        </div>
    );
};
