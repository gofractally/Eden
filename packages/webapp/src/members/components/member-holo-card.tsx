import dayjs from "dayjs";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import useDimensions from "react-cool-dimensions";

import { ipfsBaseUrl } from "config";
import { MemberData } from "members";

dayjs.extend(localizedFormat.default);

// TODO: 2x, 1x images for sharper images
// TODO: Do not depend on breakpoints to set sizes :/
export const MemberHoloCard = ({ member }: { member: MemberData }) => {
    const { observe, width } = useDimensions<HTMLDivElement | null>();
    return (
        <div
            className="relative rounded-xl overflow-hidden text-white"
            style={{ maxWidth: 1024 }}
            ref={observe}
        >
            <img src="/images/eden-profile-bg@3x.png" />
            <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-8 lg:p-12">
                <img
                    src={`${ipfsBaseUrl}/${member.image}`}
                    className="rounded-full object-cover bg-white"
                    style={{
                        boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.68)",
                        width: width / 4,
                        height: width / 4,
                    }}
                />
                <div>
                    <p className="text-xs sm:text-base md:text-lg lg:text-xl py-3 lg:py-4 sm:tracking-wider leading-none sm:leading-normal">
                        {dayjs(member.createdAt).format("L")}
                    </p>
                    <p className="text-xl sm:text-4xl lg:text-6xl font-medium leading-none lg:leading-tight">
                        {member.name}
                    </p>
                    <p className="text-sm sm:text-2xl lg:text-4xl font-light sm:tracking-wide">
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
