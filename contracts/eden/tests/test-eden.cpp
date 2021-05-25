#include <accounts.hpp>
#include <boot/boot.hpp>
#include <eden-atomicassets.hpp>
#include <eden-atomicmarket.hpp>
#include <eden.hpp>
#include <eosio/tester.hpp>
#include <members.hpp>
#include <token/token.hpp>

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

using namespace eosio;
using namespace std::literals;
namespace atomicassets = eden::atomicassets;
namespace atomicmarket = eden::atomicmarket;
using atomicassets::attribute_map;
namespace actions = eden::actions;
using user_context = test_chain::user_context;
using eden::accounts;
using eden::members;

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
   t.set_code("atomicmarket"_n, "atomicmarket.wasm");
   t.as("atomicmarket"_n).act<atomicmarket::actions::init>();
   t.as("atomicmarket"_n)
       .act<atomicmarket::actions::addconftoken>("eosio.token"_n, eosio::symbol("EOS", 4));
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
}

auto get_token_balance(eosio::name owner)
{
   return token::contract::get_balance("eosio.token"_n, "alice"_n, symbol_code{"EOS"});
}

auto get_eden_account(eosio::name owner)
{
   return accounts{"eden.gm"_n}.get_account(owner);
}

auto get_eden_membership(eosio::name account)
{
   return members{"eden.gm"_n}.get_member(account);
}

auto get_globals()
{
   eden::tester_clear_global_singleton();
   eden::globals globals("eden.gm"_n);
   return globals.get();
}

template <typename T>
auto get_table_size()
{
   T tb("eden.gm"_n, eden::default_scope);
   return std::distance(tb.begin(), tb.end());
}

static const eden::new_member_profile alice_profile{
    "Alice", "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws",
    "Alice was beginning to get very tired of sitting by her sister on the bank, and of "
    "having nothing to do: once or twice she had peeped into the book her sister was "
    "reading, but it had no pictures or conversations in it, \"and what is the use of a "
    "book,\" thought Alice \"without pictures or conversations?\"",
    "{\"blog\":\"alice.example.com\"}", "Lewis Carroll"};

static const eden::new_member_profile pip_profile{
    "Philip Pirrip", "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws",
    "My father's family name being Pirrip and my Christian name Phillip, my infant "
    "tongue could make of both names nothing longer or more explicit than Pip.  So, I "
    "called myself Pip and came to be called Pip.",
    "{\"blog\":\"pip.example.com\"}", "Charles Dickens"};

static const eden::new_member_profile egeon_profile{
    "Egeon", "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws",
    "In Syracusa was I born, and wed\nUnto a woman happy but for me,\nAnd by me, had not "
    "our hap been bad.\nWith her I liv'd in joy; our wealth increas'd\nBy prosperous "
    "voyages I often made\nTo Epidamnum, till my factor's death,",
    "{\"blog\":\"egeon.example.com\"}", "William Shakespeare"};

static const eden::new_member_profile bertie_profile{
    "Bertie Wooster", "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws",
    "I'm a bit short on brain myself; the old bean would appear to have been constructed more for "
    "ornament than for use, don't you know; but give me five minutes to talk the thing over with "
    "Jeeves, and I'm game to advise any one about anything.",
    "{\"blog\":\"bertie.example.com\"}"};

static const eden::new_member_profile ahab_profile{
    "Captain Ahab", "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws",
    "Ahab's been in colleges, as well as 'mong the cannibals; been used to deeper wonders than the "
    "waves; fixed his fiery lance in mightier, stranger foes than whales.  His lance! aye, the "
    "keenest and the surest that out of all our isle"
    "{\"blog\":\"ahab.example.com\"}"};

struct eden_tester
{
   test_chain chain;
   user_context eosio_token = chain.as("eosio.token"_n);
   user_context eden_gm = chain.as("eden.gm"_n);
   user_context alice = chain.as("alice"_n);
   user_context pip = chain.as("pip"_n);
   user_context egeon = chain.as("egeon"_n);
   user_context bertie = chain.as("bertie"_n);
   user_context ahab = chain.as("ahab"_n);

