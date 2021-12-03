# Contract Pays

A system contract change, which is [proposed here](https://github.com/eoscommunity/eosio.contracts/pull/1), can enable contract-pays on eosio chains. This document explains how the PR enables contract-pays and how contract developers may implement it.

## The Approach

Early in eosio history, some on the Eosio Developers chat discussed doing the following:

* Create an account, let's call it `provider`, with a new authority, let's call it `payforit`.
* Create a contract on that account with an action, let's call it `acceptcharge`. This action scans the transaction and aborts if `provider` is unwilling to pay for it.
* Use `linkauth` to enable `provider@payforit` to authorize `provider::acceptcharge`.
* Delegate plenty of CPU and NET to `provider`.
* Publish the private key of `provider@payforit`.

Usage:

* Anyone could use `provider@payforit`'s private key to sign a transaction.
* The only thing `provider@payforit` should authorize (see below) is `provider::acceptcharge`.
* If `provider::acceptcharge` is the first action, and that action doesn't abort the transaction, then `provider` will cover NET and CPU costs.

Attack Vectors:

* `provider@payforit` can authorize `updateauth`, allowing anyone to replace the published private key with their own, denying access to others.
* `updateauth` also would allow anyone to create a new subauthority under `payforit`, with keys of their choosing.
* `provider@payforit` can authorize `linkauth`, allowing anyone to relink `provider::acceptcharge` to the new subauthority, or to `active` or `owner`.
* `provider@payforit` can authorize `unlinkauth`, allowing anyone to disable `payforit`'s access to `provider::acceptcharge`.
* `provider@payforit` can also authorize `deleteauth`.
* Since `provider@payforit`'s authorization appears within the transaction, an attacker can set `delay` to non-0, consuming `provider`'s RAM to store deferred transactions.

## Attack Mitigation

A [system contract update](https://github.com/eoscommunity/eosio.contracts/pull/1) could block `updateauth`, `linkauth`, `unlinkauth`, and `deleteauth`. This covers most of the attack vectors.

To prevent RAM consumption attacks, `provider` must not pay for deferred transactions. The easiest way to prevent this is for `provider` to have no free RAM. Since `provider::acceptcharge` may need free RAM for tracking purposes, the contract should be on a different account than the resource provider account.

## Example Code

```c++
// This version of eosio::get_action doesn't abort when index is out of range.
std::optional<eosio::action> better_get_action(uint32_t type, uint32_t index)
{
    auto size = eosio::internal_use_do_not_use::get_action(type, index, nullptr, 0);
    if (size < 0)
        return std::nullopt;
    std::vector<char> raw(size);
    auto size2 = eosio::internal_use_do_not_use::get_action(
        type, index, raw.data(), size);
    eosio::check(size2 == size, "get_action failed");
    return eosio::unpack<eosio::action>(raw.data(), size);
}

// Examine the transaction to see if we're ok accepting the CPU and NET charges
void the_contract::acceptcharge()
{
    // type 0: context-free action
    // type 1: normal action
    for (uint32_t type = 0; type < 2; ++type)
    {
        for (uint32_t index = 0;; ++index)
        {
            auto action = better_get_action(type, index);
            if (!action)
                break;
            // Simple rule: only allow actions on this contract
            eosio::check(action->account == get_self(),
                            "This transaction has something I won't pay for");
        }
    }
}
```
