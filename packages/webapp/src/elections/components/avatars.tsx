import { Image } from "_app";

interface Props {
    showAll?: boolean;
    className?: string;
}

export const Avatars = ({ showAll, className = "" }: Props) => {
    return (
        <div className={`flex justify-between py-2 ${className}`}>
            <Image
                src="/images/avatars/avatar-1.svg"
                className={showAll ? "w-1/12" : "w-1/6 xs:w-1/12"}
            />
            <Image
                src="/images/avatars/avatar-2.svg"
                className={showAll ? "w-1/12" : "w-1/6 xs:w-1/12"}
            />
            <Image
                src="/images/avatars/avatar-3.svg"
                className={showAll ? "w-1/12" : "w-1/6 xs:w-1/12"}
            />
            <Image
                src="/images/avatars/avatar-4.svg"
                className={showAll ? "w-1/12" : "w-1/6 xs:w-1/12"}
            />
            <Image
                src="/images/avatars/avatar-5.svg"
                className={showAll ? "w-1/12" : "w-1/6 xs:w-1/12"}
            />
            <Image
                src="/images/avatars/avatar-6.svg"
                className={showAll ? "w-1/12" : "w-1/12 hidden xs:block"}
            />
            <Image
                src="/images/avatars/avatar-7.svg"
                className={showAll ? "w-1/12" : "w-1/12 hidden xs:block"}
            />
            <Image
                src="/images/avatars/avatar-8.svg"
                className={showAll ? "w-1/12" : "w-1/12 hidden sm:block"}
            />
        </div>
    );
};
