import { EdenMember, MemberData, MemberStats } from "members";
import { ElectionParticipationStatus, MemberStatus } from "_app";

export const fixtureEdenMembers: EdenMember[] = [
    {
        name: "Eden Member 12",
        account: "edenmember12",
        nft_template_id: 147806,
        status: MemberStatus.ActiveMember,
        election_participation_status: ElectionParticipationStatus.NoDonation, // See ElectionParticipationStatus for enum values; NoDonation is kinda the default if other special cases don't apply
        election_rank: 1,
        representative: "edenmember13", // "parent" field
    },
    {
        name: "Eden Member 11",
        account: "edenmember11",
        nft_template_id: 147805,
        status: MemberStatus.ActiveMember,
        election_participation_status: ElectionParticipationStatus.NoDonation,
        election_rank: 3,
        representative: "edenmember11",
    },
    {
        name: "Eden Member 13",
        account: "edenmember13",
        nft_template_id: 147807,
        status: MemberStatus.ActiveMember,
        election_participation_status: ElectionParticipationStatus.NoDonation,
        election_rank: 2,
        representative: "edenmember11",
    },
    {
        name: "Egeon The Great",
        account: "egeon.edev",
        nft_template_id: 147803,
        status: MemberStatus.ActiveMember,
        election_participation_status: ElectionParticipationStatus.NoDonation,
        election_rank: 1,
        representative: "edenmember13",
    },
    {
        name: "Philip Pip",
        account: "pip.edev",
        nft_template_id: 147802,
        status: MemberStatus.ActiveMember,
        election_participation_status: ElectionParticipationStatus.NoDonation,
        election_rank: 1,
        representative: "edenmember11",
    },
];

