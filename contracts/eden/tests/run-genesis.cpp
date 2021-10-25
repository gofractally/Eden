#define CATCH_CONFIG_MAIN

#include <tester_base.hpp>

const std::string setup_state_path = "chain-genesis";

TEST_CASE("Setup Eden chain with completed genesis")
{
   eden_tester t;
   t.genesis();

   // tolerance blocks before grabbing the log
   t.chain.start_block();
   t.chain.start_block();

   // copy state
   auto chain_path = t.chain.get_path();
   eosio::execute("rm -rf " + setup_state_path);
   eosio::execute("mkdir -p " + setup_state_path + "/blocks");
   eosio::execute("cp " + chain_path + "/blocks/blocks.log " + setup_state_path + "/blocks");

   // run nodeos
   eosio::execute("nodeos -d " + setup_state_path +
                  " "                                     //
                  "--config-dir config "                  //
                  "--plugin eosio::chain_api_plugin "     //
                  "--plugin eosio::producer_api_plugin "  //
                  "-e -p eosio");
}
