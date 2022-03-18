#include <nodeos-runner.hpp>

TEST_CASE("Setup Eden chain with full, completed election")
{
   nodeos_runner r("chain-run-full-election");

   r.tester.genesis();
   r.tester.run_election(true, 10000, true);
   r.checkpoint("small_election");
   r.tester.induct_n(100);
   r.checkpoint("inductions");
   r.tester.run_election(true, 10000, true);
   r.checkpoint("full_election");

   r.start_nodeos();
}