   eden_tester()
   {
      chain_setup(chain);
      eden_setup(chain);
      for (auto account : {"alice"_n, "pip"_n, "egeon"_n, "bertie"_n, "ahab"_n})
      {
         chain.create_account(account);
         chain.as("eosio.token"_n)
             .act<token::actions::transfer>("eosio.token"_n, account, s2a("1000.0000 EOS"), "memo");
         chain.as("eosio.token"_n)
             .act<token::actions::transfer>("eosio.token"_n, account, s2a("1000.0000 OTHER"),
                                            "memo");
      }
   }
   void genesis()
   {
      eden_gm.act<actions::genesis>("Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
                                    std::vector{"alice"_n, "pip"_n, "egeon"_n},
                                    "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
                                    attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "");

      alice.act<actions::inductprofil>(1, alice_profile);
      pip.act<actions::inductprofil>(2, pip_profile);
      egeon.act<actions::inductprofil>(3, egeon_profile);

      alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("100.0000 EOS"), "memo");
      pip.act<token::actions::transfer>("pip"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
      egeon.act<token::actions::transfer>("egeon"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");

      alice.act<actions::inductdonate>("alice"_n, 1, s2a("10.0000 EOS"));
      pip.act<actions::inductdonate>("pip"_n, 2, s2a("10.0000 EOS"));
      egeon.act<actions::inductdonate>("egeon"_n, 3, s2a("10.0000 EOS"));
   }
};

TEST_CASE("genesis NFT pre-setup")
{
   eden_tester t;

   t.eden_gm.act<atomicassets::actions::createcol>(
       "eden.gm"_n, "eden.gm"_n, true, std::vector{"eden.gm"_n}, std::vector{"eden.gm"_n}, 0.05,
       atomicassets::attribute_map{});
   std::vector<atomicassets::format> schema{{"account", "string"}, {"name", "string"},
                                            {"img", "ipfs"},       {"bio", "string"},
                                            {"social", "string"},  {"video", "ipfs"}};
   t.eden_gm.act<atomicassets::actions::createschema>("eden.gm"_n, "eden.gm"_n, eden::schema_name,
                                                      schema);

   t.eden_gm.act<actions::genesis>("Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
                                   std::vector{"alice"_n, "pip"_n, "egeon"_n},
                                   "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
                                   attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "");
}

TEST_CASE("genesis NFT pre-setup with incorrect schema")
{
   eden_tester t;

   t.eden_gm.act<atomicassets::actions::createcol>(
       "eden.gm"_n, "eden.gm"_n, true, std::vector{"eden.gm"_n}, std::vector{"eden.gm"_n}, 0.05,
       atomicassets::attribute_map{});
   std::vector<atomicassets::format> schema{{"account", "uint64"}, {"name", "string"}};
   t.eden_gm.act<atomicassets::actions::createschema>("eden.gm"_n, "eden.gm"_n, eden::schema_name,
                                                      schema);

   auto trace = t.eden_gm.trace<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "");
   expect(trace, "there already is an attribute with the same name");
}

TEST_CASE("genesis NFT pre-setup with compatible schema")
{
   eden_tester t;

   t.eden_gm.act<atomicassets::actions::createcol>(
       "eden.gm"_n, "eden.gm"_n, true, std::vector{"eden.gm"_n}, std::vector{"eden.gm"_n}, 0.05,
       atomicassets::attribute_map{});
   std::vector<atomicassets::format> schema{{"social", "string"},
                                            {"pi", "float"},
                                            {"video", "ipfs"},
                                            {"account", "string"},
                                            {"name", "string"}};
   t.eden_gm.act<atomicassets::actions::createschema>("eden.gm"_n, "eden.gm"_n, eden::schema_name,
                                                      schema);

   t.eden_gm.act<actions::genesis>("Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
                                   std::vector{"alice"_n, "pip"_n, "egeon"_n},
                                   "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
                                   attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "");
}

