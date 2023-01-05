#include <badgechecker.hpp>
#include <eosio/tester.hpp>

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

using namespace eosio;
using user_context = test_chain::user_context;

void checker_setup(test_chain& t)
{
   t.create_code_account("badgechecker"_n);
   t.set_code("badgechecker"_n, "badgechecker.wasm");
}

struct checker_tester
{
   test_chain chain;
   user_context badgechecker = chain.as("badgechecker"_n);
   user_context genesiseden = chain.as("genesis.eden"_n);
   user_context alice = chain.as("alice"_n);
   user_context bob = chain.as("bob"_n);
   user_context pip = chain.as("pip"_n);

   checker_tester()
   {
      checker_setup(chain);

      chain.create_account("alice"_n);
      chain.create_account("bob"_n);
      chain.create_account("pip"_n);
      chain.create_account("genesis.eden"_n);
   }

   auto get_permission(eosio::name action) const
   {
      std::map<eosio::name, std::vector<eosio::name>> result;
      eden::permission_table_type permission_tb{"badgechecker"_n, action.value};

      for (auto t : permission_tb)
      {
         result.insert(std::pair(t.badge(), t.accounts()));
      }

      return result;
   };
};  // checker_tester

TEST_CASE("Create permission")
{
   checker_tester t;

   std::vector<eosio::name> accounts = {"alice"_n, "bob"_n, "pip"_n};

   expect(t.alice.trace<eden::actions::setauth>("fakeaction"_n, "badge"_n, accounts),
          "Missing required authority");

   expect(t.genesiseden.trace<eden::actions::setauth>("fakeaction"_n, "badge"_n, accounts),
          "Action fakeaction is not allowed by: genesis.eden");

   t.genesiseden.act<eden::actions::setauth>("givesimple"_n, "badge"_n, accounts);
   t.genesiseden.act<eden::actions::setauth>("initsimple"_n, "badge"_n, accounts);

   std::map<eosio::name, std::vector<eosio::name>> expected_givesimple = {{"badge"_n, accounts}};
   std::map<eosio::name, std::vector<eosio::name>> expected_initsimple = {{"badge"_n, accounts}};

   CHECK(t.get_permission("givesimple"_n) == expected_givesimple);
   CHECK(t.get_permission("initsimple"_n) == expected_initsimple);

   accounts.erase(accounts.begin());
   expected_givesimple["badge"_n].erase(expected_givesimple["badge"_n].begin());

   // remove one account for givesimple and check that initsimple does not get affected
   t.genesiseden.act<eden::actions::setauth>("givesimple"_n, "badge"_n, accounts);

   CHECK(t.get_permission("givesimple"_n) == expected_givesimple);
   CHECK(t.get_permission("initsimple"_n) == expected_initsimple);

   expected_initsimple["badge"_n].erase(expected_initsimple["badge"_n].begin());

   t.genesiseden.act<eden::actions::setauth>("initsimple"_n, "badge"_n, accounts);

   CHECK(t.get_permission("givesimple"_n) == expected_givesimple);
   CHECK(t.get_permission("initsimple"_n) == expected_initsimple);

   std::vector<eosio::name> max_accounts = {"acc"_n, "acc2"_n, "acc3"_n, "acc4"_n, "acc5"_n};

   t.genesiseden.act<eden::actions::setauth>("initsimple"_n, "badge"_n, max_accounts);

   max_accounts.push_back("acc11"_n);
   std::vector<eosio::name> no_accounts;

   expect(t.genesiseden.trace<eden::actions::setauth>("initsimple"_n, "badge"_n, max_accounts),
          "An action can only have a maximum of 5 accounts");

   t.genesiseden.act<eden::actions::setauth>("initsimple"_n, "badge"_n, no_accounts);

   std::map<eosio::name, std::vector<eosio::name>> expected_initsimple_no_accounts = {
       {"badge"_n, no_accounts}};

   CHECK(t.get_permission("givesimple"_n) == expected_givesimple);
   CHECK(t.get_permission("initsimple"_n) == expected_initsimple_no_accounts);
}
