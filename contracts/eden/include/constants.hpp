#pragma once

#include <config.hpp>
#include <eosio/asset.hpp>
#include <eosio/name.hpp>

namespace eden
{
   inline constexpr auto token_contract = "eosio.token"_n;
   inline constexpr uint64_t default_scope = 0;
}  // namespace eden
