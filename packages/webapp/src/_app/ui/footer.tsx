import { Link } from "_app/ui";
import { ROUTES } from "_app/config";

export const Footer = () => (
    <footer className="border-t text-gray-600 body-font border-gray-200 bg-white xs:pb-0">
        <div className="px-2.5 py-5 sm:px-5 mx-auto flex md:items-center lg:items-start md:flex-row md:flex-nowrap flex-wrap flex-col">
            <div className="flex-grow flex flex-wrap">
                <div className="lg:w-1/4 md:w-1/2 w-full">
                    <h2 className="title-font font-medium text-gray-900 tracking-widest text-sm mb-1">
                        EDEN
                    </h2>
                    <nav className="list-none mb-10">
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
                </div>
                <div className="lg:w-1/4 md:w-1/2 w-full">
                    <h2 className="title-font font-medium text-gray-900 tracking-widest text-sm mb-1">
                        RESOURCES
                    </h2>
                    <nav className="list-none">
                        <li>
                            <Link
                                className="text-gray-400"
                                href="https://www.notion.so/edenos/Eden-Peace-Treaty-5b15633ca09c4c6495a5b60f7bc92db2"
                                isExternal
                                target="_blank"
                            >
                                Eden Peace Treaty
                            </Link>
                        </li>
                        <li>
                            <Link
                                className="text-gray-400"
                                href="http://eden.eoscommunity.org"
                                isExternal
                                target="_blank"
                            >
                                Eden on EOS
                            </Link>
                        </li>
                        <li>
                            <Link
                                className="text-gray-400"
                                href="https://www.notion.so/edenos/Eden-d1446453c66c4919b110dfdce20dc56f"
                                target="_blank"
                                isExternal
                            >
                                Eden Public Wiki
                            </Link>
                        </li>
                        <li>
                            <Link
                                className="text-gray-400"
                                href="https://www.notion.so/edenos/EdenOS-Roadmap-7d75dbcf386c436c9c1738b7a3eea8f2"
                                target="_blank"
                                isExternal
                            >
                                EdenOS Roadmap
                            </Link>
                        </li>
                        <li>
                            <Link
                                className="text-gray-400"
                                href="https://github.com/eoscommunity/Eden"
                                target="_blank"
                                isExternal
                            >
                                EdenOS Github Repo
                            </Link>
                        </li>
                    </nav>
                </div>
            </div>
        </div>
    </footer>
);
