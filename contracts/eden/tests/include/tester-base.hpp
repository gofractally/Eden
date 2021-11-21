#pragma once

#include <accounts.hpp>
#include <boot/boot.hpp>
#include <clchain/subchain_tester_dfuse.hpp>
#include <distributions.hpp>
#include <eden-atomicassets.hpp>
#include <eden-atomicmarket.hpp>
#include <eden.hpp>
#include <elections.hpp>
#include <encrypt.hpp>
#include <eosio/tester.hpp>
#include <events.hpp>
#include <fstream>
#include <members.hpp>
#include <token/token.hpp>

#define CATCH_CONFIG_RUNNER
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
                                    "15:30");

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

   void skip_to(std::string time) { chain.start_block(time); }

   void skip_to(eosio::time_point tp) { chain.start_block(tp); }

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

   void generic_group_vote(const auto& groups, uint8_t round, bool add_video = false)
   {
      for (const auto& [group_id, members] : groups)
      {
         chain.start_block();
         auto winner = *std::min_element(members.begin(), members.end());
         for (eosio::name member : members)
         {
            chain.as(member).act<actions::electvote>(round, member, winner);
            if (add_video)
               chain.as(member).act<actions::electvideo>(
                   round, member, "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws");
         }
      }
      chain.start_block(60 * 60 * 1000);
      alice.act<actions::electprocess>(256);
   };

   void electdonate(eosio::name member) { chain.as(member).act<actions::electopt>(member, true); }

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
         if (member.election_participation_status() == eden::not_in_election)
         {
            chain.as(member.account()).act<actions::electopt>(member.account(), true);
         }
      }
   }

   void start_election(bool auto_donate = true, uint32_t batch_size = 10000)
   {
      if (auto_donate)
      {
         electdonate_all();
      }
      skip_to(next_election_time().to_time_point() - eosio::days(1));
      electseed(next_election_time().to_time_point() - eosio::days(1));
      skip_to(next_election_time().to_time_point());

      setup_election(batch_size);
   }

   void run_election(bool auto_donate = true, uint32_t batch_size = 10000, bool add_video = false)
   {
      start_election(auto_donate, batch_size);

      uint8_t round = 0;

      while (get_table_size<eden::vote_table_type>() > 11)
      {
         generic_group_vote(get_current_groups(), round++, add_video);
      }

      if (get_table_size<eden::vote_table_type>() != 0)
      {
         chain.start_block();
         electseed(chain.get_head_block_info().timestamp.to_time_point());
         chain.start_block(2 * 60 * 60 * 1000);
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
#ifdef ENABLE_SET_TABLE_ROWS
         eden_gm.act<actions::settablerows>(
             "owned"_n, std::vector<eden::table_variant>{eden::account_v0{"master"_n, amount}});
         eden_gm.act<actions::settablerows>(
             "outgoing"_n,
             std::vector<eden::table_variant>{eden::account_v0{"eosio.token"_n, balance - amount}});
         eden_gm.act<token::actions::transfer>("eden.gm"_n, "eosio.token"_n, balance - amount,
                                               "memo");
#else
         eosio::check(false, "Cannot decrease balance");
#endif
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

   void write_dfuse_history(const char* filename)
   {
      chain.start_block();
      chain.start_block();
      dfuse_subchain::write_history(filename, chain);
   }
};
