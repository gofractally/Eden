#include <eosio/tester.hpp>

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

#include <bios/bios.hpp>
#include "contracts/get-code.hpp"

using namespace eosio;

static void run_nodeos(test_chain& chain)
{
   chain.finish_block();
   chain.finish_block();

   eosio::execute("rm -rf example_chain");
   eosio::execute("mkdir -p example_chain/blocks");
   eosio::execute("cp " + chain.get_path() + "/blocks/blocks.log example_chain/blocks");

   eosio::execute(
       "./clsdk/bin/nodeos -d example_chain "
       "--config-dir example_config "
       "--plugin eosio::chain_api_plugin "
       "--access-control-allow-origin \"*\" "
       "--access-control-allow-header \"*\" "
       "--http-validate-host 0 "
       "--http-server-address 0.0.0.0:8888 "
       "--contracts-console "
       "-e -p eosio");
}

TEST_CASE("get_code")
{
   test_chain chain;
   chain.set_code("eosio"_n, "clsdk/contracts/bios.wasm");
   bios::activate(chain, {
                             eosio::feature::action_return_value,
                             eosio::feature::get_code_hash,
                         });
   chain.create_code_account("getcode"_n);
   chain.set_code("getcode"_n, "test-contracts/get-code.wasm");
   chain.set_abi("getcode"_n, "test-contracts/get-code.abi");
   chain.as("getcode"_n).act<get_code::actions::print>("alice"_n);
   chain.as("getcode"_n).act<get_code::actions::print>("eosio"_n);
   chain.as("getcode"_n).act<get_code::actions::print>("getcode"_n);
   chain.as("getcode"_n).act<get_code::actions::shouldhave>("eosio"_n);
   chain.as("getcode"_n).act<get_code::actions::shouldhave>("getcode"_n);
   chain.as("getcode"_n).act<get_code::actions::shouldnot>("alice"_n);

   auto result = chain.as("getcode"_n).act<get_code::actions::get>("getcode"_n);
   std::cout << "\naction returned: " << eosio::format_json(result) << "\n";
   CHECK(result.struct_version.value == 0);
   CHECK(result.code_sequence == 1);
   CHECK(result.hash != eosio::checksum256{});
   CHECK(result.vm_type == 0);
   CHECK(result.vm_version == 0);

   // run_nodeos(chain);

   // clsdk/bin/cleos push action getcode get '["eosio"]' -p getcode -j | jq .processed.action_traces[0].return_value_data
}
