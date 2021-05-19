import { Link } from "_app/ui";

export const Footer = () => (
    <footer className="border-t text-gray-600 dark:bg-gray-900 body-font border-gray-200 dark:border-gray-700 bg-white">
        <div className="container px-4 py-8 mx-auto flex md:items-center lg:items-start md:flex-row md:flex-nowrap flex-wrap flex-col">
            <div className="w-64 m flex-shrink-0 mx-auto text-center md:text-left">
                <a className="flex title-font font-medium items-center md:justify-start justify-center text-gray-900">
                    <span className="text-xl dark:text-gray-300">
                        We are...
                    </span>
                </a>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    A community working to maximize the power and independence
                    of its members, thereby securing life, liberty, property,
                    and justice for all.
                </p>
            </div>
            <div className="flex-grow flex flex-wrap md:pl-20 -mb-8 md:mt-0 mt-10 md:text-left text-center">
                <div className="lg:w-1/4 md:w-1/2 w-full px-4">
                    <h2 className="title-font font-medium text-gray-900 dark:text-gray-300 tracking-widest text-sm mb-3">
                        EDEN
                    </h2>
                    <nav className="list-none mb-10">
                        <li>
                            <Link href="/members">The Community</Link>
                        </li>
                        <li>
                            <Link href="/induction">Membership Dashboard</Link>
                        </li>
                        <li>
                            <Link
                                href="https://www.notion.so/edenos/Getting-an-Invite-2d38947d5be94dcb84dfa1ae48894802"
                                isExternal
                                target="_blank"
                            >
                                Get an Invite
                            </Link>
                        </li>
                    </nav>
                </div>
                <div className="lg:w-1/4 md:w-1/2 w-full px-4">
                    <h2 className="title-font font-medium text-gray-900 dark:text-gray-300 tracking-widest text-sm mb-3">
                        RESOURCES
                    </h2>
                    <nav className="list-none mb-10">
                        <li>
                            <Link
                                href="http://eden.eoscommunity.org"
                                isExternal
                                target="_blank"
                            >
                                Eden on EOS
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="https://www.notion.so/edenos/Eden-d1446453c66c4919b110dfdce20dc56f"
                                target="_blank"
                                isExternal
                            >
                                Eden Public Wiki
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="https://www.notion.so/edenos/EdenOS-Roadmap-7d75dbcf386c436c9c1738b7a3eea8f2"
                                target="_blank"
                                isExternal
                            >
                                EdenOS Roadmap
                            </Link>
                        </li>
                        <li>
                            <Link
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
