#include <eosio/tester.hpp>
#include <token/token.hpp>  // comes bundled with clsdk
#include "testable.hpp"

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
   t.set_code("example"_n, "testable.wasm");
}

// Full setup for test chain
void setup(test_chain& t)
{
   setup_token(t);
   fund_users(t);
   setup_example(t);
}

TEST_CASE("Alice Attacks")
{
   // This is the first blockchain
   test_chain chain;
   setup(chain);

   // Alice tries to get a dog for free
   // This verifies the appropriate error is produced
   expect(chain.as("alice"_n).trace<example::actions::buydog>(  //
              "alice"_n, "fido"_n, s2a("0.0000 EOS")),
          "Dogs cost more than that");

   // Alice tries to buy a dog, but hasn't transferred any tokens to the contract
   expect(chain.as("alice"_n).trace<example::actions::buydog>(  //
              "alice"_n, "fido"_n, s2a("100.0000 EOS")),
          "user does not have a balance");

   // Alice tries to transfer an unsupported token to the contract
   expect(chain.as("alice"_n).trace<token::actions::transfer>(  //
              "alice"_n, "example"_n, s2a("100.0000 OTHER"), ""),
          "This contract does not deal with this token");

   // Alice transfers the correct token
   chain.as("alice"_n).act<token::actions::transfer>(  //
       "alice"_n, "example"_n, s2a("300.0000 EOS"), "");

   // Alice tries to get sneaky with the wrong token
   expect(chain.as("alice"_n).trace<example::actions::buydog>(  //
              "alice"_n, "fido"_n, s2a("100.0000 OTHER")),
          "This contract does not deal with this token");
}

TEST_CASE("No duplicate dog names")
{
   // This is a different blockchain than used from the previous test
   test_chain chain;
   setup(chain);

   // Alice goes first
   chain.as("alice"_n).act<token::actions::transfer>(  //
       "alice"_n, "example"_n, s2a("300.0000 EOS"), "");
   chain.as("alice"_n).act<example::actions::buydog>(  //
       "alice"_n, "fido"_n, s2a("100.0000 EOS"));
   chain.as("alice"_n).act<example::actions::buydog>(  //
       "alice"_n, "barf"_n, s2a("110.0000 EOS"));

   // Bob is next
   chain.as("bob"_n).act<token::actions::transfer>(  //
       "bob"_n, "example"_n, s2a("300.0000 EOS"), "");
   chain.as("bob"_n).act<example::actions::buydog>(  //
       "bob"_n, "wolf"_n, s2a("100.0000 EOS"));

   // Sorry, Bob
   expect(chain.as("bob"_n).trace<example::actions::buydog>(  //
              "bob"_n, "fido"_n, s2a("100.0000 EOS")),
          "could not insert object, most likely a uniqueness constraint was violated");
}
