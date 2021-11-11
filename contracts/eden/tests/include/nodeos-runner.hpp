#pragma once

#include <tester-base.hpp>

#define CATCH_CONFIG_RUNNER

std::string runner_checkpoint;

int main(int argc, char* argv[])
{
   Catch::Session session;
   auto cli =
       session.cli() | Catch::clara::Opt(runner_checkpoint, "checkpoint")["-c"]["--checkpoint"](
                           "Stops execution at the given checkpoint label.");
   session.cli(cli);
   auto ret = session.applyCommandLine(argc, argv);
   if (ret)
      return ret;
   return session.run();
}

struct nodeos_runner
{
   eden_tester tester;
   std::string runner_name;

   nodeos_runner(std::string runner_name) : runner_name(runner_name) {}

   void checkpoint(const std::string& checkpoint)
   {
      if (runner_checkpoint == checkpoint)
      {
         start_nodeos();
         exit(0);
      }
   }

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
                     "--plugin eosio::chain_api_plugin "       //
                     "--plugin eosio::producer_api_plugin "    //
                     "--plugin eosio::state_history_plugin "   //
                     "--trace-history --disable-replay-opts "  //
                     "--access-control-allow-origin \"*\" "    //
                     "--access-control-allow-header \"*\" "    //
                     "--http-validate-host 0 "                 //
                     "--http-server-address 0.0.0.0:8888 "     //
                     "--state-history-endpoint 0.0.0.0:8080 "  //
                     "-e -p eosio");
   }
};