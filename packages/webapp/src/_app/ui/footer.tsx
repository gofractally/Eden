import { Image, Link } from "_app/ui";
import { ROUTES } from "_app/routes";

export const Footer = () => (
    <footer className="border-t text-gray-600 body-font border-gray-200 bg-white xs:pb-0">
        <div className="px-2.5 py-5 sm:px-5 mx-auto flex md:items-center lg:items-start md:flex-row md:flex-nowrap flex-wrap flex-col">
            <div className="flex-grow flex flex-wrap">
                <div className="lg:w-1/3 md:w-1/2 w-full">
                    <h2 className="title-font font-medium text-gray-900 tracking-widest text-sm mb-1">
                        EDEN
                    </h2>
                    <nav className="list-none mb-5">
                        <li>
                            <Link
                                className="text-gray-400"
                                href={ROUTES.MEMBERS.href}
                            >
                                The Community
                            </Link>
                        </li>
                        <li>
                            <Link
                                className="text-gray-400"
                                href={ROUTES.INDUCTION.href}
                            >
                                Membership Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link
                                className="text-gray-400"
                                href="https://www.notion.so/edenos/Getting-an-Invite-2d38947d5be94dcb84dfa1ae48894802"
                                isExternal
                                target="_blank"
                            >
                                Get an Invite
                            </Link>
                        </li>
                    </nav>
                    <div className="flex items-center space-x-1 mb-1">
                        <p className="text-gray-400">
                            A community owned public good
                        </p>
                    </div>
                    <div className="flex items-center space-x-1 mb-3">
                        <p className="text-gray-400">
                            <Link
                                className="text-gray-400"
                                href="https://edenia.com"
                                isExternal
                                target="_blank"
                            >
                                web3 hosting by Edenia
                            </Link>
                        </p>
                        <Image
                            src="/images/edenia.svg"
                            alt="Edenia logo"
                            className="h-4"
                        />
                    </div>
                </div>
                <div className="lg:w-1/4 md:w-1/2 w-full">
                    <h2 className="title-font font-medium text-gray-900 tracking-widest text-sm mb-1">
                        RESOURCES
                    </h2>
                    <nav className="list-none">
                        <li>
                            <Link
                                className="text-gray-400"
                                href="https://edenelections.com"
                                isExternal
                                target="_blank"
                            >
                                Eden Election Process
                            </Link>
                        </li>
                        <li>
                            <Link
                                className="text-gray-400"
                                href="https://github.com/edenia/Eden"
                                target="_blank"
                                isExternal
                            >
                                EdenOS Github Repo
                            </Link>
                        </li>
                        <li>
                            <Link
                                className="text-gray-400"
                                href="https://spending.eden.eoscommunity.org/"
                                target="_blank"
                                isExternal
                            >
                                Spend Explorer
                            </Link>
                        </li>
                    </nav>
                </div>
            </div>
        </div>
    </footer>
);
