import { extractElectionDates } from "elections/utils";
import React from "react";

import {
    Container,
    ElectionParticipationStatus,
    Expander,
    FluidLayout,
    RawLayout,
    Text,
    useCurrentElection,
    useCurrentMember,
    useElectionState,
    useHeadDelegate,
    useMemberGroupParticipants,
    useParticipantsInCompletedRound,
    useVoteDataRow,
} from "_app";

export const ElectionPage = () => {
    const targetRound = 1;
    const { data: loggedInMember } = useCurrentMember();

    const { data: leadRepresentative } = useHeadDelegate();

    const { data: currentElection } = useCurrentElection();

    const {
        data: participantsInCompletedRound,
    } = useParticipantsInCompletedRound(targetRound, loggedInMember);

    const { data: voteRowForLoggedInMember } = useVoteDataRow(
        loggedInMember?.account
    );

    const { data: membersInGroup } = useMemberGroupParticipants(
        loggedInMember?.account
    );

    const {
        isError: isElectionStateDataFetchError,
        data: electionState,
    } = useElectionState();

    if (isElectionStateDataFetchError) {
        return (
            <FluidLayout>
                <Text className="text-red-500">
                    Error fetching Current Election data...
                </Text>
            </FluidLayout>
        );
    }

    const electionStartDateTime = extractElectionDates(currentElection)
        .rawStartDateTime;

    if (!loggedInMember || !currentElection) {
        return (
            <FluidLayout>
                <Text size="lg">
                    Fetching Data loggedInMember: [{Boolean(loggedInMember)}],
                    rawVoteData[
                    {Boolean(voteRowForLoggedInMember)}], currentElection[
                    {Boolean(currentElection)}]...
                </Text>
                <div>
                    {!loggedInMember?.account &&
                        "The logged-in member is not part of the deployed member base. Log in as another user, eg. pip.edev, egeon.edev"}
                </div>
                [<pre>{JSON.stringify(loggedInMember, null, 2)}</pre>] [
                <pre>{JSON.stringify(currentElection, null, 2)}</pre>]
            </FluidLayout>
        );
    }

    return (
        <RawLayout title="Election">
            <Text size="sm" className="mb-8">
                Note: Data is in square brackets if it's not JSON (to show if
                something's undefined)
            </Text>
            <Text size="lg" className="bg-gray-200">
                Current Election
            </Text>
            <DataExpander title="Election Start Date/Time">
                <div>
                    <Text
                        size="lg"
                        className="mt-4"
                    >{`Case 1: >24 hours prior (Upcoming Election):`}</Text>
                    <Text size="sm">
                        Date of Next Election (currentElection.start_time):
                    </Text>
                    <pre>[{electionStartDateTime}]</pre>
                </div>
                <div>
                    <Text size="lg" className="mt-4">
                        {`Case 2: <24 hours prior (Upcoming Election):`}
                    </Text>
                    <Text size="sm">
                        Date of Next Election
                        (currentElection.election_seeder.end_time):
                    </Text>
                    <pre>[{electionStartDateTime}]</pre>
                </div>
                <div>
                    <Text size="lg" className="mt-4">
                        Case 3 (else): Election in Progress:
                    </Text>
                    <Text size="sm">
                        Date of Next Election
                        (currentElection.election_seeder.end_time):
                    </Text>
                    <pre>[{electionStartDateTime}]</pre>
                </div>
            </DataExpander>
            <DataExpander title="About Previous (completed) Election:">
                <Text size="sm">Head Chief Delegate:</Text>
                <pre>[{leadRepresentative}]</pre>
                <Text size="sm">Chief Delegates:</Text>
                <pre>[{electionState && electionState.board.toString()}]</pre>
            </DataExpander>
            <DataExpander title="About Previous (completed) Election:">
                <Text size="lg" className="mt-8">
                    RSVP Status
                </Text>
                <Text size="sm">
                    {`default is RecentlyInducted, unless there's >30 days to next election, in which case it's NoDonation`}
                </Text>
                <Text size="sm">
                    election_participation_status / RSVP: after election,
                    everyone is reset to NoDonation
                </Text>
                <pre>
                    [
                    {!loggedInMember.election_participation_status
                        ? ElectionParticipationStatus[
                              loggedInMember.election_participation_status
                          ]
                        : "<error>"}
                    ]
                </pre>
            </DataExpander>
            <DataExpander title="Who's in the current Round? -- INTRA-round group data">
                <Text>All grouping info comes from `vote` table</Text>
                <Text size="sm">
                    Who voted for whom is *only* available during the active
                    round. That info is *not* stored long-term in tables. We'll
                    need a history solution to look at the history of who voted
                    for whom. So as soon as a round is over (during an election
                    or long after), this scenario will apply.
                </Text>
                <Text size="sm">
                    And... vote info will only be available while the property
                    'electionState' is 'active'. NOTE: this 'active' field is
                    the underlying variant type. It's meta info... the first
                    field in the array-encoding we get back for table rows. See
                    code for details if interested; or be thankful you don't
                    need to know more than this note... :)
                </Text>
                Is there leaderboard / voting info available right now? ie. is
                electionState 'active'?
                <pre>[{currentElection.electionState}]</pre>
                <Text>Everything below assume `electionState === active`</Text>
                <Text>We know the *current* round from this field:</Text>
                <Text>
                    currentElectionState[active].round[{currentElection.round}]
                </Text>
                <Text>
                    If this member not in `vote` table then their participation
                    in the election is complete, and you can find their group
                    (hierarchical arrangement) data in the `member`.
                </Text>
                <Text>
                    voteRow for currently-logged-in member [
                    {loggedInMember.account}]:
                </Text>
                <pre>
                    {JSON.stringify(voteRowForLoggedInMember || {}, null, 2)}
                </pre>
                <Text>
                    if member is found in `vote` table, take their `index` and
                    search for others with `index` values that have been
                    assigned to the same group. member.index [
                    {voteRowForLoggedInMember?.index}]
                </Text>
                <Text>
                    if member is found in `vote` table, search for others in
                    their group using `useMemberGroupParticipants(), which
                    return an EdenMember[]`
                </Text>
                <pre>{JSON.stringify(membersInGroup || {}, null, 2)}</pre>
            </DataExpander>
            <DataExpander
                title="Who was in a particular previous Round? -- post-round group data"
                startExpanded={true}
            >
                <Text>The Logic:</Text>
                <Text>
                    If member isn't in the vote, table, that means they're no
                    longer participating in a round, and we'll find their group
                    data in the `members` table
                </Text>
                <Text>
                    Results from `vote` table where row is loggedInMember.name[
                    {loggedInMember.account}]
                </Text>
                <pre>
                    {JSON.stringify(voteRowForLoggedInMember || {}, null, 2)}
                </pre>
                {(true || !Boolean(voteRowForLoggedInMember)) && (
                    <>
                        <Text>
                            Since we didn't find vote data for loggedInMember...
                        </Text>
                        <Text>
                            ON HOLD: 1) **Failed Consensus** Did the group come
                            to consensus?
                        </Text>
                        <Text>
                            2.1) **Member has advanced** Is sought round lower
                            than loggedUser's election_rank, ie. has
                            loggedInUser advanced beyond that target level?
                        </Text>
                        <Text>
                            targetRound[{targetRound}],
                            loggedInUser.election_rank[
                            {loggedInMember.election_rank}]
                        </Text>
                        <Text>
                            2.2) **Member didn't advance** loggedInMember was in
                            a group that did come to consensus but
                            loggedInMember was not the one made a delegate.
                        </Text>
                        <Text>
                            Use loggedInMember.representative[
                            {loggedInMember.representative}] to find others with
                            the same representative.
                        </Text>
                        <Text>
                            commonDelegate = [2.1] loggedInMember.account[
                            {loggedInMember.account}] OR [2.2]
                            loggedInMember.representative
                        </Text>
                        <Text>
                            Then we can get this member's group info at the
                            sought round simply by querying the members table by
                            `representative`-`election_rank` to build list of
                            members in the group
                        </Text>
                        <pre>
                            {JSON.stringify(
                                participantsInCompletedRound || [],
                                null,
                                2
                            )}
                        </pre>
                    </>
                )}
                {Boolean(voteRowForLoggedInMember) && (
                    <Text>
                        loggedInUser in `vote` table; see intra-round
                        instructions above.
                    </Text>
                )}
            </DataExpander>
            <div>
                <Text size="lg" className="bg-gray-200 mt-16">
                    Original -- Raw Table Data --
                </Text>
                <DataExpander title="Current Election">
                    <pre>{JSON.stringify(currentElection, null, 2)}</pre>
                </DataExpander>
                <DataExpander title="Election State">
                    <pre>{JSON.stringify(electionState || {}, null, 2)}</pre>
                </DataExpander>
            </div>
        </RawLayout>
    );
};

interface DataExpanderProps {
    title: string;
    children: React.ReactNode;
    startExpanded?: boolean;
}

const DataExpander = ({
    title,
    startExpanded,
    children,
}: DataExpanderProps) => (
    <Expander
        header={
            <div className="flex justify-center items-center space-x-2">
                <Text className="font-semibold">{title}</Text>
            </div>
        }
        startExpanded={startExpanded}
    >
        <Container>{children}</Container>
    </Expander>
);

export default ElectionPage;
