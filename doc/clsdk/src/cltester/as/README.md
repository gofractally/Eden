# as/act/trace

The `test_chain` class supports this syntax for pushing single-action transactions:

```cpp
chain.as("alice"_n).act<token::actions::transfer>(
       "alice"_n, "example"_n, s2a("300.0000 EOS"), "memo");
```

## as

`as(account)` returns an object that represents an account's active authority. `as` also supports other authorities:

```cpp
chain.as("alice"_n, "owner"_n).act<token::actions::transfer>(
       "alice"_n, "example"_n, s2a("300.0000 EOS"), "memo");
```

## act

`act<action wrapper>(action args)` creates, signs, and executes a single-action transaction. It also verifies the transaction succeeded. If it fails, it aborts the test with an error message.

The contract headers use `EOSIO_ACTIONS(...)` to define the action wrappers, e.g. `token::actions::transfer` or `example::actions::buydog`. The wrappers record the default contract name (e.g. `eosio.token`), the name of the action (e.g. `transfer`), and the argument types. This allows strong type safety. It also bypasses any need for ABIs.

`act` signs with `default_priv_key` - a well-known key used for testing (`5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3`). This key pairs with `default_pub_key` (`EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV`). Both the `create_account` and `create_code_account` methods create accounts with `default_pub_key`.

## trace

Like `act`, `trace<action wrapper>(action args)` creates, signs, and executes a single-action transaction. Unlike `act`, `trace` does not verify success. Instead, it returns the action's trace. We could display the trace:

```cpp
auto result = chain.as("alice"_n).trace<example::actions::buydog>(
    "alice"_n, "fido"_n, s2a("100.0000 OTHER"));
std::cout << format_json(result) << "\n";
```

This produces output like the following:

```json
{
    "id": "F4EE6CACEF935889E35355568C492409C6F4535565B0B801EC31352DEFAA40F3",
    "status": "hard_fail",
    "cpu_usage_us": 0,
    "net_usage_words": 0,
    "elapsed": "62",
    "net_usage": "124",
    "scheduled": false,
    "action_traces": [
        {
            "action_ordinal": 1,
            "creator_action_ordinal": 0,
            "receipt": null,
            "receiver": "example",
            "act": {
                "account": "example",
                "name": "buydog",
                "authorization": [
                    {
                        "actor": "alice",
                        "permission": "active"
                    }
                ],
                "data": [...]
            },
            "context_free": false,
            "elapsed": "34",
            "console": "",
            "account_ram_deltas": [],
            "account_disk_deltas": [],
            "except": "eosio_assert_message assertion failure (3050003)\nassertion failure with message: This contract does not deal with this token\npending console output: \n",
            "error_code": "10000000000000000000",
            "return_value": []
        }
    ],
    "account_ram_delta": null,
    "except": "eosio_assert_message assertion failure (3050003)\nassertion failure with message: This contract does not deal with this token\npending console output: \n",
    "error_code": "10000000000000000000",
    "failed_dtrx_trace": []
}
```

## expect

`expect` verifies that a transaction trace's `except` field contains within it an expected error message. If the the transaction succeeded, or the transaction failed but with a different message, then `expect` aborts the test with an error message. `expect` does a substring match.

```
expect(chain.as("alice"_n).trace<example::actions::buydog>(
            "alice"_n, "fido"_n, s2a("100.0000 OTHER")),
         "This contract does not deal with this token");
```

## with_code

The action wrappers provide a default account name that the contract is normally installed on. e.g. the token wrappers assume `eosio.token`. `with_code` overrides this default. This example sets up a fake EOS token to try to fool our example code.

```c++
// The hacker.token account runs the token contract
chain.create_code_account("hacker.token"_n);
chain.set_code("hacker.token"_n, CLSDK_CONTRACTS_DIR "token.wasm");
chain.as("hacker.token"_n)
      .with_code("hacker.token"_n)
      .act<token::actions::create>("hacker.token"_n, s2a("1000000.0000 EOS"));
chain.as("hacker.token"_n)
      .with_code("hacker.token"_n)
      .act<token::actions::issue>("hacker.token"_n, s2a("1000000.0000 EOS"), "");

// Give fake EOS to Alice
chain.as("hacker.token"_n)
      .with_code("hacker.token"_n)
      .act<token::actions::transfer>("hacker.token"_n, "alice"_n, s2a("10000.0000 EOS"), "");

// Alice transfers fake EOS to the example contract
chain.as("alice"_n)
      .with_code("hacker.token"_n)
      .act<token::actions::transfer>(
         "alice"_n, "example"_n, s2a("300.0000 EOS"), "");

// The contract didn't credit her account with the fake EOS
expect(chain.as("alice"_n).trace<example::actions::buydog>(
            "alice"_n, "fido"_n, s2a("100.0000 EOS")),
         "user does not have a balance");
```

## as() variables

`as()` returns an object which can be stored in a variable to reduce repetition.

```c++
auto alice = chain.as("alice"_n);
alice.act<token::actions::transfer>(
    "alice"_n, "example"_n, s2a("300.0000 EOS"), "");
alice.act<example::actions::buydog>(
    "alice"_n, "fido"_n, s2a("100.0000 EOS"));
alice.act<example::actions::buydog>(
    "alice"_n, "barf"_n, s2a("110.0000 EOS"));
```
