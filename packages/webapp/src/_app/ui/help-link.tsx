import { Link } from "./link";

interface Props {
    href: string;
    target?: string;
}

export const HelpLink = ({ href, target }: Props) => (
    <Link
        isExternal
        href={href}
        target={target || "_blank"}
        className="hover:no-underline"
    >
        <div className="flex justify-center items-center h-5 w-5 rounded-full bg-gray-300 hover:bg-gray-200 border border-gray-400">
            <span className="text-gray-800 hover:text-gray-700 font-semibold text-sm">
                ?
            </span>
        </div>
    </Link>
);
