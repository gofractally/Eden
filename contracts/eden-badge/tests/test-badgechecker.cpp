#include <badgechecker/badgechecker.hpp>
#include <eosio/tester.hpp>

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

using namespace eosio;
using user_context = test_chain::user_context;

struct token_tester
{
   test_chain chain;
   user_context eosio_token = chain.as("eosio.token"_n);
   user_context alice = chain.as("alice"_n);
   user_context bob = chain.as("bob"_n);
   user_context carol = chain.as("carol"_n);

   token_tester()
   {
      chain.create_account("alice"_n);
      chain.create_account("bob"_n);
      chain.create_account("carol"_n);
      chain.create_code_account("eosio.token"_n);
      chain.set_code("eosio.token"_n, "token.wasm");
   }
};  // token_tester

TEST_CASE("Unit test", "[create]")
{
   token_tester t;
}
