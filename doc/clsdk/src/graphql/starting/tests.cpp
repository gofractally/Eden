#include <eosio/tester.hpp>
#include <token/token.hpp>  // comes bundled with clsdk
#include "example.hpp"

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

using namespace eosio;

// Set up the token contract
void setup_token(test_chain& t)
{
   t.create_code_account("eosio.token"_n);
   t.set_code("eosio.token"_n, CLSDK_CONTRACTS_DIR "token.wasm");

   // Create and issue tokens.
   t.as("eosio.token"_n).act<token::actions::create>("eosio"_n, s2a("1000000.0000 EOS"));
   t.as("eosio.token"_n).act<token::actions::create>("eosio"_n, s2a("1000000.0000 OTHER"));
   t.as("eosio"_n).act<token::actions::issue>("eosio"_n, s2a("1000000.0000 EOS"), "");
   t.as("eosio"_n).act<token::actions::issue>("eosio"_n, s2a("1000000.0000 OTHER"), "");
}

// Create and fund user accounts
void fund_users(test_chain& t)
{
   for (auto user : {"alice"_n, "bob"_n, "jane"_n, "joe"_n})
   {
      t.create_account(user);
      t.as("eosio"_n).act<token::actions::transfer>("eosio"_n, user, s2a("10000.0000 EOS"), "");
      t.as("eosio"_n).act<token::actions::transfer>("eosio"_n, user, s2a("10000.0000 OTHER"), "");
   }
}

// Set up the example contract
void setup_example(test_chain& t)
{
   t.create_code_account("example"_n);
   t.set_code("example"_n, "example.wasm");
}

// Full setup for test chain
void setup(test_chain& t)
{
   setup_token(t);
   fund_users(t);
   setup_example(t);
}

TEST_CASE("start nodeos")
{
   // Prepare a chain
   test_chain chain;
   setup(chain);

   // cltester doesn't need ABIs, but most other tools do
   chain.set_abi("eosio.token"_n, CLSDK_CONTRACTS_DIR "token.abi");
   chain.set_abi("example"_n, "example.abi");

   // Alice buys some dogs
   chain.as("alice"_n).act<token::actions::transfer>("alice"_n, "example"_n, s2a("300.0000 EOS"),
                                                     "");
   chain.as("alice"_n).act<example::actions::buydog>("alice"_n, "fido"_n, s2a("100.0000 EOS"));
   chain.as("alice"_n).act<example::actions::buydog>("alice"_n, "barf"_n, s2a("110.0000 EOS"));

   // Make the above irreversible. This causes the transactions to
   // go into the block log.
   chain.finish_block();
   chain.finish_block();

   // Copy blocks.log into a fresh directory for nodeos to use
   eosio::execute("rm -rf example_chain");
   eosio::execute("mkdir -p example_chain/blocks");
   eosio::execute("cp " + chain.get_path() + "/blocks/blocks.log example_chain/blocks");

   // Run nodeos
   eosio::execute(
       "nodeos -d example_chain "
       "--config-dir example_config "
       "--plugin eosio::chain_api_plugin "
       "--access-control-allow-origin \"*\" "
       "--access-control-allow-header \"*\" "
       "--http-validate-host 0 "
       "--http-server-address 0.0.0.0:8888 "
       "--contracts-console "
       "-e -p eosio");
}
