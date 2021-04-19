#include <eosio/tester.hpp>
#include <token/token.hpp>

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

using namespace eosio;
namespace actions = token::actions;
using std::string;
using account = token::contract::account;
using currency_stats = token::contract::currency_stats;
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

   auto get_stats(symbol_code sym_code)
   {
      token::contract::stats statstable("eosio.token"_n, sym_code.raw());
      return statstable.get(sym_code.raw());
   }

   std::optional<account> get_account_optional(name owner, symbol_code sym_code)
   {
      token::contract::accounts accountstable("eosio.token"_n, owner.value);
      auto it = accountstable.find(sym_code.raw());
      if (it != accountstable.end())
         return *it;
      else
         return {};
   }
};  // token_tester

TEST_CASE("Create a token", "[create]")
{
   token_tester t;

   t.eosio_token.act<actions::create>("alice"_n, s2a("1000.000 TKN"));
   REQUIRE(t.get_stats(symbol_code{"TKN"}) ==  //
           (currency_stats{
               .supply = s2a("0.000 TKN"),
               .max_supply = s2a("1000.000 TKN"),
               .issuer = "alice"_n,
           }));
}

TEST_CASE("Create a token with negative max supply", "[create_negative_max_supply]")
{
   token_tester t;
   expect(t.eosio_token.trace<actions::create>("alice"_n, s2a("-1000.000 TKN")),
          "max-supply must be positive");
}

TEST_CASE("Create token with a symbol that already exists", "[symbol_already_exists]")
{
   token_tester t;

   t.eosio_token.act<actions::create>("alice"_n, s2a("1000 TKN"));
   REQUIRE(t.get_stats(symbol_code{"TKN"}) ==  //
           (currency_stats{
               .supply = s2a("0 TKN"),
               .max_supply = s2a("1000 TKN"),
               .issuer = "alice"_n,
           }));
   expect(t.eosio_token.trace<actions::create>("alice"_n, s2a("100 TKN")),
          "token with symbol already exists");
}

TEST_CASE("Create a token whose max supply is to large", "[create_max_supply]")
{
   token_tester t;

   t.eosio_token.act<actions::create>("alice"_n, s2a("4611686018427387903 TKN"));
   REQUIRE(t.get_stats(symbol_code{"TKN"}) ==  //
           (currency_stats{
               .supply = s2a("0 TKN"),
               .max_supply = s2a("4611686018427387903 TKN"),
               .issuer = "alice"_n,
           }));

   auto too_big = s2a("4611686018427387903 NKT");
   ++too_big.amount;
   expect(t.eosio_token.trace<actions::create>("alice"_n, too_big), "invalid supply");
}

TEST_CASE("Create a token whose precision is too high", "[precision_too_high]")
{
   token_tester t;

   t.eosio_token.act<actions::create>("alice"_n, asset{1, symbol{"TKN", 18}});
   REQUIRE(t.get_stats(symbol_code{"TKN"}) ==  //
           (currency_stats{
               .supply = s2a("0.000000000000000000 TKN"),
               .max_supply = s2a("0.000000000000000001 TKN"),
               .issuer = "alice"_n,
           }));

   // eosio.token fails to check precision. Verify this broken behavior is still present.
   t.eosio_token.act<actions::create>("alice"_n, asset{1, symbol{"NKT", 50}});
}

TEST_CASE("Test issuing a token", "[issue_tests]")
{
   token_tester t;

   t.eosio_token.act<actions::create>("alice"_n, s2a("1000.000 TKN"));
   t.alice.act<actions::issue>("alice"_n, s2a("500.000 TKN"), "hola");
   REQUIRE(t.get_stats(symbol_code{"TKN"}) ==  //
           (currency_stats{
               .supply = s2a("500.000 TKN"),
               .max_supply = s2a("1000.000 TKN"),
               .issuer = "alice"_n,
           }));
   REQUIRE(token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"TKN"}) ==
           s2a("500.000 TKN"));
   expect(t.alice.trace<actions::issue>("alice"_n, s2a("500.001 TKN"), "hola"),
          "quantity exceeds available supply");
   expect(t.alice.trace<actions::issue>("alice"_n, s2a("-1.000 TKN"), "hola"),
          "must issue positive quantity");
   t.alice.act<actions::issue>("alice"_n, s2a("1.000 TKN"), "hola");
}

