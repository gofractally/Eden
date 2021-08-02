import { EdenMember, MemberData, MemberStats } from "members";
import { ElectionParticipationStatus, MemberStatus } from "_app/api/interfaces";

export const fixtureEdenMembers: EdenMember[] = [
    {
        name: "Eden Member 12",
        account: "edenmember12",
        nft_template_id: 84431,
        status: MemberStatus.ActiveMember,
        election_participation_status: ElectionParticipationStatus.NoDonation, // See ElectionParticipationStatus for enum values; NoDonation is kinda the default if other special cases don't apply
        election_rank: 1,
        representative: "edenmember13", // "parent" field
    },
    {
        name: "Eden Member 11",
        account: "edenmember11",
        nft_template_id: 84432,
        status: MemberStatus.ActiveMember,
        election_participation_status: ElectionParticipationStatus.NoDonation,
        election_rank: 3,
        representative: "edenmember11",
    },
    {
        name: "Eden Member 13",
        account: "edenmember13",
        nft_template_id: 84545,
        status: MemberStatus.ActiveMember,
        election_participation_status: ElectionParticipationStatus.NoDonation,
        election_rank: 2,
        representative: "edenmember11",
    },
    {
        name: "Egeon The Great",
        account: "egeon.edev",
        nft_template_id: 140784,
        status: MemberStatus.ActiveMember,
        election_participation_status: ElectionParticipationStatus.NoDonation,
        election_rank: 1,
        representative: "edenmember13",
    },
    {
        name: "Philip Pip",
        account: "pip.edev",
        nft_template_id: 140785,
        status: MemberStatus.ActiveMember,
        election_participation_status: ElectionParticipationStatus.NoDonation,
        election_rank: 1,
        representative: "edenmember11",
        encryption_key: "EOS87dKR7L6D4jZPj9XNN4H2pQavaAvWHdasFZZQCdu8Vn9ro5aDf",
        // PK for above key is: 5J6YvXREKBypzFYVC2uEcw3sLE1dUrYwGZ1yatMArJRgRCN8S81
    },
];
export const fixtureMemberData: MemberData[] = [
    {
        templateId: 84431,
        createdAt: 1621635292500,
        name: "Eden Member 12",
        image: "QmSbh7viN2Xd9g7FnccLsfhBcNsKBf7Z1Q7ZqmsDjLnvQf",
        account: "edenmember12",
        bio: "This is a test.",
        attributions: "https://rivkahfineart.com",
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        socialHandles: {
            eosCommunity: "brandonfancher",
            twitter: "brandonfancher",
            linkedin: "test",
            telegram: "brandonfancher",
            blog: "brandonfancher.com",
        },
    },
    {
        templateId: 84432,
        createdAt: 1621635329000,
        name: "Eden Member 11",
        image: "QmRSpupjxnSMQgbX1QcbYRivhkPZvHZ367N5TnizX6iopg",
        account: "edenmember11",
        bio: "This is a test.",
        attributions: "Pexel",
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        socialHandles: {
            eosCommunity: "test",
            twitter: "test",
            linkedin: "test",
            telegram: "test",
            facebook: "test",
            blog: "test.com",
        },
    },
    {
        templateId: 84545,
        createdAt: 1621959372000,
        name: "Eden Member 13",
        image: "QmRSpupjxnSMQgbX1QcbYRivhkPZvHZ367N5TnizX6iopg",
        account: "edenmember13",
        bio: "This is a test.",
        attributions: "Pexel",
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        socialHandles: {
            eosCommunity: "test2",
            twitter: "test",
            telegram: "test",
            blog: "test.com",
        },
    },
    {
        templateId: 140784,
        createdAt: 1626295594500,
        name: "Egeon The Great",
        image: "QmRSpupjxnSMQgbX1QcbYRivhkPZvHZ367N5TnizX6iopg",
        account: "egeon.edev",
        bio:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean pharetra ligula sit amet mi facilisis consectetur eu in urna. Donec eu pellentesque turpis. Donec gravida congue elit. Quisque nec facilisis purus. Suspendisse cursus justo purus, sit amet posuere quam viverra eget. Nam pharetra odio non dolor sollicitudin laoreet. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse et rutrum nisi, id porta metus. Suspendisse iaculis, urna suscipit aliquam finibus, est nisl efficitur orci, a euismod risus purus suscipit purus. Etiam accumsan eu justo nec varius. Quisque consectetur leo a sapien bibendum, vitae fringilla turpis laoreet. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum facilisis tellus sed odio dapibus, at mattis felis ultricies. Nam nulla velit, posuere nec mollis id, iaculis in sapien. Cras cursus sit amet mi commodo consectetur. Morbi sem diam, faucibus et nulla vitae, pellentesque cursus tellus.",
        attributions: "Pexels",
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        socialHandles: {
            eosCommunity: "boom",
            twitter: "boom",
            telegram: "boom",
        },
    },
    {
        templateId: 140785,
        createdAt: 1626295790000,
        name: "Philip Pip",
        image: "QmNX7qSMwkfxArtAvq3NVcYXyKVwTissoJN7EvSuFF5joU",
        account: "pip.edev",
        bio:
            "I guess I'm a little weird. I like to talk to trees and animals. That's okay though; I have more fun than most people. But we're not there yet, so we don't need to worry about it. You're meant to have fun in life. Don't hurry. Take your time and enjoy. See how easy it is to create a little tree right in your world.",
        attributions: "Pexels",
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        socialHandles: {
            eosCommunity: "pip",
            twitter: "pip",
            telegram: "pip",
        },
    },
];

export const fixtureMembersStats: MemberStats = {
    active_members: fixtureEdenMembers.filter(
        (member) => member.status === MemberStatus.ActiveMember
    ).length,
    pending_members: 0,
    completed_waiting_inductions: 0,
    // # representatives at each level, in order of Delegate Levels (bottom up),
    // ie. 3 members who never became delegates (idx=0), 1 Chief Delegates (idx=1) who didn't make it further, and 1 Head Chief (idx=2);
    ranks: [3, 1, 1],
};
