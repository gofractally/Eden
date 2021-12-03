# Auth Part 1

The native eosio account system is very flexible compared to prior chains, but it does have some limitations:

- It uses a considerable amount of RAM (~3k minimum) per account, making accounts more costly than they could be.
- It has a strong tie-in (delay) with the deprecated deferred transaction system.
- Accounts are permanent; there is no way to destroy a native account and recover its RAM.
- Any new capabilities require hard-forking changes and tend to worsen the following issue:
- The permission system is difficult to explain to new users.

It is already possible to define new account systems using non-privileged contracts, but this is rarely done:

- Contract-based authentication needs either server-pays or contract-pays to function. Server-pays requires deploying specialized infrastructure. Contract-pays doesn't exist yet on public eosio chains.
- There is no existing standard that authenticators and web apps can rely on to authenticate users to contracts.
- There is no existing standard that contracts can rely on to authenticate users to other contracts.
- There is no existing tooling for building contracts which support contract-based authentication.
- There is no existing standard that history services can rely on to interpret activity.

Contract-pays may be coming; it only needs a system contract change, which is [proposed here](https://github.com/eoscommunity/eosio.contracts/pull/1), plus standards created for it. This leaves the issue of standards for contract-auth, which this chapter starts to address, and tooling, which clsdk addresses.

## run, run_auth, and verb

`run` is a proposed standard action that acts as an entry point for executing `verbs` using an extensible authorization system (`run_auth`). It has the following ABI:

```
{
    "name": "run",
    "fields": [
        {
            "name": "auth",
            "type": "run_auth"
        },
        {
            "name": "verbs",
            "type": "verb[]"
        }
    ]
},
```

`run_auth` is a variant containing various options for authenticating users. This standard proposes the following, with more to come in the future:

```
"variants": [
    {
        "name": "run_auth",
        "types": [
            "no_auth",          // No auth provided.
            "account_auth",     // Auth using either a native eosio account,
                                // or a contract-defined account which is tied to
                                // a native eosio account.
            "signature_auth"    // Auth using a contract-defined account which is
                                // tied to a public key.
        ]
    }
]
```

`verb` is a variant which is specific to the contract. verbs are similar to actions. Here's an example from the Eden contract:

```
"variants": [
    {
        "name": "verb",
        "types": [
            ...
            "inductprofil",
            "inductvideo",
            ...
            "electvote",
            "electvideo",
            ...
        ]
    },
]
```

clsdk provides a dispatcher which implements the `run` protocol, provides an ABI generator which produces the `verb` variant, and provides definitions of `run_auth` and its related types. clsdk's dispatcher executes all verbs within the context of the original `run` action. It avoids using inline actions since these complicate authentication and increase overhead.

## Future proposals

Additional proposals should cover:

- A standard interface to contract-pays
- A standard interface for contracts to forward authentication information to each other
- A new notification system, since require_recipient does not play well with `run`

None of these proposals would require hard forks.
