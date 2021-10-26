#include <nodeos-runner.hpp>

int main(int argc, char* argv[])
{
   nodeos_runner r("chain-full-election");

   r.tester.genesis();
   r.tester.run_election(true, 10000, true);
   r.tester.induct_n(100);
   r.tester.run_election(true, 10000, true);
   r.tester.skip_to("2021-02-01T15:30:00.000");
   r.tester.alice.act<actions::distribute>(250);

   r.start_nodeos();
}
