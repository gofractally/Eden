import Link from "next/link";
import { FaSignOutAlt } from "react-icons/fa";
import { withUAL } from "ual-reactjs-renderer";

import { Button } from "_app/ui";

export const UALAccount = withUAL(({ ual }: any) => {
    return ual.activeUser ? (
        <AccountMenu ual={ual} />
    ) : (
        <Button onClick={ual.showModal}>Login</Button>
    );
});

const AccountMenu = ({ ual }: any) => {
    return (
        <div>
            <Link href={`/members/${ual.activeUser.accountName}`}>
                <a className="text-gray-200 hover:underline">
                    {ual.activeUser.accountName || "(unknown)"}
                </a>
            </Link>
            <a href="#" onClick={ual.logout} className="text-gray-500 ml-4">
                <FaSignOutAlt className="inline-block" />
            </a>
        </div>
    );
};
