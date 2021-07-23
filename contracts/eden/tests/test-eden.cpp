#include <accounts.hpp>
#include <boot/boot.hpp>
#include <distributions.hpp>
#include <eden-atomicassets.hpp>
#include <eden-atomicmarket.hpp>
#include <eden.hpp>
#include <elections.hpp>
#include <encrypt.hpp>
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

namespace eosio
{
   std::ostream& operator<<(std::ostream& os,
                            const std::pair<const eosio::block_timestamp, eosio::asset>& p)
   {
      os << '{' << eosio::convert_to_json(p.first.to_time_point()) << ':' << p.second << '}';
      return os;
   }
}  // namespace eosio

eosio::time_point s2t(const std::string& time)
{
   uint64_t value;
   eosio::check(eosio::string_to_utc_microseconds(value, time.data(), time.data() + time.size()),
                "bad time");
   return eosio::time_point{eosio::microseconds(value)};
}

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
   t.as("eosio.token"_n).act<token::actions::create>("eosio.token"_n, s2a("100000000.0000 EOS"));
   t.as("eosio.token"_n).act<token::actions::issue>("eosio.token"_n, s2a("100000000.0000 EOS"), "");
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
   atomicassets_setup(t);
   atomicmarket_setup(t);
   t.set_code("eden.gm"_n, "eden.wasm");
}

