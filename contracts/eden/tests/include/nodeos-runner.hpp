#pragma once

#include <tester-base.hpp>

struct nodeos_runner
{
   eden_tester tester;
   std::string runner_name;

   nodeos_runner(std::string runner_name) : runner_name(runner_name) {}

   void start_nodeos()
   {
      // tolerance blocks
      tester.chain.start_block();
      tester.chain.start_block();

      // copy state
      auto chain_path = tester.chain.get_path();
      eosio::execute("rm -rf " + runner_name);
      eosio::execute("mkdir -p " + runner_name + "/blocks");
      eosio::execute("cp " + chain_path + "/blocks/blocks.log " + runner_name + "/blocks");

      // run nodeos
      eosio::execute("nodeos -d " + runner_name +
                     " "                                       //
                     "--config-dir config "                    //
                     "--plugin eosio::chain_plugin "           //
                     "--plugin eosio::chain_api_plugin "       //
                     "--plugin eosio::producer_api_plugin "    //
                     "--plugin eosio::state_history_plugin "   //
                     "--plugin eosio::http_plugin "            //
                     "--trace-history --disable-replay-opts "  //
                     "--access-control-allow-origin \"*\" "    //
                     "--access-control-allow-header \"*\" "    //
                     "--http-validate-host 0 "                 //
                     "-e -p eosio");
   }
};
