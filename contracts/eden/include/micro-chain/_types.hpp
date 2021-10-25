#pragma once

#include <chainbase/chainbase.hpp>
#include <clchain/crypto.hpp>
#include <clchain/graphql_connection.hpp>
#include <clchain/subchain.hpp>
#include <constants.hpp>
#include <eden.hpp>
#include <eosio/abi.hpp>
#include <eosio/from_bin.hpp>
#include <eosio/to_bin.hpp>

namespace micro_chain
{
   eosio::name eden_account;
   eosio::name token_account;
   eosio::name atomic_account;
   eosio::name atomicmarket_account;

   constexpr eosio::name pool_account(eosio::name pool) { return eosio::name{pool.value | 0x0f}; }
   constexpr eosio::name master_pool = pool_account("master"_n);
   eosio::name distribution_fund;

   const eosio::name account_min = eosio::name{0};
   const eosio::name account_max = eosio::name{~uint64_t(0)};
   const eosio::block_timestamp block_timestamp_min = eosio::block_timestamp{0};
   const eosio::block_timestamp block_timestamp_max = eosio::block_timestamp{~uint32_t(0)};

   template <typename T>
   void dump(const T& ind)
   {
      printf("%s\n", eosio::format_json(ind).c_str());
   }

}  // namespace micro_chain

namespace boost
{
   BOOST_NORETURN void throw_exception(std::exception const& e)
   {
      eosio::detail::assert_or_throw(e.what());
   }
   BOOST_NORETURN void throw_exception(std::exception const& e, boost::source_location const& loc)
   {
      eosio::detail::assert_or_throw(e.what());
   }
}  // namespace boost