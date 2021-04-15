#pragma once

#include <config.hpp>
#include <eosio/asset.hpp>
#include <eosio/name.hpp>

namespace eden
{
   inline constexpr auto token_contract = "eosio.token"_n;
   inline constexpr uint64_t default_scope = 0;
   inline constexpr uint32_t induction_expiration_secs = 7 * 24 * 60 * 60;  // 1 week
}  // namespace eden
