
#define CATCH_CONFIG_MAIN

#include <tester_base.hpp>

TEST_CASE("Setup Eden chain with completed genesis")
{
   eden_tester t;
   t.genesis();
}
