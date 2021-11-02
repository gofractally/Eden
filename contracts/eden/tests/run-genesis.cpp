#define CATCH_CONFIG_MAIN

#include <nodeos-runner.hpp>

TEST_CASE("Setup Eden chain with basic completed genesis")
{
   nodeos_runner r("chain-genesis");

   r.tester.genesis();

   r.start_nodeos();
}
