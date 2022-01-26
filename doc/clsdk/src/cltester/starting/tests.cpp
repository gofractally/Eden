// cltester definitions
#include <eosio/tester.hpp>

// contract definitions
#include "testable.hpp"

// Catch2 unit testing framework. https://github.com/catchorg/Catch2
#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

using namespace eosio;

TEST_CASE("No tokens")
{
   // This starts a blockchain. This is similar to running nodeos, but forces
   // creation of a new blockchain and offers more control.
   test_chain chain;

   // Install the testable contract. Some notes:
   // * create_code_account is like create_account (used below), except it adds
   //   eosio.code to the active authority.
   // * cltester doesn't need the ABI to operate, so we don't need to set it.
   chain.create_code_account("example"_n);
   chain.set_code("example"_n, "testable.wasm");

   // Create a user account
   chain.create_account("alice"_n);

   // Alice tries to buy a dog, but has no tokens
   // This verifies the appropriate error is produced
   expect(chain.as("alice"_n).trace<example::actions::buydog>(  //
              "alice"_n, "fido"_n, s2a("0.0000 EOS")),
          "Dogs cost more than that");
}