TEST_CASE("genesis")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>("Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
                                   std::vector{"alice"_n, "pip"_n, "egeon"_n},
                                   "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
                                   attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "");

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("pip"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::pending_membership);

   t.alice.act<actions::inductprofil>(1, alice_profile);
   t.pip.act<actions::inductprofil>(2, pip_profile);
   t.egeon.act<actions::inductprofil>(3, egeon_profile);

   CHECK(get_eden_account("alice"_n) == std::nullopt);
   CHECK(get_token_balance("alice"_n) == s2a("1000.0000 EOS"));

   t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("100.0000 EOS"), "memo");
   t.pip.act<token::actions::transfer>("pip"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   t.egeon.act<token::actions::transfer>("egeon"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");

   CHECK(get_eden_account("alice"_n) != std::nullopt);
   CHECK(get_eden_account("alice"_n)->balance() == s2a("100.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("900.0000 EOS"));

   t.alice.act<actions::inductdonate>("alice"_n, 1, s2a("10.0000 EOS"));
   t.pip.act<actions::inductdonate>("pip"_n, 2, s2a("10.0000 EOS"));

   t.eden_gm.act<actions::addtogenesis>(
       "bertie"_n, t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(1));

   t.egeon.act<actions::inductdonate>("egeon"_n, 3, s2a("10.0000 EOS"));

   CHECK(get_globals().stage == eden::contract_stage::genesis);

   t.bertie.act<actions::inductprofil>(4, bertie_profile);
   t.bertie.act<token::actions::transfer>("bertie"_n, "eden.gm"_n, s2a("100.0000 EOS"), "memo");
   t.bertie.act<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS"));

   CHECK(get_eden_account("alice"_n) != std::nullopt);
   CHECK(get_eden_account("alice"_n)->balance() == s2a("90.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("900.0000 EOS"));

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("pip"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::active_member);

   CHECK(get_globals().stage == eden::contract_stage::active);

   CHECK(get_table_size<eden::induction_table_type>() == 0);
   CHECK(get_table_size<eden::endorsement_table_type>() == 0);
   CHECK(get_table_size<eden::member_table_type>() == 4);

   {
      auto template_id = get_eden_membership("alice"_n).nft_template_id();
      expect(t.eden_gm.trace<atomicassets::actions::mintasset>(
                 "eden.gm"_n, "eden.gm"_n, eden::schema_name, template_id, "alice"_n,
                 eden::atomicassets::attribute_map(), eden::atomicassets::attribute_map{},
                 std::vector<eosio::asset>()),
             "maxsupply has already been reached");
   }

   // Verify that all members have the same set of NFTs
   std::vector<int32_t> expected_assets;
   for (auto member : {"alice"_n, "pip"_n, "egeon"_n, "bertie"_n})
   {
      expected_assets.push_back(get_eden_membership(member).nft_template_id());
   }
   std::sort(expected_assets.begin(), expected_assets.end());
   for (auto member : {"alice"_n, "pip"_n, "egeon"_n, "bertie"_n, "atomicmarket"_n})
   {
      INFO(member.to_string() << "'s assets");
      auto assets = eden::atomicassets::assets_by_owner(eden::atomic_assets_account, member);
      std::sort(assets.begin(), assets.end());
      CHECK(assets == expected_assets);
   }
}

TEST_CASE("genesis expiration")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>("Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
                                   std::vector{"alice"_n, "pip"_n, "egeon"_n, "bertie"_n},
                                   "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
                                   attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "");

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("pip"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::pending_membership);

   t.alice.act<actions::inductprofil>(1, alice_profile);
   t.pip.act<actions::inductprofil>(2, pip_profile);
   t.egeon.act<actions::inductprofil>(3, egeon_profile);

   t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("100.0000 EOS"), "memo");
   t.pip.act<token::actions::transfer>("pip"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   t.egeon.act<token::actions::transfer>("egeon"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");

   t.alice.act<actions::inductdonate>("alice"_n, 1, s2a("10.0000 EOS"));
   t.pip.act<actions::inductdonate>("pip"_n, 2, s2a("10.0000 EOS"));
   t.egeon.act<actions::inductdonate>("egeon"_n, 3, s2a("10.0000 EOS"));

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("pip"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::active_member);

   CHECK(get_globals().stage == eden::contract_stage::genesis);

   // Wait for Bertie's genesis invitation to expire
   t.chain.start_block(7 * 24 * 60 * 60 * 1000);
   expect(t.alice.trace<actions::gc>(42), "Nothing to do");
   // Extend Bertie's invitation
   expect(t.eden_gm.trace<actions::gensetexpire>(
              4, t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(8)),
          "too far in the future");
   expect(t.eden_gm.trace<actions::gensetexpire>(
              4, t.chain.get_head_block_info().timestamp.to_time_point() - eosio::days(8)),
          "in the past");
   t.chain.start_block(10 * 1000);
   expect(t.eden_gm.trace<actions::gensetexpire>(
              4, t.chain.get_head_block_info().timestamp.to_time_point()),
          "in the past");
   t.eden_gm.trace<actions::gensetexpire>(
       4, t.chain.get_head_block_info().timestamp.to_time_point() + eosio::milliseconds(10500));
   expect(t.alice.trace<actions::gc>(42), "Nothing to do");
   t.chain.start_block(10 * 1000);
   expect(t.alice.trace<actions::gc>(42), "Nothing to do");
   t.chain.start_block();
   t.alice.act<actions::gc>(42);

   CHECK(get_globals().stage == eden::contract_stage::active);

   CHECK(members("eden.gm"_n).stats().active_members == 3);
   CHECK(members("eden.gm"_n).stats().pending_members == 0);
   CHECK(get_table_size<eden::induction_table_type>() == 0);
   CHECK(get_table_size<eden::endorsement_table_type>() == 0);
   CHECK(get_table_size<eden::member_table_type>() == 3);
}

TEST_CASE("genesis replacement")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>("Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
                                   std::vector{"alice"_n, "pip"_n, "egeon"_n},
                                   "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
                                   attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "");

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("pip"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::pending_membership);

   t.alice.act<actions::inductprofil>(1, alice_profile);
   t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("100.0000 EOS"), "memo");
   t.alice.act<actions::inductdonate>("alice"_n, 1, s2a("10.0000 EOS"));

   t.eden_gm.act<actions::inductcancel>("eden.gm"_n, 2);
   t.eden_gm.act<actions::addtogenesis>(
       "bertie"_n, t.chain.get_head_block_info().timestamp.to_time_point() + eosio::days(1));

   CHECK(get_eden_membership("alice"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::pending_membership);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::pending_membership);

   CHECK(members("eden.gm"_n).stats().active_members == 1);
   CHECK(members("eden.gm"_n).stats().pending_members == 2);
   CHECK(get_table_size<eden::induction_table_type>() == 2);
   CHECK(get_table_size<eden::endorsement_table_type>() == 4);

   t.egeon.act<actions::inductprofil>(3, egeon_profile);
   t.bertie.act<actions::inductprofil>(4, bertie_profile);

   t.egeon.act<token::actions::transfer>("egeon"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   t.bertie.act<token::actions::transfer>("bertie"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");

   t.egeon.act<actions::inductdonate>("egeon"_n, 3, s2a("10.0000 EOS"));
   t.bertie.act<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS"));

   CHECK(get_eden_membership("egeon"_n).status() == eden::member_status::active_member);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::active_member);

   CHECK(get_globals().stage == eden::contract_stage::active);

   CHECK(members("eden.gm"_n).stats().active_members == 3);
   CHECK(members("eden.gm"_n).stats().pending_members == 0);
   CHECK(get_table_size<eden::induction_table_type>() == 0);
   CHECK(get_table_size<eden::endorsement_table_type>() == 0);
   CHECK(get_table_size<eden::member_table_type>() == 3);

   // Verify that all members have the same set of NFTs
   std::vector<int32_t> expected_assets;
   for (auto member : {"alice"_n, "egeon"_n, "bertie"_n})
   {
      expected_assets.push_back(get_eden_membership(member).nft_template_id());
   }
   std::sort(expected_assets.begin(), expected_assets.end());
   for (auto member : {"alice"_n, "egeon"_n, "bertie"_n, "atomicmarket"_n})
   {
      INFO(member.to_string() << "'s assets");
      auto assets = eden::atomicassets::assets_by_owner(eden::atomic_assets_account, member);
      std::sort(assets.begin(), assets.end());
      CHECK(assets == expected_assets);
   }
   // The removed member should only have NFTs issued before his removal
   CHECK(eden::atomicassets::assets_by_owner(eden::atomic_assets_account, "pip"_n) ==
         std::vector<int32_t>{
             static_cast<int32_t>(get_eden_membership("alice"_n).nft_template_id())});
}

TEST_CASE("induction")
{
   eden_tester t;
   t.genesis();

   t.alice.act<actions::inductinit>(4, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   t.bertie.act<token::actions::transfer>("bertie"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::pending_membership);

   // cannot endorse before video and profile are set
   auto blank_hash_data =
       eosio::convert_to_bin(std::tuple(std::string{}, eden::new_member_profile{}));
   expect(t.alice.trace<actions::inductendorse>(
              "alice"_n, 4, eosio::sha256(blank_hash_data.data(), blank_hash_data.size())),
          "not set");

   expect(t.bertie.trace<actions::inductinit>(5, "bertie"_n, "ahab"_n,
                                              std::vector{"pip"_n, "egeon"_n}),
          "inactive member bertie");

   expect(t.alice.trace<actions::inductinit>(6, "alice"_n, "bertie"_n,
                                             std::vector{"pip"_n, "egeon"_n}),
          "already in progress");
   expect(t.alice.trace<actions::inductinit>(7, "alice"_n, "ahab"_n,
                                             std::vector{"alice"_n, "egeon"_n}),
          "inviter cannot be in the witnesses list");
   expect(t.alice.trace<actions::inductinit>(8, "alice"_n, "ahab"_n, std::vector{"pip"_n, "pip"_n}),
          "duplicated entry");
   expect(
       t.alice.trace<actions::inductinit>(9, "alice"_n, "ahab"_n, std::vector{"pip"_n, "bertie"_n}),
       "inactive member bertie");
   expect(
       t.alice.trace<actions::inductinit>(10, "alice"_n, "void"_n, std::vector{"pip"_n, "egeon"_n}),
       "Account void does not exist");

   std::string bertie_video = "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS";
   t.bertie.act<actions::inductprofil>(4, bertie_profile);
   t.alice.act<actions::inductvideo>("alice"_n, 4, bertie_video);  // Can be inviter or witness

   expect(t.bertie.trace<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS")),
          "induction is not fully endorsed");

   auto hash_data = eosio::convert_to_bin(std::tuple(bertie_video, bertie_profile));
   auto induction_hash = eosio::sha256(hash_data.data(), hash_data.size());
   expect(t.bertie.trace<actions::inductendorse>("alice"_n, 4, induction_hash),
          "missing authority of alice");
   expect(t.bertie.trace<actions::inductendorse>("bertie"_n, 4, induction_hash),
          "Induction can only be endorsed by inviter or a witness");
   expect(t.alice.trace<actions::inductendorse>(
              "alice"_n, 4, eosio::sha256(hash_data.data(), hash_data.size() - 1)),
          "Outdated endorsement");

   auto endorse_all = [&]
   {
      t.alice.act<actions::inductendorse>("alice"_n, 4, induction_hash);
      t.pip.act<actions::inductendorse>("pip"_n, 4, induction_hash);
      t.egeon.act<actions::inductendorse>("egeon"_n, 4, induction_hash);
   };
   endorse_all();
   t.chain.start_block();
   expect(t.alice.trace<actions::inductendorse>("alice"_n, 4, induction_hash), "Already endorsed");

   // changing the profile resets endorsements
   t.bertie.act<actions::inductprofil>(4, bertie_profile);
   expect(t.bertie.trace<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS")),
          "induction is not fully endorsed");
   t.chain.start_block();
   endorse_all();

   // changing the video resets endorsements
   t.pip.act<actions::inductvideo>("pip"_n, 4, bertie_video);
   expect(t.bertie.trace<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS")),
          "induction is not fully endorsed");
   t.chain.start_block();
   endorse_all();

   t.bertie.act<actions::inductdonate>("bertie"_n, 4, s2a("10.0000 EOS"));
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::active_member);
}

TEST_CASE("auction")
{
   eden_tester t;
   t.genesis();
   t.ahab.act<token::actions::transfer>("ahab"_n, eden::atomic_market_account, s2a("10.0000 EOS"),
                                        "deposit");
   t.ahab.act<atomicmarket::actions::auctionbid>("ahab"_n, 1, s2a("10.0000 EOS"), eosio::name{});
   t.chain.start_block(7 * 24 * 60 * 60 * 1000);
   t.chain.start_block();
   t.ahab.act<atomicmarket::actions::auctclaimbuy>(1);
   t.eden_gm.act<atomicmarket::actions::auctclaimsel>(1);
}

TEST_CASE("induction gc")
{
   eden_tester t;
   t.genesis();

   std::vector<eosio::name> test_accounts;
   auto test_account_base = "edenmember"_n;
   for (int i = 32; i < 100; ++i)
   {
      if (i % 32)
      {
         test_accounts.push_back(eosio::name(test_account_base.value + (i << 4)));
      }
   }
   // Initialize accounts
   for (auto account : test_accounts)
   {
      t.chain.start_block();
      t.chain.create_account(account);
      t.chain.as("eosio.token"_n)
          .act<token::actions::transfer>("eosio.token"_n, account, s2a("1000.0000 EOS"), "memo");
   }

   auto finish_induction = [&](uint64_t induction_id, eosio::name inviter, eosio::name invitee,
                               const std::vector<eosio::name>& witnesses)
   {
      t.chain.as(invitee).act<token::actions::transfer>(invitee, "eden.gm"_n, s2a("10.0000 EOS"),
                                                        "memo");

      std::string video = "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS";
      eden::new_member_profile profile{invitee.to_string(),
                                       "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws",
                                       "Hi, I'm the coolest " + invitee.to_string() + " ever!",
                                       "{\"blog\":\"" + invitee.to_string() + "example.com\"}"};
      t.chain.as(invitee).act<actions::inductprofil>(induction_id, profile);
      t.chain.as(inviter).act<actions::inductvideo>(inviter, induction_id, video);

      auto hash_data = eosio::convert_to_bin(std::tuple(video, profile));
      auto induction_hash = eosio::sha256(hash_data.data(), hash_data.size());

      t.chain.as(inviter).act<actions::inductendorse>(inviter, induction_id, induction_hash);
      for (auto witness : witnesses)
      {
         t.chain.as(witness).act<actions::inductendorse>(witness, induction_id, induction_hash);
      }
      t.chain.as(invitee).act<actions::inductdonate>(invitee, induction_id, s2a("10.0000 EOS"));
      CHECK(get_eden_membership(invitee).status() == eden::member_status::active_member);
   };

   // induct some members
   for (std::size_t i = 0; i < 34; ++i)
   {
      t.chain.start_block();  // don't run out of cpu
      auto account = test_accounts.at(i);
      auto induction_id = i + 4;
      t.alice.act<actions::inductinit>(induction_id, "alice"_n, account,
                                       std::vector{"pip"_n, "egeon"_n});
      finish_induction(induction_id, "alice"_n, account, {"pip"_n, "egeon"_n});
   }
   CHECK(members("eden.gm"_n).stats().active_members == 37);
   CHECK(members("eden.gm"_n).stats().pending_members == 0);

   for (std::size_t i = 0; i <= 2; ++i)
   {
      // many inductions for the same invitee
      t.chain.start_block();
      auto member_idx = i + 34;
      auto invitee = test_accounts.at(34 + i);
      uint64_t base_induction_id = 34 + 4 + i * 64;
      for (std::size_t j = 0; j < 32 + i; ++j)
      {
         auto inviter = test_accounts.at(j);
         auto induction_id = base_induction_id + j;
         t.chain.as(inviter).act<actions::inductinit>(induction_id, inviter, invitee,
                                                      std::vector{"pip"_n, "egeon"_n});
      }
   }

   expect(t.alice.trace<actions::gc>(32),
          "Nothing to do");  // lots of invites; none are available for gc

   // Complete some invites
   for (std::size_t i = 0; i <= 2; ++i)
   {
      t.chain.start_block();
      auto member_idx = i + 34;
      auto invitee = test_accounts.at(34 + i);
      uint64_t base_induction_id = 34 + 4 + i * 64;
      finish_induction(base_induction_id, test_accounts.at(0), invitee, {"pip"_n, "egeon"_n});
      CHECK(members("eden.gm"_n).stats().active_members == 37 + i + 1);
      CHECK(members("eden.gm"_n).stats().pending_members == 2 - i);
   }

   CHECK(get_table_size<eden::induction_table_type>() == 1);
   CHECK(get_table_size<eden::endorsement_table_type>() == 3);
   CHECK(get_table_size<eden::endorsed_induction_table_type>() == 0);
   CHECK(get_table_size<eden::induction_gc_table_type>() > 0);

   t.ahab.act<actions::gc>(32);  // ahab is not a member, but gc needs no permissions

   CHECK(get_table_size<eden::induction_table_type>() == 0);
   CHECK(get_table_size<eden::endorsement_table_type>() == 0);
   CHECK(get_table_size<eden::endorsed_induction_table_type>() == 0);
   CHECK(get_table_size<eden::induction_gc_table_type>() == 0);

   // An expired invitation
   t.alice.act<actions::inductinit>(42, "alice"_n, test_accounts.at(37),
                                    std::vector{"pip"_n, "egeon"_n});
   t.chain.start_block(1000 * 60 * 60 * 24 * 7);
   expect(t.alice.trace<actions::gc>(32), "Nothing to do");
   t.chain.start_block();
   t.alice.act<actions::gc>(32);

   CHECK(get_table_size<eden::induction_table_type>() == 0);
   CHECK(get_table_size<eden::endorsement_table_type>() == 0);
   CHECK(get_table_size<eden::endorsed_induction_table_type>() == 0);
   CHECK(get_table_size<eden::induction_gc_table_type>() == 0);

   CHECK(members("eden.gm"_n).stats().active_members == 40);
   CHECK(members("eden.gm"_n).stats().pending_members == 0);
}

TEST_CASE("induction cancelling")
{
   eden_tester t;
   t.genesis();

   // inviter can cancel
   t.alice.act<actions::inductinit>(101, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   t.alice.act<actions::inductcancel>("alice"_n, 101);
   CHECK(get_table_size<eden::induction_table_type>() == 0);

   // invitee can cancel
   t.alice.act<actions::inductinit>(102, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   t.bertie.act<actions::inductcancel>("bertie"_n, 102);
   CHECK(get_table_size<eden::induction_table_type>() == 0);

   // endorser can cancel
   t.alice.act<actions::inductinit>(103, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   t.pip.act<actions::inductcancel>("pip"_n, 103);
   CHECK(get_table_size<eden::induction_table_type>() == 0);

   t.alice.act<actions::inductinit>(104, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   expect(t.ahab.act<actions::inductcancel>("ahab"_n, 104),
          "Induction can only be canceled by an endorser or the invitee itself");
   CHECK(get_table_size<eden::induction_table_type>() == 1);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::pending_membership);
}

TEST_CASE("deposit and spend")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>("Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
                                   std::vector{"alice"_n, "pip"_n, "egeon"_n},
                                   "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
                                   attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "");
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

   expect(t.pip.trace<actions::withdraw>("pip"_n, s2a("10.0000 EOS")), "insufficient balance");
   expect(t.pip.trace<actions::withdraw>("alice"_n, s2a("10.0000 EOS")),
          "missing authority of alice");
   expect(t.alice.trace<actions::withdraw>("alice"_n, s2a("10.0001 EOS")), "insufficient balance");
   CHECK(get_eden_account("alice"_n)->balance() == s2a("10.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("990.0000 EOS"));
   t.alice.act<actions::withdraw>("alice"_n, s2a("4.0000 EOS"));
   CHECK(get_eden_account("alice"_n)->balance() == s2a("6.0000 EOS"));
   CHECK(get_token_balance("alice"_n) == s2a("994.0000 EOS"));
   t.alice.act<actions::withdraw>("alice"_n, s2a("6.0000 EOS"));
   CHECK(get_eden_account("alice"_n) == std::nullopt);
   CHECK(get_token_balance("alice"_n) == s2a("1000.0000 EOS"));
}