TEST_CASE("Retire tokens", "[retire_tests]")
{
   token_tester t;

   t.eosio_token.act<actions::create>("alice"_n, s2a("1000.000 TKN"));
   t.alice.act<actions::issue>("alice"_n, s2a("500.000 TKN"), "hola");
   REQUIRE(t.get_stats(symbol_code{"TKN"}) ==  //
           (currency_stats{
               .supply = s2a("500.000 TKN"),
               .max_supply = s2a("1000.000 TKN"),
               .issuer = "alice"_n,
           }));

   REQUIRE(token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"TKN"}) ==
           s2a("500.000 TKN"));
   t.alice.act<actions::retire>(s2a("200.000 TKN"), "hola");

   REQUIRE(t.get_stats(symbol_code{"TKN"}) ==  //
           (currency_stats{
               .supply = s2a("300.000 TKN"),
               .max_supply = s2a("1000.000 TKN"),
               .issuer = "alice"_n,
           }));
   REQUIRE(token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"TKN"}) ==
           s2a("300.000 TKN"));

   // should fail to retire more than current balance
   expect(t.alice.trace<actions::retire>(s2a("500.000 TKN"), "hola"), "overdrawn balance");

   t.alice.act<actions::transfer>("alice"_n, "bob"_n, s2a("200.000 TKN"), "hola");
   // should fail to retire since tokens are not on the issuer's balance
   expect(t.alice.trace<actions::retire>(s2a("300.000 TKN"), "hola"), "overdrawn balance");
   // transfer tokens back
   t.bob.act<actions::transfer>("bob"_n, "alice"_n, s2a("200.000 TKN"), "hola");

   t.alice.act<actions::retire>(s2a("300.000 TKN"), "hola");
   REQUIRE(t.get_stats(symbol_code{"TKN"}) ==  //
           (currency_stats{
               .supply = s2a("0.000 TKN"),
               .max_supply = s2a("1000.000 TKN"),
               .issuer = "alice"_n,
           }));

   REQUIRE(token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"TKN"}) ==
           s2a("0.000 TKN"));

   // trying to retire tokens with zero balance
   expect(t.alice.trace<actions::retire>(s2a("1.000 TKN"), "hola"), "overdrawn balance");
}

TEST_CASE("Transfer tokens", "[transfer_tests]")
{
   token_tester t;

   t.eosio_token.act<actions::create>("alice"_n, s2a("1000 CERO"));
   t.alice.act<actions::issue>("alice"_n, s2a("1000 CERO"), "hola");

   REQUIRE(t.get_stats(symbol_code{"CERO"}) ==  //
           (currency_stats{
               .supply = s2a("1000 CERO"),
               .max_supply = s2a("1000 CERO"),
               .issuer = "alice"_n,
           }));

   REQUIRE(token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"CERO"}) ==
           s2a("1000 CERO"));
   t.alice.act<actions::transfer>("alice"_n, "bob"_n, s2a("300 CERO"), "hola");
   REQUIRE(token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"CERO"}) ==
           s2a("700 CERO"));
   REQUIRE(token::contract::get_balance("eosio.token"_n, "bob"_n, symbol_code{"CERO"}) ==
           s2a("300 CERO"));

   expect(t.alice.trace<actions::transfer>("alice"_n, "bob"_n, s2a("701 CERO"), "hola"),
          "overdrawn balance");
   expect(t.alice.trace<actions::transfer>("alice"_n, "bob"_n, s2a("-1000 CERO"), "hola"),
          "must transfer positive quantity");
}

TEST_CASE("Open token balance", "[open_tests]")
{
   token_tester t;

   t.eosio_token.act<actions::create>("alice"_n, s2a("1000 CERO"));

   REQUIRE(t.get_account_optional("alice"_n, symbol_code("CERO")) == std::nullopt);
   expect(t.alice.trace<actions::issue>("bob"_n, s2a("1000 CERO"), ""),
          "tokens can only be issued to issuer account");
   t.alice.act<actions::issue>("alice"_n, s2a("1000 CERO"), "issue");

   REQUIRE(token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"CERO"}) ==
           s2a("1000 CERO"));
   REQUIRE(t.get_account_optional("bob"_n, symbol_code("CERO")) == std::nullopt);

   expect(t.alice.trace<actions::open>("nonexistent"_n, symbol{"CERO", 0}, "alice"_n),
          "owner account does not exist");
   t.alice.act<actions::open>("bob"_n, symbol{"CERO", 0}, "alice"_n);

   REQUIRE(token::contract::get_balance("eosio.token"_n, "bob"_n, symbol_code{"CERO"}) ==
           s2a("0 CERO"));
   t.alice.act<actions::transfer>("alice"_n, "bob"_n, s2a("200 CERO"), "hola");
   REQUIRE(token::contract::get_balance("eosio.token"_n, "bob"_n, symbol_code{"CERO"}) ==
           s2a("200 CERO"));

   expect(t.alice.trace<actions::open>("carol"_n, symbol{"INVALID", 0}, "alice"_n),
          "symbol does not exist");
   expect(t.alice.trace<actions::open>("carol"_n, symbol{"CERO", 1}, "alice"_n),
          "symbol precision mismatch");
}

TEST_CASE("Close token balance", "[close_tests]")
{
   token_tester t;

   t.eosio_token.act<actions::create>("alice"_n, s2a("1000 CERO"));
   REQUIRE(t.get_account_optional("alice"_n, symbol_code("CERO")) == std::nullopt);

   t.alice.act<actions::issue>("alice"_n, s2a("1000 CERO"), "hola");
   REQUIRE(token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"CERO"}) ==
           s2a("1000 CERO"));

   t.alice.act<actions::transfer>("alice"_n, "bob"_n, s2a("1000 CERO"), "hola");
   REQUIRE(token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"CERO"}) ==
           s2a("0 CERO"));

   t.alice.act<actions::close>("alice"_n, symbol{"CERO", 0});
   REQUIRE(t.get_account_optional("alice"_n, symbol_code("CERO")) == std::nullopt);
}
