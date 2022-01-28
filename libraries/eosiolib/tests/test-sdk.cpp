#include <eosio/tester.hpp>

#define CATCH_CONFIG_MAIN
#include <catch2/catch.hpp>

#include <bios/bios.hpp>
#include "contracts/get-code.hpp"

using namespace eosio;

TEST_CASE("get_code")
{
   test_chain chain;
   chain.set_code("eosio"_n, "clsdk/contracts/bios.wasm");
   bios::activate(chain, {
                             eosio::feature::get_code_hash,
                         });
   chain.create_code_account("getcode"_n);
   chain.set_code("getcode"_n, "test-contracts/get-code.wasm");
   chain.as("getcode"_n).act<get_code::actions::print>("alice"_n);
   chain.as("getcode"_n).act<get_code::actions::print>("eosio"_n);
   chain.as("getcode"_n).act<get_code::actions::print>("getcode"_n);
   chain.as("getcode"_n).act<get_code::actions::shouldhave>("eosio"_n);
   chain.as("getcode"_n).act<get_code::actions::shouldhave>("getcode"_n);
   chain.as("getcode"_n).act<get_code::actions::shouldnot>("alice"_n);
}
