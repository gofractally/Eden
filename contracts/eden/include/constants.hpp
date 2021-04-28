#pragma once

#include <array>
#include <config.hpp>
#include <eosio/asset.hpp>
#include <eosio/name.hpp>

namespace eden
{
   inline constexpr auto token_contract = "eosio.token"_n;
   inline constexpr uint64_t default_scope = 0;
   inline constexpr uint16_t max_active_members = 10000;
   inline constexpr uint32_t induction_expiration_secs = 7 * 24 * 60 * 60;  // 1 week
   inline constexpr double initial_market_fee = 0.05;
}  // namespace eden
