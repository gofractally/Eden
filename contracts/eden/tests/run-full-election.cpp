#define CATCH_CONFIG_MAIN

#include <nodeos-runner.hpp>

TEST_CASE("Setup Eden chain with full election")
{
   nodeos_runner r("chain-full-election");

   r.tester.genesis();
   r.tester.run_election(true, 10000, true);
   r.tester.induct_n(100);
   r.tester.run_election(true, 10000, true);

   r.start_nodeos();
}
