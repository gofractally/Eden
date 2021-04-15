#pragma once

#include <eosio/eosio.hpp>
#include <eosio/system.hpp>

namespace eden
{
   inline static uint128_t combine_names(const eosio::name a, const eosio::name b)
   {
      return uint128_t{a.value} << 64 | b.value;
   }
}  // namespace eden