auto get_token_balance(eosio::name owner)
{
   return token::contract::get_balance("eosio.token"_n, owner, symbol_code{"EOS"});
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

template <typename T>
auto get_table_size(eosio::name scope)
{
   T tb("eden.gm"_n, scope.value);
   return std::distance(tb.begin(), tb.end());
}

template <typename T>
void dump_table()
{
   T tb("eden.gm"_n, eden::default_scope);
   for (const auto& record : tb)
   {
      std::cout << eosio::convert_to_json(record) << std::endl;
   }
}

std::vector<eosio::name> make_names(std::size_t count)
{
   std::vector<eosio::name> result;
   if (count <= 31 * 31)
   {
      auto test_account_base = "edenmember"_n;
      for (std::size_t i = 32; i < 1024 && result.size() != count; ++i)
      {
         if (i % 32)
         {
            result.push_back(eosio::name(test_account_base.value + (i << 4)));
         }
      }
   }
   else
   {
      auto test_account_base = "edenmembr"_n;
      for (int i = 1024; i < 32768 && result.size() != count; ++i)
      {
         if (i % 32 && (i / 32) % 32)
         {
            result.push_back(eosio::name(test_account_base.value + (i << 4)));
         }
      }
   }
   return result;
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

   explicit eden_tester(std::function<void()> f = [] {})
   {
      chain_setup(chain);
      token_setup(chain);
      chain.create_code_account("eden.gm"_n);
      f();
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
                                    attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6,
                                    "15:30", s2a("2.0000 EOS"));

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

   void create_accounts(const std::vector<eosio::name>& test_accounts)
   {
      for (auto account : test_accounts)
      {
         chain.start_block();
         chain.create_account(account);
         chain.as("eosio.token"_n)
             .act<token::actions::transfer>("eosio.token"_n, account, s2a("1000.0000 EOS"), "memo");
      }
   }

   void finish_induction(uint64_t induction_id,
                         eosio::name inviter,
                         eosio::name invitee,
                         const std::vector<eosio::name>& witnesses)
   {
      chain.as(invitee).act<token::actions::transfer>(invitee, "eden.gm"_n, s2a("10.0000 EOS"),
                                                      "memo");

      std::string video = "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS";
      eden::new_member_profile profile{invitee.to_string(),
                                       "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws",
                                       "Hi, I'm the coolest " + invitee.to_string() + " ever!",
                                       "{\"blog\":\"" + invitee.to_string() + ".example.com\"}"};
      chain.as(invitee).act<actions::inductprofil>(induction_id, profile);
      chain.as(inviter).act<actions::inductvideo>(inviter, induction_id, video);

      auto hash_data = eosio::convert_to_bin(std::tuple(video, profile));
      auto induction_hash = eosio::sha256(hash_data.data(), hash_data.size());

      chain.as(inviter).act<actions::inductendors>(inviter, induction_id, induction_hash);
      for (auto witness : witnesses)
      {
         chain.as(witness).act<actions::inductendors>(witness, induction_id, induction_hash);
      }
      chain.as(invitee).act<actions::inductdonate>(invitee, induction_id, s2a("10.0000 EOS"));
      CHECK(get_eden_membership(invitee).status() == eden::member_status::active_member);
   };

   void induct(eosio::name account)
   {
      alice.act<actions::inductinit>(42, "alice"_n, account, std::vector{"pip"_n, "egeon"_n});
      finish_induction(42, "alice"_n, account, {"pip"_n, "egeon"_n});
   }

   void induct_n(std::size_t count)
   {
      auto members = make_names(count);
      create_accounts(members);
      for (auto a : members)
      {
         chain.start_block();
         induct(a);
      }
   }

   void electseed(eosio::time_point_sec block_time, const char* expected = nullptr)
   {
      // This isn't a valid bitcoin block, but it meets the requirements that we actually check.
      char buf[80] =
          "\4\0\0\0"
          "00000000000000000000000000000000"
          "00000000000000000000000000000000"
          "\x00\x00\x00\x00"
          "\x00\x00\x00\x00"
          "\x00\x00\x00";
      uint32_t time = block_time.sec_since_epoch();
      memcpy(buf + 68, &time, 4);
      expect(eden_gm.trace<actions::electseed>(eosio::bytes{std::vector(buf, buf + sizeof(buf))}),
             expected);
   }

   void skip_to(std::string time)
   {
      uint64_t value;
      eosio::check(eosio::string_to_utc_microseconds(value, time.data(), time.data() + time.size()),
                   "bad time");
      skip_to(eosio::time_point{eosio::microseconds(value)});
   }
   void skip_to(eosio::time_point tp)
   {
      chain.finish_block();
      auto head_tp = chain.get_head_block_info().timestamp.to_time_point();
      auto skip = (tp - head_tp).count() / 1000 - 500;
      chain.start_block(skip);
   }

   void setup_election(uint32_t batch_size = 10000)
   {
      while (true)
      {
         auto trace = alice.trace<actions::electprocess>(batch_size);
         if (trace.except)
         {
            expect(trace, "Nothing to do");
            break;
         }
         chain.start_block();
      }
   }

   eosio::block_timestamp next_election_time() const
   {
      return *eden::elections{"eden.gm"_n}.get_next_election_time();
   }

   auto get_current_groups() const
   {
      std::map<uint64_t, std::vector<eosio::name>> groups;
      eden::vote_table_type vote_tb("eden.gm"_n, eden::default_scope);
      eden::current_election_state_singleton state("eden.gm"_n, eden::default_scope);
      auto config = std::get<eden::current_election_state_active>(state.get()).config;
      for (auto row : vote_tb.get_index<"bygroup"_n>())
      {
         groups[config.member_index_to_group(row.index)].push_back(row.member);
      }
      return groups;
   };

   void generic_group_vote(const auto& groups, uint8_t round)
   {
      for (const auto& [group_id, members] : groups)
      {
         chain.start_block();
         auto winner = *std::min_element(members.begin(), members.end());
         for (eosio::name member : members)
         {
            chain.as(member).act<actions::electvote>(round, member, winner);
         }
      }
      chain.start_block(2 * 60 * 60 * 1000);
      alice.act<actions::electprocess>(256);
   };

   void electdonate(eosio::name member)
   {
      chain.as(member).act<token::actions::transfer>(member, "eden.gm"_n, s2a("2.0000 EOS"),
                                                     "memo");
      chain.as(member).act<actions::electdonate>(member, s2a("2.0000 EOS"));
   }

   void electdonate_all()
   {
      eden::member_table_type members_tb{"eden.gm"_n, eden::default_scope};
      std::vector members(members_tb.begin(), members_tb.end());
      int i = 0;
      for (auto member : members)
      {
         if (++i % 25 == 0)
         {
            chain.start_block();
         }
         if (member.election_participation_status() == eden::no_donation)
         {
            chain.as(member.account())
                .act<token::actions::transfer>(member.account(), "eden.gm"_n, s2a("2.0000 EOS"),
                                               "memo");
            chain.as(member.account())
                .act<actions::electdonate>(member.account(), s2a("2.0000 EOS"));
         }
      }
   }

   void run_election(bool auto_donate = true, uint32_t batch_size = 10000)
   {
      if (auto_donate)
      {
         electdonate_all();
      }
      skip_to(next_election_time().to_time_point() - eosio::days(1));
      electseed(next_election_time().to_time_point() - eosio::days(1));
      skip_to(next_election_time().to_time_point());

      setup_election(batch_size);

      uint8_t round = 0;

      while (get_table_size<eden::vote_table_type>() > 11)
      {
         generic_group_vote(get_current_groups(), round++);
      }

      if (get_table_size<eden::vote_table_type>() != 0)
      {
         chain.start_block();
         electseed(chain.get_head_block_info().timestamp.to_time_point());
         chain.start_block(24 * 60 * 60 * 1000);
         alice.act<actions::electprocess>(256);
      }
   }

   void distribute(uint32_t batch_size = 256)
   {
      while (true)
      {
         auto trace = alice.trace<actions::distribute>(batch_size);
         if (trace.except)
         {
            expect(trace, "Nothing to do");
            break;
         }
         chain.start_block();
      }
   }

   void set_balance(eosio::asset amount)
   {
      eden::account_table_type account_tb{"eden.gm"_n, "owned"_n.value};
      auto balance = account_tb.get("master"_n.value).balance();
      if (balance < amount)
      {
         eosio_token.act<token::actions::transfer>("eosio.token"_n, "eden.gm"_n, amount - balance,
                                                   "memo");
      }
      else if (balance > amount)
      {
         eden_gm.act<actions::transfer>("eosio.token"_n, balance - amount, "memo");
      }
   }

   template <typename T>
   eosio::asset get_total_balance(const T& table)
   {
      eosio::asset result{s2a("0.0000 EOS")};
      for (auto item : table)
      {
         result += item.balance();
      }
      return result;
   }

   eosio::asset get_total_balance()
   {
      eden::account_table_type user_accounts{"eden.gm"_n, eden::default_scope};
      eden::account_table_type internal_accounts{"eden.gm"_n, "owned"_n.value};
      return get_total_balance(user_accounts) + get_total_balance(internal_accounts) +
             get_total_budget();
   }

   eosio::asset get_total_budget()
   {
      eden::distribution_account_table_type distributions{"eden.gm"_n, eden::default_scope};
      return get_total_balance(distributions);
   };

   auto get_budgets_by_period() const
   {
      std::map<eosio::block_timestamp, eosio::asset> result;
      eden::distribution_account_table_type distributions{"eden.gm"_n, eden::default_scope};
      for (auto t : distributions)
      {
         auto [iter, _] = result.insert(std::pair(t.distribution_time(), s2a("0.0000 EOS")));
         iter->second += t.balance();
      }
      return result;
   };
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

   t.eden_gm.act<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30", s2a("2.0000 EOS"));
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
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30", s2a("2.0000 EOS"));
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

   t.eden_gm.act<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30", s2a("2.0000 EOS"));
}

TEST_CASE("genesis")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30", s2a("2.0000 EOS"));

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
                                   attribute_map{}, s2a("1.0000 EOS"), 14 * 24 * 60 * 60, "", 6,
                                   "15:30", s2a("2.0000 EOS"));

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
   t.eden_gm.act<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30", s2a("2.0000 EOS"));

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

   for (auto member : {"alice"_n, "pip"_n, "egeon"_n})
   {
      t.chain.as(member).act<actions::setencpubkey>(member, eosio::public_key{});
   }
   t.alice.act<actions::inductinit>(4, "alice"_n, "bertie"_n, std::vector{"pip"_n, "egeon"_n});
   t.bertie.act<actions::setencpubkey>("bertie"_n, eosio::public_key{});
   t.alice.act<actions::inductmeetin>("alice"_n, 4, std::vector<eden::encrypted_key>(4),
                                      eosio::bytes{}, std::nullopt);
   CHECK(get_table_size<eden::encrypted_data_table_type>("induction"_n) == 1);
   t.bertie.act<token::actions::transfer>("bertie"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::pending_membership);

   // cannot endorse before video and profile are set
   auto blank_hash_data =
       eosio::convert_to_bin(std::tuple(std::string{}, eden::new_member_profile{}));
   expect(t.alice.trace<actions::inductendors>(
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
   expect(t.bertie.trace<actions::inductendors>("alice"_n, 4, induction_hash),
          "missing authority of alice");
   expect(t.bertie.trace<actions::inductendors>("bertie"_n, 4, induction_hash),
          "Induction can only be endorsed by inviter or a witness");
   expect(t.alice.trace<actions::inductendors>(
              "alice"_n, 4, eosio::sha256(hash_data.data(), hash_data.size() - 1)),
          "Outdated endorsement");

   auto endorse_all = [&] {
      t.alice.act<actions::inductendors>("alice"_n, 4, induction_hash);
      t.pip.act<actions::inductendors>("pip"_n, 4, induction_hash);
      t.egeon.act<actions::inductendors>("egeon"_n, 4, induction_hash);
   };
   endorse_all();
   t.chain.start_block();
   expect(t.alice.trace<actions::inductendors>("alice"_n, 4, induction_hash), "Already endorsed");

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
   CHECK(get_table_size<eden::encrypted_data_table_type>("induction"_n) == 0);
}

TEST_CASE("resignation")
{
   eden_tester t;
   t.genesis();
   t.alice.act<actions::resign>("alice"_n);
   CHECK(members{"eden.gm"_n}.is_new_member("alice"_n));
}

TEST_CASE("board resignation")
{
   eden_tester t;
   t.genesis();
   t.run_election();
   t.induct_n(4);
   t.alice.act<actions::resign>("alice"_n);
   t.egeon.act<actions::resign>("egeon"_n);
   t.pip.act<actions::resign>("pip"_n);
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

TEST_CASE("auction batch claim")
{
   eden_tester t;
   t.genesis();
   t.ahab.act<token::actions::transfer>("ahab"_n, eden::atomic_market_account, s2a("10.0000 EOS"),
                                        "deposit");
   t.ahab.act<atomicmarket::actions::auctionbid>("ahab"_n, 1, s2a("10.0000 EOS"), eosio::name{});
   t.chain.start_block(7 * 24 * 60 * 60 * 1000);
   t.chain.start_block();
   t.ahab.act<atomicmarket::actions::auctclaimbuy>(1);
   auto old_balance = get_token_balance("eden.gm"_n);
   t.eden_gm.act<actions::gc>(42);
   auto new_balance = get_token_balance("eden.gm"_n);
   // 0.5 EOS left deposited in atomicmarket
   // 0.1 EOS to each of the maker and taker marketplaces
   CHECK(new_balance - old_balance == s2a("9.3000 EOS"));
}

TEST_CASE("auction migration")
{
   eden_tester t;
   t.genesis();
   t.eden_gm.act<actions::unmigrate>();
   t.ahab.act<token::actions::transfer>("ahab"_n, eden::atomic_market_account, s2a("10.0000 EOS"),
                                        "deposit");
   t.ahab.act<atomicmarket::actions::auctionbid>("ahab"_n, 1, s2a("10.0000 EOS"), eosio::name{});
   t.chain.start_block(7 * 24 * 60 * 60 * 1000);
   t.chain.start_block();
   t.ahab.act<atomicmarket::actions::auctclaimbuy>(1);
   auto old_balance = get_token_balance("eden.gm"_n);
   expect(t.eden_gm.trace<actions::gc>(42), "Nothing to do");
   while (true)
   {
      t.chain.start_block();
      auto trace = t.eden_gm.trace<actions::migrate>(1);
      if (trace.except)
      {
         expect(trace, "Nothing to do");
         break;
      }
   }
   t.eden_gm.act<actions::gc>(42);
   auto new_balance = get_token_balance("eden.gm"_n);
   // 0.5 EOS left deposited in atomicmarket
   // 0.1 EOS to each of the maker and taker marketplaces
   CHECK(new_balance - old_balance == s2a("9.3000 EOS"));
}

TEST_CASE("induction gc")
{
   eden_tester t;
   t.genesis();

   auto test_accounts = make_names(38);
   t.create_accounts(test_accounts);

   // induct some members
   for (std::size_t i = 0; i < 34; ++i)
   {
      t.chain.start_block();  // don't run out of cpu
      auto account = test_accounts.at(i);
      auto induction_id = i + 4;
      t.alice.act<actions::inductinit>(induction_id, "alice"_n, account,
                                       std::vector{"pip"_n, "egeon"_n});
      t.finish_induction(induction_id, "alice"_n, account, {"pip"_n, "egeon"_n});
   }
   CHECK(members("eden.gm"_n).stats().active_members == 37);
   CHECK(members("eden.gm"_n).stats().pending_members == 0);

   // clear the auctions
   t.chain.start_block(8 * 24 * 60 * 60 * 1000);
   t.alice.act<actions::gc>(64);

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
      t.finish_induction(base_induction_id, test_accounts.at(0), invitee, {"pip"_n, "egeon"_n});
      CHECK(members("eden.gm"_n).stats().active_members == 37 + i + 1);
      CHECK(members("eden.gm"_n).stats().pending_members == 2 - i);
   }

   CHECK(get_table_size<eden::induction_table_type>() == 1);
   CHECK(get_table_size<eden::endorsement_table_type>() == 3);
   CHECK(get_table_size<eden::endorsed_induction_table_type>() == 0);
   CHECK(get_table_size<eden::induction_gc_table_type>() > 0);

   t.ahab.act<actions::gc>(32);  // ahab is not a member, but gc needs no permissions

   // clear the auctions
   t.chain.start_block(8 * 24 * 60 * 60 * 1000);
   t.alice.act<actions::gc>(64);

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
   expect(t.ahab.trace<actions::inductcancel>("ahab"_n, 104),
          "Induction can only be canceled by an endorser or the invitee itself");
   CHECK(get_table_size<eden::induction_table_type>() == 1);
   CHECK(get_eden_membership("bertie"_n).status() == eden::member_status::pending_membership);
}

TEST_CASE("deposit and spend")
{
   eden_tester t;
   t.eden_gm.act<actions::genesis>(
       "Eden", eosio::symbol("EOS", 4), s2a("10.0000 EOS"),
       std::vector{"alice"_n, "pip"_n, "egeon"_n}, "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
       attribute_map{}, s2a("1.0000 EOS"), 7 * 24 * 60 * 60, "", 6, "15:30", s2a("10.0000 EOS"));
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

TEST_CASE("election config")
{
   auto verify_cfg = [](const auto& config, uint16_t num_participants) {
      INFO("participants: " << num_participants)
      if (num_participants < 1)
      {
         CHECK(config.empty());
      }
      else
      {
         CHECK(config.back().num_groups == 1);
         CHECK(config.front().num_participants == num_participants);
         for (std::size_t i = 0; i < config.size() - 1; ++i)
         {
            CHECK(config[i].num_groups == config[i + 1].num_participants);
         }
         // There are at most two group sizes, except for the last round
         std::set<uint16_t> group_sizes;
         auto early_rounds = config;
         early_rounds.pop_back();
         for (const auto& round_config : early_rounds)
         {
            group_sizes.insert(round_config.group_max_size());
            if (round_config.num_short_groups())
            {
               group_sizes.insert(round_config.group_max_size() - 1);
            }
         }
         CHECK(group_sizes.size() <= 2);
         if (group_sizes.size() == 2)
         {
            CHECK(*group_sizes.begin() + 1 == *(--group_sizes.end()));
         }
      }
   };
   for (uint16_t i = 0; i <= 10000; ++i)
   {
      verify_cfg(eden::make_election_config(i), i);
   }
}

TEST_CASE("election")
{
   eden_tester t;
   t.genesis();
   t.electdonate_all();
   {
      eden::current_election_state_singleton state("eden.gm"_n, eden::default_scope);
      auto current = std::get<eden::current_election_state_registration>(state.get());
      CHECK(eosio::convert_to_json(current.start_time) == "\"2020-07-04T15:30:00.000\"");
   }
   t.skip_to("2020-07-03T15:29:59.500");
   t.electseed(eosio::time_point_sec(0x5f009260u), "Cannot start seeding yet");
   t.chain.start_block();
   t.electseed(eosio::time_point_sec(0x5f009260u));
   t.skip_to("2020-07-04T15:29:59.500");
   expect(t.alice.trace<actions::electprocess>(1), "Seeding window is still open");
   t.chain.start_block();
   t.setup_election();
   CHECK(get_table_size<eden::vote_table_type>() == 0);
   eden::election_state_singleton results("eden.gm"_n, eden::default_scope);
   auto result = std::get<eden::election_state_v0>(results.get());
   // This is likely to change as it depends on the exact random number algorithm and seed
   CHECK(result.lead_representative == "pip"_n);
   std::sort(result.board.begin(), result.board.end());
   CHECK(result.board == std::vector{"alice"_n, "egeon"_n, "pip"_n});
}

TEST_CASE("mid-election induction")
{
   eden_tester t;
   bool has_bertie = false;
   t.genesis();
   t.electdonate_all();
   SECTION("pre-registration")
   {
      t.skip_to("2020-06-04T15:29:59.500");
      t.induct("bertie"_n);
   }
   SECTION("registration")
   {
      t.skip_to("2020-06-04T15:30:00.000");
      has_bertie = true;
      t.induct("bertie"_n);
   }
   t.skip_to("2020-07-03T15:30:00.000");
   SECTION("pre-seed")
   {
      has_bertie = true;
      t.induct("bertie"_n);
   }
   t.electseed(s2t("2020-07-03T15:30:00.000"));
   SECTION("post-seed")
   {
      has_bertie = true;
      t.induct("bertie"_n);
   }
   t.skip_to("2020-07-04T15:30:00.000");
   for (int i = 0;; ++i)
   {
      DYNAMIC_SECTION("electprocess" << i)
      {
         has_bertie = true;
         t.induct("bertie"_n);
      }
      auto trace = t.eden_gm.trace<actions::electprocess>(1);
      if (trace.except)
      {
         expect(trace, "Nothing to do");
         break;
      }
      t.chain.start_block();
   }
   eden::election_state_singleton results("eden.gm"_n, eden::default_scope);
   auto result = std::get<eden::election_state_v0>(results.get());
   std::sort(result.board.begin(), result.board.end());
   CHECK(result.board == std::vector{"alice"_n, "egeon"_n, "pip"_n});

   if (has_bertie)
   {
      CHECK(get_table_size<eden::member_table_type>() == 4);
      CHECK(get_eden_membership("bertie"_n).election_participation_status() == eden::no_donation);
   }
   else
   {
      CHECK(get_table_size<eden::member_table_type>() == 3);
   }
   CHECK(eden::members{"eden.gm"_n}.stats().ranks == std::vector<uint16_t>{2, 1});
}

TEST_CASE("election with multiple rounds")
{
   constexpr std::size_t num_accounts = 200;  // 10000 takes too long
   eden_tester t;
   t.genesis();
   t.eden_gm.act<actions::electsettime>(s2t("2020-07-04T15:30:00.000"));
   auto test_accounts = make_names(num_accounts - 3);
   t.create_accounts(test_accounts);

   for (auto account : test_accounts)
   {
      t.chain.start_block();
      t.alice.act<actions::inductinit>(42, "alice"_n, account, std::vector{"pip"_n, "egeon"_n});
      t.finish_induction(42, "alice"_n, account, {"pip"_n, "egeon"_n});
   }
   t.electdonate_all();
   t.alice.act<actions::setencpubkey>("alice"_n, eosio::public_key{});
   t.pip.act<actions::setencpubkey>("pip"_n, eosio::public_key{});
   t.egeon.act<actions::setencpubkey>("egeon"_n, eosio::public_key{});
   for (auto account : test_accounts)
   {
      t.chain.start_block();
      t.chain.as(account).act<actions::setencpubkey>(account, eosio::public_key{});
   }

   t.skip_to("2020-07-03T15:30:00.000");
   t.electseed(eosio::time_point_sec(0x5f009260));
   t.skip_to("2020-07-04T15:30:00.000");
   t.setup_election();

   uint8_t round = 0;

   // With 200 members, there should be three rounds
   CHECK(get_table_size<eden::vote_table_type>() == 200);
   t.alice.act<actions::electmeeting>("alice"_n, 0,
                                      std::vector<eden::encrypted_key>{{}, {}, {}, {}},
                                      eosio::bytes{}, std::nullopt);
   t.generic_group_vote(t.get_current_groups(), round++);
   CHECK(get_table_size<eden::vote_table_type>() == 48);
   t.alice.act<actions::electmeeting>("alice"_n, 1,
                                      std::vector<eden::encrypted_key>{{}, {}, {}, {}},
                                      eosio::bytes{}, std::nullopt);
   t.generic_group_vote(t.get_current_groups(), round++);
   CHECK(get_table_size<eden::vote_table_type>() == 12);
   t.alice.act<actions::electmeeting>("alice"_n, 2,
                                      std::vector<eden::encrypted_key>{{}, {}, {}, {}},
                                      eosio::bytes{}, std::nullopt);
   t.generic_group_vote(t.get_current_groups(), round++);
   CHECK(get_table_size<eden::vote_table_type>() == 3);
   t.electseed(eosio::time_point_sec(0x5f010070));
   t.chain.start_block((15 * 60 + 30) * 60 * 1000);
   t.chain.start_block(24 * 60 * 60 * 1000);
   t.alice.act<actions::electprocess>(256);
   CHECK(get_table_size<eden::vote_table_type>() == 0);
   CHECK(get_table_size<eden::encrypted_data_table_type>("election"_n) == 0);

   eden::election_state_singleton results("eden.gm"_n, eden::default_scope);
   auto result = std::get<eden::election_state_v0>(results.get());
   // alice wins at every level but the last, because everyone votes for the member with the lowest name
   CHECK(std::find(result.board.begin(), result.board.end(), "alice"_n) != result.board.end());

   CHECK(members("eden.gm"_n).stats().ranks ==
         std::vector<uint16_t>{200 - 48, 48 - 12, 12 - 3, 3 - 1, 1});
}

TEST_CASE("budget distribution")
{
   eden_tester t;
   t.genesis();
   t.run_election();

   t.alice.act<actions::distribute>(250);
   CHECK(t.get_total_budget() == s2a("1.8000 EOS"));
   // Skip forward to the next distribution
   t.skip_to("2020-08-03T15:29:59.500");
   expect(t.alice.trace<actions::distribute>(250), "Nothing to do");
   t.chain.start_block();
   t.alice.act<actions::distribute>(250);
   CHECK(t.get_total_budget() == s2a("3.5100 EOS"));
   // Skip into the next election
   t.skip_to("2021-01-02T15:30:00.000");
   t.alice.act<actions::distribute>(1);
   t.alice.act<actions::distribute>(5000);
   CHECK(t.get_total_budget() == s2a("10.9435 EOS"));

   expect(t.egeon.trace<actions::fundtransfer>("egeon"_n, s2t("2020-07-04T15:30:00.000"), 1,
                                               "alice"_n, s2a("1.8001 EOS"), "memo"),
          "insufficient balance");
   expect(t.egeon.trace<actions::fundtransfer>("egeon"_n, s2t("2020-07-04T15:30:00.000"), 1,
                                               "alice"_n, s2a("-1.0000 EOS"), "memo"),
          "amount must be positive");
   expect(t.egeon.trace<actions::fundtransfer>("egeon"_n, s2t("2020-07-04T15:30:00.000"), 1,
                                               "ahab"_n, s2a("1.0000 EOS"), "memo"),
          "member ahab not found");

   t.egeon.act<actions::fundtransfer>("egeon"_n, s2t("2020-07-04T15:30:00.000"), 1, "alice"_n,
                                      s2a("1.8000 EOS"), "memo");
   CHECK(get_eden_account("alice"_n)->balance() == s2a("91.8000 EOS"));

   expect(t.alice.trace<actions::usertransfer>("alice"_n, "ahab"_n, s2a("10.0000 EOS"), "memo"),
          "member ahab not found");
   t.ahab.act<token::actions::transfer>("ahab"_n, "eden.gm"_n, s2a("10.0000 EOS"), "memo");
   expect(t.ahab.trace<actions::usertransfer>("ahab"_n, "alice"_n, s2a("10.0000 EOS"), "memo"),
          "member ahab not found");
   expect(t.egeon.trace<actions::usertransfer>("egeon"_n, "alice"_n, s2a("-1.0000 EOS"), "memo"),
          "amount must be positive");
   t.alice.act<actions::usertransfer>("alice"_n, "egeon"_n, s2a("2.0000 EOS"), "memo");
   CHECK(get_eden_account("alice"_n)->balance() == s2a("89.8000 EOS"));
   CHECK(get_eden_account("egeon"_n)->balance() == s2a("2.0000 EOS"));
   CHECK(get_eden_account("ahab"_n)->balance() == s2a("10.0000 EOS"));
}

TEST_CASE("budget distribution triggered by donation")
{
   eden_tester t;
   t.genesis();
   t.electdonate_all();
   t.set_balance(s2a("100.0000 EOS"));
   t.run_election();
   t.distribute(1);
   CHECK(t.get_total_budget() == s2a("5.0000 EOS"));
   t.skip_to("2020-08-03T15:29:59.500");
   t.set_balance(s2a("100.0000 EOS"));
   t.chain.start_block();
   CHECK(t.get_total_budget() == s2a("5.0000 EOS"));
   t.eosio_token.act<token::actions::transfer>("eosio.token"_n, "eden.gm"_n, s2a("5.0000 EOS"),
                                               "memo");
   CHECK(t.get_total_budget() == s2a("10.0000 EOS"));
   t.skip_to("2020-09-02T15:30:00.0000");
   t.eosio_token.act<token::actions::transfer>("eosio.token"_n, "eden.gm"_n, s2a("5.0000 EOS"),
                                               "memo");
   CHECK(t.get_total_budget() == s2a("15.0000 EOS"));
   t.skip_to("2020-10-02T15:30:00.0000");
   t.eosio_token.act<token::actions::transfer>("eosio.token"_n, "eden.gm"_n, s2a("5.0000 EOS"),
                                               "memo");
   CHECK(t.get_total_budget() == s2a("20.0000 EOS"));
}

TEST_CASE("budget distribution minimum period")
{
   eden_tester t;
   t.genesis();
   t.run_election();
   t.electdonate_all();
   t.set_balance(s2a("100000.0000 EOS"));
   t.eden_gm.act<actions::electsettime>(s2t("2020-09-02T15:30:01.000"));
   t.run_election();
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-07-04T15:30:00.000"), s2a("1.8000 EOS")},
       {s2t("2020-08-03T15:30:00.000"), s2a("5000.0000 EOS")},
       {s2t("2020-09-02T15:30:00.000"), s2a("0.0018 EOS")},
       {s2t("2020-09-02T15:30:01.000"), s2a("4749.9999 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
}

TEST_CASE("budget distribution exact")
{
   eden_tester t;
   t.genesis();
   t.run_election();
   t.electdonate_all();
   t.set_balance(s2a("1000.0000 EOS"));
   t.eden_gm.act<actions::electsettime>(s2t("2020-09-02T15:30:00.000"));
   t.run_election();
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-07-04T15:30:00.000"), s2a("1.8000 EOS")},
       {s2t("2020-08-03T15:30:00.000"), s2a("50.0000 EOS")},
       {s2t("2020-09-02T15:30:00.000"), s2a("47.5000 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
}

TEST_CASE("budget distribution underflow")
{
   eden_tester t;
   t.genesis();
   t.run_election();
   t.electdonate_all();
   t.set_balance(s2a("1000.0000 EOS"));
   t.eden_gm.act<actions::electsettime>(s2t("2020-09-02T15:30:01.000"));
   t.run_election();
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-07-04T15:30:00.000"), s2a("1.8000 EOS")},
       {s2t("2020-08-03T15:30:00.000"), s2a("50.0000 EOS")},
       {s2t("2020-09-02T15:30:01.000"), s2a("47.5000 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
}

TEST_CASE("budget distribution min")
{
   eden_tester t;
   t.genesis();
   auto members = make_names(100);
   t.create_accounts(members);
   for (auto a : members)
   {
      t.chain.start_block();
      t.induct(a);
   }
   t.run_election();
   t.set_balance(s2a("0.0020 EOS"));
   t.skip_to("2020-08-03T15:30:00.000");
   t.distribute();
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-07-04T15:30:00.000"), s2a("61.8000 EOS")},
       {s2t("2020-08-03T15:30:00.000"), s2a("0.0001 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
}

TEST_CASE("budget adjustment on resignation")
{
   eden_tester t;
   t.genesis();
   t.run_election();
   t.set_balance(s2a("1000.0000 EOS"));
   t.skip_to("2020-09-02T15:30:00.000");
   // egeon is satoshi, and receives the whole budget
   t.egeon.act<actions::resign>("egeon"_n);
   std::map<eosio::block_timestamp, eosio::asset> expected{};
   CHECK(t.get_budgets_by_period() == expected);
   t.skip_to("2020-10-02T15:30:00.000");
   t.distribute();
   CHECK(t.get_budgets_by_period() == expected);
   CHECK(accounts{"eden.gm"_n, "owned"_n}.get_account("master"_n)->balance() ==
         s2a("1001.8000 EOS"));
}

TEST_CASE("multi budget adjustment on resignation")
{
   eden_tester t;
   t.genesis();
   auto members = make_names(100);
   t.create_accounts(members);
   for (auto a : members)
   {
      t.chain.start_block();
      t.induct(a);
   }
   t.run_election();
   t.set_balance(s2a("10000.0000 EOS"));
   t.skip_to("2020-09-02T15:30:00.000");
   auto lead_representative =
       std::get<eden::election_state_v0>(
           eden::election_state_singleton{"eden.gm"_n, eden::default_scope}.get())
           .lead_representative;
   t.chain.as(lead_representative).act<actions::resign>(lead_representative);
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-07-04T15:30:00.000"), s2a("36.2560 EOS")},
       {s2t("2020-08-03T15:30:00.000"), s2a("293.3316 EOS")},
       {s2t("2020-09-02T15:30:00.000"), s2a("278.6656 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
   t.skip_to("2020-10-02T15:30:00.000");
   t.distribute();
   expected.insert({s2t("2020-10-02T15:30:00.000"), s2a("10.5028 EOS")});
   CHECK(t.get_budgets_by_period() == expected);
}

TEST_CASE("budget adjustment on kick")
{
   eden_tester t;
   t.genesis();
   t.run_election();
   t.set_balance(s2a("1000.0000 EOS"));
   t.eden_gm.act<actions::electsettime>(s2t("2020-09-02T15:30:00.000"));
   // egeon is satoshi, and receives the whole budget
   t.electdonate("pip"_n);
   t.electdonate("alice"_n);
   t.run_election(false, 1);
   std::map<eosio::block_timestamp, eosio::asset> expected{
       {s2t("2020-09-02T15:30:00.000"), s2a("47.6900 EOS")}};
   CHECK(t.get_budgets_by_period() == expected);
}

TEST_CASE("bylaws")
{
   eden_tester t;
   t.genesis();
   t.induct_n(3);
   t.run_election();
   auto state = std::get<eden::election_state_v0>(
       eden::election_state_singleton{"eden.gm"_n, eden::default_scope}.get());
   std::string bylaws = "xxx";
   auto bylaws_hash = eosio::sha256(bylaws.data(), bylaws.size());
   t.chain.as(state.lead_representative)
       .act<actions::bylawspropose>(state.lead_representative, bylaws);

   int i = 0;
   SECTION("basic")
   {
      for (auto board_member : state.board)
      {
         if (i++ == 5)
            break;
         t.chain.as(board_member).act<actions::bylawsapprove>(board_member, bylaws_hash);
      }
   }

   // Make sure that resigned members are not counted towards the limit
   SECTION("resign")
   {
      for (auto board_member : state.board)
      {
         if (board_member != state.lead_representative)
         {
            if (i++ >= 2)
            {
               t.chain.as(board_member).act<actions::bylawsapprove>(board_member, bylaws_hash);
            }
            else
            {
               t.chain.as(board_member).act<actions::bylawsapprove>(board_member, bylaws_hash);
               t.chain.as(board_member).act<actions::resign>(board_member);
            }
         }
      }
   }
}

TEST_CASE("accounting")
{
   eden_tester t;
   t.genesis();
   // should now have 30.0000 EOS, with a 90.0000 EOS deposit from alice
   CHECK(get_token_balance("eden.gm"_n) == s2a("120.0000 EOS"));
   expect(t.eden_gm.trace<actions::transfer>("eosio"_n, s2a("30.0001 EOS"), ""),
          "insufficient balance");
   t.eden_gm.act<actions::transfer>("eosio"_n, s2a("30.0000 EOS"), "");
   CHECK(get_token_balance("eden.gm"_n) == s2a("90.0000 EOS"));
   CHECK(get_token_balance("eosio"_n) == s2a("30.0000 EOS"));
}

TEST_CASE("pre-genesis balance")
{
   eden_tester t{[&] {
      t.eosio_token.act<token::actions::transfer>("eosio.token"_n, "eden.gm"_n, s2a("3.1415 EOS"),
                                                  "");
   }};
   t.genesis();
   CHECK(get_token_balance("eden.gm"_n) == t.get_total_balance());
}

TEST_CASE("account migration")
{
   eden_tester t;
   t.genesis();
   auto sum_accounts = [](eden::account_table_type& table) {
      auto total = s2a("0.0000 EOS");
      for (auto iter = table.begin(), end = table.end(); iter != end; ++iter)
      {
         CHECK(iter->balance().amount > 0);
         total += iter->balance();
      }
      return total;
   };

   {
      eden::account_table_type user_table{"eden.gm"_n, eden::default_scope};
      eden::account_table_type system_table{"eden.gm"_n, "owned"_n.value};
      CHECK(sum_accounts(user_table) + sum_accounts(system_table) ==
            get_token_balance("eden.gm"_n));
   }
   t.eden_gm.act<actions::unmigrate>();
   {
      eden::account_table_type user_table{"eden.gm"_n, eden::default_scope};
      eden::account_table_type system_table{"eden.gm"_n, "owned"_n.value};
      CHECK(sum_accounts(system_table) == s2a("0.0000 EOS"));
   }
   expect(t.alice.trace<actions::donate>("alice"_n, s2a("0.4200 EOS")), "must be migrated");

   while (true)
   {
      t.chain.start_block();
      t.alice.act<token::actions::transfer>("alice"_n, "eden.gm"_n, s2a("15.0000 EOS"), "");
      t.alice.act<actions::withdraw>("alice"_n, s2a("14.0000 EOS"));
      auto trace = t.eden_gm.trace<actions::migrate>(1);
      if (trace.except)
      {
         expect(trace, "Nothing to do");
         break;
      }
   }
   {
      eden::account_table_type user_table{"eden.gm"_n, eden::default_scope};
      eden::account_table_type system_table{"eden.gm"_n, "owned"_n.value};
      CHECK(sum_accounts(user_table) + sum_accounts(system_table) ==
            get_token_balance("eden.gm"_n));
   }

   t.set_balance(s2a("0.0000 EOS"));
   t.alice.act<actions::withdraw>("alice"_n, get_eden_account("alice"_n)->balance());
   t.eden_gm.act<token::actions::close>("eden.gm"_n, eosio::symbol("EOS", 4));
   t.eden_gm.act<actions::unmigrate>();
   t.eden_gm.act<actions::migrate>(100);
}

#ifdef ENABLE_SET_TABLE_ROWS

TEST_CASE("settablerows")
{
   eden_tester t;
   t.genesis();
   t.eden_gm.act<actions::settablerows>(
       eosio::name(eden::default_scope),
       std::vector<eden::table_variant>{
           eden::current_election_state_registration{s2t("2020-01-02T00:00:00.0000")}});
   eden::current_election_state_singleton state{"eden.gm"_n, eden::default_scope};
   auto value = std::get<eden::current_election_state_registration>(state.get());
   CHECK(value.start_time.to_time_point() == s2t("2020-01-02T00:00:00.0000"));
}

#endif
