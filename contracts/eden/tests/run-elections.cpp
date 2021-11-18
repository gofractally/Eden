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
   r.tester.eden_gm.act<actions::electsettime>(s2t("2021-11-18T04:12:00.000"));
   r.tester.start_election(true, 10000);

   r.start_nodeos();
}
