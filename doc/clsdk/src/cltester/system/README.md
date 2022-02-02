# System Contract

This example shows how to load and activate the `eosio.system` contract on a test chain. This is a simplified setup which isn't suitable for public chains. All accounts use the default public key. This doesn't activate optional features (REX, powerup, etc.). It spawns nodeos on the activated chain with 21 producers.

```c++
#include <eosio/tester.hpp>

#include <bios/bios.hpp>
#include <token/token.hpp>

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

using namespace eosio;

// Where eosio.system.wasm and eosio.system.abi live
const std::string system_path = "/path/to/built/eosio.system";

const std::vector system_accounts = {
    "eosio.bpay"_n, "eosio.names"_n,  "eosio.ram"_n,   "eosio.ramfee"_n,
    "eosio.rex"_n,  "eosio.saving"_n, "eosio.stake"_n, "eosio.vpay"_n,
};

const std::vector producers = {
    "bpaaaaaaaaaa"_n, "bpbbbbbbbbbb"_n, "bpcccccccccc"_n, "bpdddddddddd"_n, "bpeeeeeeeeee"_n,
    "bpffffffffff"_n, "bpgggggggggg"_n, "bphhhhhhhhhh"_n, "bpiiiiiiiiii"_n, "bpjjjjjjjjjj"_n,
    "bpkkkkkkkkkk"_n, "bpllllllllll"_n, "bpmmmmmmmmmm"_n, "bpnnnnnnnnnn"_n, "bpoooooooooo"_n,
    "bppppppppppp"_n, "bpqqqqqqqqqq"_n, "bprrrrrrrrrr"_n, "bpssssssssss"_n, "bptttttttttt"_n,
    "bpuuuuuuuuuu"_n,
};

TEST_CASE("Activate eosio.system")
{
   test_chain chain;

   // Create accounts
   for (auto account : system_accounts)
      chain.create_account(account);
   for (auto account : producers)
      chain.create_account(account);
   chain.create_account("whale"_n);

   // Load bios and activate features
   chain.set_code("eosio"_n, CLSDK_CONTRACTS_DIR "bios.wasm");
   bios::activate(chain, {
      // Features available in 2.0
      feature::only_link_to_existing_permission,
      feature::forward_setcode,
      feature::wtmsig_block_signatures,
      feature::replace_deferred,
      feature::no_duplicate_deferred_id,
      feature::ram_restrictions,
      feature::webauthn_key,
      feature::disallow_empty_producer_schedule,
      feature::only_bill_first_authorizer,
      feature::restrict_action_to_self,
      feature::fix_linkauth_restriction,
      feature::get_sender,

      // Features added in 3.0
      feature::blockchain_parameters,
      feature::action_return_value,
      feature::get_code_hash,
      feature::configurable_wasm_limits2,
   });

   // Create token
   chain.create_code_account("eosio.token"_n);
   chain.set_code("eosio.token"_n, CLSDK_CONTRACTS_DIR "token.wasm");
   chain.set_abi("eosio.token"_n, CLSDK_CONTRACTS_DIR "token.abi");
   chain.as("eosio.token"_n).act<token::actions::create>("eosio"_n, s2a("1000000000.0000 EOS"));
   chain.as("eosio"_n).act<token::actions::issue>("eosio"_n, s2a("1000000000.0000 EOS"), "");

   // Load and initialize system contract
   chain.set_code("eosio"_n, system_path + "/eosio.system.wasm");
   chain.set_abi("eosio"_n, system_path + "/eosio.system.abi");
   chain.transact({action{{{"eosio"_n, "active"_n}},
                          "eosio"_n,
                          "init"_n,
                          std::tuple{varuint32(0), symbol("EOS", 4)}}});

   // Register producers
   for (auto prod : producers)
   {
      chain.transact({action{{{prod, "active"_n}},
                             "eosio"_n,
                             "regproducer"_n,
                             std::tuple{prod, chain.default_pub_key, std::string{}, 0}}});
   }

   // Whale activates system contract by voting
   chain.as("eosio"_n).act<token::actions::transfer>("eosio"_n, "whale"_n,
                                                     s2a("500000000.0000 EOS"), "");
   chain.transact({action{{{"whale"_n, "active"_n}},
                          "eosio"_n,
                          "buyrambytes"_n,
                          std::tuple{"whale"_n, "whale"_n, 10000}}});
   chain.transact({action{{{"whale"_n, "active"_n}},
                          "eosio"_n,
                          "delegatebw"_n,
                          std::tuple{"whale"_n, "whale"_n, s2a("75000000.0000 EOS"),
                                     s2a("75000000.0000 EOS"), false}}});
   chain.transact({action{{{"whale"_n, "active"_n}},
                          "eosio"_n,
                          "voteproducer"_n,
                          std::tuple{"whale"_n, ""_n, producers}}});

   // Run nodeos
   chain.finish_block();
   chain.finish_block();
   eosio::execute("rm -rf example_chain");
   eosio::execute("mkdir -p example_chain/blocks");
   eosio::execute("cp " + chain.get_path() + "/blocks/blocks.log example_chain/blocks");
   eosio::execute(
       "nodeos -d example_chain "
       "--config-dir example_config "
       "--plugin eosio::chain_api_plugin "
       "--access-control-allow-origin \"*\" "
       "--access-control-allow-header \"*\" "
       "--http-validate-host 0 "
       "--http-server-address 0.0.0.0:8888 "
       "--contracts-console "
       "-e -p eosio "
       "-p bpaaaaaaaaaa -p bpbbbbbbbbbb -p bpcccccccccc -p bpdddddddddd -p bpeeeeeeeeee "
       "-p bpffffffffff -p bpgggggggggg -p bphhhhhhhhhh -p bpiiiiiiiiii -p bpjjjjjjjjjj "
       "-p bpkkkkkkkkkk -p bpllllllllll -p bpmmmmmmmmmm -p bpnnnnnnnnnn -p bpoooooooooo "
       "-p bppppppppppp -p bpqqqqqqqqqq -p bprrrrrrrrrr -p bpssssssssss -p bptttttttttt "
       "-p bpuuuuuuuuuu");
}
```
