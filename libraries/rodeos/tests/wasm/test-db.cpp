#include <eosio/tester.hpp>
#include "test-db-contract.hpp"

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

using namespace eosio;
using namespace test_db;

TEST_CASE("xx", "")
{
   test_chain chain;
   test_rodeos rodeos;
   rodeos.connect(chain);
   rodeos.enable_queries(1024 * 1024, 10, 1000, "");

   chain.create_code_account(account);
   chain.set_code(account, "test-db-contract.wasm");

   chain.as(account).act<actions::write>();
   chain.as(account).act<actions::read>();

   chain.start_block();
   rodeos.sync_blocks();

   expect(rodeos.as().trace<actions::write>(), "unimplemented: db_store_i64");
   rodeos.as().act<actions::read>();

   chain.start_block();
   chain.start_block();
   execute(
       "rm -rf test-chains/test-db && "
       "mkdir -p test-chains/test-db/blocks && "
       "cp '" +
       chain.get_path() + "'/blocks/blocks.log test-chains/test-db/blocks");
}