export const fixtureMemberData: MemberData[] = [
    {
        templateId: 147800,
        name: "Alice",
        image: "QmeQX5U4mCHQWfEAe65nBmgtasKMdS18AMgwGALMQN1Xou",
        account: "alice.edev",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "alice.edev",
            twitter: "alice.edev",
            telegram: "alice.edev",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627920398500,
    },
    {
        templateId: 147802,
        name: "Philip Pip",
        image: "QmQXYwm6KTvXCGXY7a3QZk6hj5uZcYVMVr2f8xk7bB8qZG",
        account: "pip.edev",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "philip",
            twitter: "philip",
            linkedin: "philip",
            telegram: "philip",
            facebook: "philip",
            blog: "philip.com",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627920519000,
    },
    {
        templateId: 147803,
        name: "Egeon The Great",
        image: "QmVwvJGisdemkTjrMWjZiG2azY7NZW7bMZkozN5UwTs5y9",
        account: "egeon.edev",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "egeon",
            twitter: "egeon",
            linkedin: "egeon",
            telegram: "egeon",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627920637500,
    },
    {
        templateId: 147805,
        name: "Eden Member 11",
        image: "QmRSpupjxnSMQgbX1QcbYRivhkPZvHZ367N5TnizX6iopg",
        account: "edenmember11",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember11",
            twitter: "edenmember11",
            telegram: "edenmember11",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627920721500,
    },
    {
        templateId: 147806,
        name: "Eden Member 12",
        image: "QmX45iBpSVaiHzpkabHUv6Nva7kZ62LTJXaFfjbAbJBDwb",
        account: "edenmember12",
        bio:
            "\nQuisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember12",
            twitter: "edenmember12",
            telegram: "edenmember12",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627920812500,
    },
    {
        templateId: 147807,
        name: "Eden Member 13",
        image: "QmNX7qSMwkfxArtAvq3NVcYXyKVwTissoJN7EvSuFF5joU",
        account: "edenmember13",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember13",
            twitter: "edenmember13",
            telegram: "edenmember13",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627920912000,
    },
    {
        templateId: 147808,
        name: "Eden Member 14",
        image: "QmQLF2iN7MUAMxquShSCPVW6Lc9fxDZjC6vmq66u8Xib7p",
        account: "edenmember14",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember14",
            twitter: "edenmember14",
            telegram: "edenmember14",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627920992000,
    },
    {
        templateId: 147809,
        name: "Eden Member 15",
        image: "QmYv3HiVBuWXYbaDQeMRa95Xw9JoDstj5eKZwZoP2NaiZ7",
        account: "edenmember15",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember15",
            twitter: "edenmember15",
            telegram: "edenmember15",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921070000,
    },
    {
        templateId: 147810,
        name: "Eden Member 21",
        image: "Qmf53PeWmCCt6mEexbYykWcxEcq6u43KvDtsPnppMmyr6C",
        account: "edenmember21",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember21",
            twitter: "edenmember21",
            telegram: "edenmember21",
            facebook: "edenmember21",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921154000,
    },
    {
        templateId: 147811,
        name: "Eden Member 22",
        image: "Qme6oasyhdYbyigJxeDLVFpDaaoxQnnUfCLgs9RJWPkT5t",
        account: "edenmember22",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember22",
            linkedin: "edenmember22",
            telegram: "edenmember22",
            blog: "edenmember22.com",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921236000,
    },
    {
        templateId: 147812,
        name: "Eden Member 23",
        image: "QmSz21mHzEx61fdvuuc2eLbn5fnjo9YPs8PBm4vudcwnYL",
        account: "edenmember23",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember23",
            twitter: "edenmember23",
            telegram: "edenmember23",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921307000,
    },
    {
        templateId: 147813,
        name: "Eden Member 24",
        image: "QmetpJKiZj8oVvn4p88o9opRjZaQd8H9YwAknBopPnj5HW",
        account: "edenmember24",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember24",
            twitter: "edenmember24",
            telegram: "edenmember24",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921394500,
    },
    {
        templateId: 147814,
        name: "Eden Member 25",
        image: "QmXXXTd5tjEnAsicKsfet6pxXiFPCzhnh4KcS3Yr8MdRAD",
        account: "edenmember25",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember25",
            twitter: "edenmember25",
            telegram: "edenmember25",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921475500,
    },
    {
        templateId: 147815,
        name: "Eden Member 31",
        image: "QmWpH7t41TmVUVgJee6RB9h1DSvXHRwK47y9jkxJZA8m7C",
        account: "edenmember31",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember31",
            twitter: "edenmember31",
            telegram: "edenmember31",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921534500,
    },
    {
        templateId: 147816,
        name: "Eden Member 32",
        image: "QmNgzNP7amkvTP7c1fVjiSKXzAgCjpHbbgmzfAE6XY3V1s",
        account: "edenmember32",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember32",
            twitter: "edenmember32",
            telegram: "edenmember32",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921593500,
    },
    {
        templateId: 147817,
        name: "Eden Member 33",
        image: "Qmf1obHGGUieey6nHf1bsfmC2nyX4vjFyi8Bwdw7e1cGj3",
        account: "edenmember33",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember33",
            twitter: "edenmember33",
            telegram: "edenmember33",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921649500,
    },
    {
        templateId: 147818,
        name: "Eden Member 34",
        image: "QmSnD3t63agCSB1s1fVL43MbGDdHGfNatNYhkCKTnLo5hX",
        account: "edenmember34",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember34",
            twitter: "edenmember34",
            telegram: "edenmember34",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921709000,
    },
    {
        templateId: 147819,
        name: "Eden Member 35",
        image: "QmQB2tSJL14YuJbdvpEgoop7oTsxqXP8MP2Z8JLArChDhy",
        account: "edenmember35",
        bio:
            "Quisque sapien neque, varius ac lacinia in, ullamcorper eu lorem. Quisque sed felis tincidunt, cursus nulla id, egestas nibh. Nullam eu est ultricies, fringilla ipsum eu, scelerisque turpis. Donec tempus auctor semper. Aenean sagittis diam lacinia bibendum sodales. Sed condimentum orci sed molestie consequat. Phasellus id maximus eros. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse bibendum, urna at eleifend facilisis, urna augue cursus felis, sit amet facilisis elit ex sit amet turpis. Nam finibus posuere lorem ac molestie. Nam ornare ante sit amet sem porta, a sagittis metus ornare. Mauris ultricies rutrum massa a lobortis. Suspendisse semper velit quis nibh sollicitudin, vitae pharetra est consectetur. Etiam iaculis lacus eros, id vestibulum tellus vehicula vitae. Aenean ut mauris nec enim elementum mollis ut sed augue. Cras nec tortor et leo luctus hendrerit.",
        socialHandles: {
            eosCommunity: "edenmember35",
            twitter: "edenmember35",
            linkedin: "edenmember35",
            telegram: "edenmember35",
        },
        inductionVideo: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
        attributions: "Pexels",
        createdAt: 1627921766500,
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
