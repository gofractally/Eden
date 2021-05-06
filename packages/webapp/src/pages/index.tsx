import { Card, Link, RawLayout, Text } from "_app";

export const Index = () => (
    <RawLayout>
        <div className="grid grid-cols-3 gap-4">
            <Card title="Welcome to Eden" className="col-span-3 xl:col-span-2">
                <div className="space-y-3 text-gray-800">
                    <Text>
                        Eden is a community working to maximize the power and
                        independence of its members and thereby securing life,
                        liberty, property, and justice for all.
                    </Text>
                    <Text>
                        A team of people can be more powerful than the sum of
                        its members, but all teams need a means to reach
                        consensus, or they will fall apart. Unfortunately,
                        traditional democratic processes end up empowering
                        politicians and disempowering the people who
                        participate. EdenOS is a revolutionary new democratic
                        process that protects and enhances the independence and
                        power of those who join. When you join the Eden
                        community, you gain access to a group of people working
                        together to empower you and your family to make a bigger
                        impact in the world.
                    </Text>
                    <Text>
                        Eden is a revolutionary new experiment in governance
                        that could transform the world. We are inviting you to
                        be among the founding members of Eden - to be in the
                        "genesis block" of the most revolutionary
                        consensus-building algorithm since Bitcoin. As a
                        founding member, you will have the opportunity to define
                        the culture by inviting those closest to you into the
                        community.
                    </Text>
                    <Text>
                        As a leader, I'm sure you realize how critical the
                        initial members of any group are to its eventual
                        success. This is especially true for something as
                        revolutionary as EdenOS. Building a great culture that
                        embodies the core values of the Eden community requires
                        early leaders who share an authentic desire to see EOS
                        succeed in its mission.
                    </Text>
                    <Text>
                        If this is something you believe you'd like to be a part
                        of, or sincerely want to learn more about, please go
                        ahead and fill out this form(link) and we'll get back to
                        you to schedule a day and time for us to talk more about
                        becoming a founding member of the Eden community.
                    </Text>
                    <Text className="pt-4">
                        For all mankind,
                        <br />
                        Daniel Larimer
                    </Text>
                </div>
            </Card>
            <Card
                title="Links and resources"
                className="col-span-3 xl:col-span-1"
            >
                <ul className="space-y-1 list-disc list-inside">
                    <li>
                        <Link href="/members">The Community</Link>
                    </li>
                    <li>
                        <Link href="/induction">Membership Dashboard</Link>
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
                            href="https://github.com/eoscommunity/Eden"
                            target="_blank"
                            isExternal
                        >
                            EdenOS Github Repo
                        </Link>
                    </li>
                </ul>
            </Card>
        </div>
    </RawLayout>
);

export default Index;
