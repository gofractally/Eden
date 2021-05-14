import { Card, Link, RawLayout, Text, Footer } from "_app";

export const Index = () => (
    <RawLayout>
        <div className="grid grid-cols-3 gap-4">
            <Card title="Welcome to Eden" className="col-span-3 xl:col-span-2">
                <div className="space-y-3 text-gray-800">
                    <Text>
                        Eden is a community working to maximize the power and
                        independence of its members, thereby securing life,
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
                        To learn more about Eden and how you can get involved,
                        visit{" "}
                        <Link
                            href="https://edeneos.org"
                            target="_blank"
                            isExternal
                        >
                            EdenEOS.org
                        </Link>
                        .
                    </Text>
                </div>
            </Card>
            <Card
                title=""
                className="col-span-3 xl:col-span-1"
            >
            </Card>
        </div>
    </RawLayout>
);

export default Index;
