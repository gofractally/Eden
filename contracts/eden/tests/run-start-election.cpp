#include <nodeos-runner.hpp>

TEST_CASE("Setup Eden chain with start of full election")
{
   nodeos_runner r("chain-start-election");

   r.tester.genesis();
   r.tester.run_election(true, 10000, true);
   r.checkpoint("small_election");
   r.tester.induct_n(100);
   r.checkpoint("inductions");
   r.tester.eden_gm.act<actions::electsettime>(s2t("2021-11-16T18:45:00.000"));
   r.tester.start_election(true, 10000);

   r.start_nodeos();
}
