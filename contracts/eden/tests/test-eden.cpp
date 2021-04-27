#include <accounts.hpp>
#include <boot/boot.hpp>
#include <eden-atomicassets.hpp>
#include <eden.hpp>
#include <eosio/tester.hpp>
#include <token/token.hpp>

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

using namespace eosio;
using namespace std::literals;
namespace atomicassets = eden::atomicassets;
namespace actions = eden::actions;
using user_context = test_chain::user_context;
using eden::accounts;

void chain_setup(test_chain& t)
{
   t.set_code("eosio"_n, "boot.wasm");
   t.as("eosio"_n).act<boot::actions::boot>();
   t.start_block();  // preactivate feature activates protocol features at the start of a block
   t.set_code("eosio"_n, "bios.wasm");
}

void token_setup(test_chain& t)
{
   t.create_code_account("eosio.token"_n);
   t.set_code("eosio.token"_n, "token.wasm");
   t.as("eosio.token"_n).act<token::actions::create>("eosio.token"_n, s2a("1000000.0000 EOS"));
   t.as("eosio.token"_n).act<token::actions::issue>("eosio.token"_n, s2a("1000000.0000 EOS"), "");
   t.as("eosio.token"_n).act<token::actions::create>("eosio.token"_n, s2a("1000000.0000 OTHER"));
   t.as("eosio.token"_n).act<token::actions::issue>("eosio.token"_n, s2a("1000000.0000 OTHER"), "");
}

void atomicmarket_setup(test_chain& t)
{
   t.create_code_account("atomicmarket"_n);
   //t.set_code("atomicmarket"_n, "atomicmarket.wasm");
}

void atomicassets_setup(test_chain& t)
{
   t.create_code_account("atomicassets"_n);
   t.set_code("atomicassets"_n, "atomicassets.wasm");
   t.as("atomicassets"_n).act<atomicassets::actions::init>();
}

void eden_setup(test_chain& t)
{
   token_setup(t);
   atomicassets_setup(t);
   atomicmarket_setup(t);
   t.create_code_account("eden.gm"_n);
   t.set_code("eden.gm"_n, "eden.wasm");
   t.as("eden.gm"_n)
       .act<atomicassets::actions::createcol>("eden.gm"_n, eden::collection_name, true,
                                              std::vector{"eden.gm"_n}, std::vector{"eden.gm"_n},
                                              0.05, atomicassets::attribute_map{});
   std::vector<atomicassets::format> schema{{"edenacc", "string"}, {"name", "string"},
                                            {"img", "string"},     {"bio", "string"},
                                            {"social", "string"},  {"inductionvid", "string"}};
   t.as("eden.gm"_n)
       .act<atomicassets::actions::createschema>("eden.gm"_n, eden::collection_name,
                                                 eden::schema_name, schema);
}

auto get_token_balance(eosio::name owner)
{
   return token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"EOS"});
}

auto get_eden_account(eosio::name owner)
{
   return accounts{"eden.gm"_n}.get_account(owner);
}

struct eden_tester
{
   test_chain chain;
   user_context eosio_token = chain.as("eosio.token"_n);
   user_context eden_gm = chain.as("eden.gm"_n);
   user_context alice = chain.as("alice"_n);
   user_context pip = chain.as("pip"_n);
   user_context egeon = chain.as("egeon"_n);

   eden_tester()
   {
      chain_setup(chain);
      eden_setup(chain);
      chain.create_account("alice"_n);
      chain.create_account("pip"_n);
      chain.create_account("egeon"_n);
   }
};

TEST_CASE("genesis")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>("Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
                                   std::vector{"alice"_n, "pip"_n, "egeon"_n}, "IPFS video",
                                   s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "");
   t.alice.act<actions::inductprofil>(
       1, eden::new_member_profile{
              "Alice", "IPFS Image",
              "Alice was beginning to get very tired of sitting by her sister on the bank, and of "
              "having nothing to do: once or twice she had peeped into the book her sister was "
              "reading, but it had no pictures or conversations in it, \"and what is the use of a "
              "book,\" thought Alice \"without pictures or conversations?\"",
              "{\"blog\":\"alice.example.com\"}"});
   t.pip.act<actions::inductprofil>(
       2, eden::new_member_profile{
              "Philip Pirrip", "IPFS image",
              "My father's family name being Pirrip and my Christian name Phillip, my infant "
              "tongue could make of both names nothing longer or more explicit than Pip.  So, I "
              "called myself Pip and came to be called Pip.",
              "{\"blog\":\"pip.example.com\"}"});
   t.egeon.act<actions::inductprofil>(
       3, eden::new_member_profile{
              "Egeon", "IPFS image",
              "In Syracusa was I born, and wed\nUnto a woman happy but for me,\nAnd by me, had not "
              "our hap been bad.\nWith her I liv'd in joy; our wealth increas'd\nBy prosperous "
              "voyages I often made\nTo Epidamnum, till my factor's death,",
              "{\"blog\":\"egeon.example.com\"}"});

   eden::globals globals("eden.gm"_n);
   CHECK(globals.get().stage == eden::contract_stage::active);
}

TEST_CASE("deposit and spend")
{
   eden_tester t;
   t.chain.as("eosio.token"_n)
       .act<token::actions::transfer>("eosio.token"_n, "alice"_n, s2a("1000.0000 EOS"), "memo");
   t.chain.as("eosio.token"_n)
       .act<token::actions::transfer>("eosio.token"_n, "alice"_n, s2a("1000.0000 OTHER"), "memo");
   t.eden_gm.act<actions::genesis>("Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
                                   std::vector{"alice"_n, "pip"_n, "egeon"_n}, "IPFS video",
                                   s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "");
   expect(
       t.alice.trace<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("9.9999 EOS"), "memo"),
       "Contract not active");

   t.alice.act<actions::inductprofil>(
       1, eden::new_member_profile{"Alice", "IPFS Image", "bio", "social"});
   t.pip.act<actions::inductprofil>(
       2, eden::new_member_profile{"Philip Pirrip", "IPFS image", "bio", "social"});
   t.egeon.act<actions::inductprofil>(
       3, eden::new_member_profile{"Egeon", "IPFS image", "bio", "social"});

   expect(t.alice.trace<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("10.0000 OTHER"),
                                                  "memo"),
          "token must be a valid 4,EOS");
   expect(
       t.alice.trace<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("9.9999 EOS"), "memo"),
       "insufficient deposit to open an account");
   CHECK(get_eden_account("alice"_n) == std::nullopt);
   t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   CHECK(get_eden_account("alice"_n) != std::nullopt);
   CHECK(get_eden_account("alice"_n)->balance() == s2a("10.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("990.0000 EOS"));

   expect(t.pip.trace<actions::withdraw>("pip"_n, s2a("10.0000 EOS")), "insufficient deposit");
   expect(t.pip.trace<actions::withdraw>("alice"_n, s2a("10.0000 EOS")),
          "missing authority of alice");
   expect(t.alice.trace<actions::withdraw>("alice"_n, s2a("10.0001 EOS")), "insufficient deposit");
   CHECK(get_eden_account("alice"_n)->balance() == s2a("10.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("990.0000 EOS"));
   t.alice.act<actions::withdraw>("alice"_n, s2a("4.0000 EOS"));
   CHECK(get_eden_account("alice"_n)->balance() == s2a("6.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("994.0000 EOS"));
   t.alice.act<actions::withdraw>("alice"_n, s2a("6.0000 EOS"));
   CHECK(get_eden_account("alice"_n) == std::nullopt);
   CHECK(get_token_balance("alice"_n) == s2a("1000.0000 EOS"));
}
