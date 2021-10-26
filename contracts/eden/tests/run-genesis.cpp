#include <nodeos-runner.hpp>

int main(int argc, char* argv[])
{
   nodeos_runner r("chain-genesis");

   r.tester.genesis();

   r.start_nodeos();
}
