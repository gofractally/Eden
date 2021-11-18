#include <nodeos-runner.hpp>

TEST_CASE("Setup Eden chain with full election")
{
   nodeos_runner r("chain-run-elections");

   r.tester.genesis();
   r.tester.run_election(true, 10000, true);
   r.checkpoint("small_election");
   r.tester.induct_n(100);
   r.checkpoint("inductions");
   r.tester.run_election(true, 10000, true);
   r.checkpoint("full_election");
   r.tester.eden_gm.act<actions::electsettime>(
       time_point_sec{static_cast<uint32_t>(time(nullptr))});
   r.tester.start_election(true, 10000);

   r.start_nodeos();
}
