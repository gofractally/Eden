# Helper Scripts

There are a few different types of scripts in this directory. Many of them by default use WAX Testnet and accounts on WAX Testnet from the files:

-   `genesis_accounts` - 14 accounts (a subset of `genesis_accounts_long_list`)
-   `genesis_accounts_long_list` - 66 accounts

...however you can customize these scripts to use whatever chain--remote or local--you want with whatever contract and user accounts you want. These can be used for one-off actions, or together in serial to stand up communities or process inductions. Modify at will to accomplish what you want. And if you create new, helpful scripts, submit them in PRs.

## Set up a new community

Make sure you have cleos up and running and keys properly imported. If you have access, you can get WAX Testnet keys from the Notion wiki. This assumes you already have the contract account set up on chain and contracts deployed.

1. If you've previously used the contract account for tests, run the `clearall` action to reset the community.
1. `init_community.sh` creates a new community in genesis mode with the accounts you specified.
1. `genesis_profiles.sh` sets up genesis members' profiles.
1. `genesis_donate.sh` transfers the donation amount to the contract account and then executes the action to donate. This completes genesis members' inductions. (Remember, in Genesis mode, the witness/endorsement step is not required.)

## Other scripts

-   `election_opt_in_out.sh` - Bulk register members for an election
-   `complete_induction.sh` - Set up a profile for a pending member induction
-   `faucet_waxsweden.sh` - Get users more WAX Testnet tokens
-   `create_test_accounts.sh` - Creates test accounts
-   `docker_build.sh` - Build the contract using a Docker container
-   `eden_chain_runner.sh` - See [Running Eden With Ephemeral Chains Locally](https://github.com/gofractally/Eden#running-eden-with-ephemeral-chains-locally)
